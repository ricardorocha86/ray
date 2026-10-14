#!/usr/bin/env python3
"""Narração do vídeo com o TTS do Gemini.

A narração vem primeiro: cada trecho do vídeo passa a durar o tempo da sua fala.

    python3 narrar.py amostra 2,13,26   gera só esses trechos, para testar a voz (output/audio/amostra.wav)
    python3 narrar.py tts               gera os trechos que faltam e escreve src/duracoes.js
    python3 narrar.py conferir          transcreve os trechos com o Gemini e compara com o texto
    python3 narrar.py mix               junta a trilha de narração ao vídeo renderizado

Ordem completa: ver gerar_video_narrado.sh.

Variáveis de ambiente:
    GEMINI_API_KEY      chave da API (obrigatória)
    GEMINI_TTS_MODEL    modelo de voz (padrão: o primeiro disponível de TTS_MODELS)
    GEMINI_TTS_VOICE    voz pré-definida do Gemini (padrão: Charon)
    GEMINI_TEXT_MODEL   modelo usado em "conferir" (padrão: o primeiro disponível de TEXT_MODELS)

Para economizar cota (o plano gratuito tem poucos pedidos por dia por modelo), vários trechos vão
num mesmo pedido, separados por [long pause]. O modelo de texto do Gemini ouve o lote e informa
onde começa cada trecho; o corte é feito no silêncio mais próximo. O áudio bruto de cada lote fica
guardado em output/audio/lotes, então refazer um corte não gasta cota. "conferir" transcreve cada
clipe e compara com o texto.
"""
import base64
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.request
import wave

import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'output')
AUDIO = os.path.join(OUT, 'audio')
CACHE = os.path.join(AUDIO, 'trechos.json')
API = 'https://generativelanguage.googleapis.com/v1beta/'

TTS_MODELS = ['gemini-3.8-flash-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts']
TEXT_MODELS = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash']
VOICE = os.environ.get('GEMINI_TTS_VOICE', 'Charon')
# Formato de prompt recomendado para o TTS do Gemini: notas de direção separadas da
# transcrição. Só o que vem depois de TRANSCRIPT deve ser falado (conferido em synth_batch).
STYLE = ("# AUDIO PROFILE: Narrador\n"
         "## Professor de eletrônica, calmo e didático, orientando uma montagem no laboratório.\n\n"
         "### DIRECTOR'S NOTES\n"
         "Idioma: português do Brasil.\n"
         "Estilo: voz calma, clara e acolhedora, explicando com paciência.\n"
         "Ritmo: natural. Entre um parágrafo e o seguinte, faça uma pausa longa, de cerca de dois segundos.\n\n"
         "#### TRANSCRIPT\n")
MIN_SIM = 0.75             # semelhança mínima entre a transcrição e o texto de cada trecho
BATCH_WORDS = 300          # ~2 min de fala por pedido
PAUSE_TAG = '\n\n[long pause]\n\n'   # marcação de pausa do TTS do Gemini entre trechos
RATE = 24000


# ------------------------------------------------------------------ API
def key():
    k = os.environ.get('GEMINI_API_KEY')
    if not k:
        sys.exit('Defina a variável GEMINI_API_KEY com a chave da API do Gemini.')
    return k


class Busy(RuntimeError):
    pass


def call(method, path, body=None, attempts=6):
    data = json.dumps(body).encode() if body is not None else None
    for i in range(attempts):
        req = urllib.request.Request(API + path, data=data, method=method,
                                     headers={'x-goog-api-key': key(), 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            txt = e.read().decode(errors='replace')
            if e.code in (429, 500, 502, 503, 504) and i < attempts - 1:
                if e.code == 429 and 'PerDay' in txt:
                    sys.exit('Cota diária deste modelo esgotada (o limite é por modelo). Tente mais tarde ou use outro '
                             'modelo com GEMINI_TTS_MODEL; os trechos já gerados ficam guardados.\n' + txt[:400])
                m = re.search(r'"retryDelay":\s*"(\d+)', txt)
                wait = int(m.group(1)) + 2 if m else 10 * (i + 1)
                print(f'  servidor respondeu {e.code}; nova tentativa em {wait} s')
                time.sleep(wait)
                continue
            if e.code == 503:
                raise Busy(f'HTTP 503: {txt[:300]}')
            raise RuntimeError(f'HTTP {e.code}: {txt[:600]}')
        except (urllib.error.URLError, TimeoutError) as e:
            if i < attempts - 1:
                time.sleep(5 * (i + 1))
                continue
            raise
    raise RuntimeError('sem resposta da API')


_models = None


def pick(candidates, env):
    global _models
    if os.environ.get(env):
        return os.environ[env]
    if _models is None:
        _models = {m['name'].split('/')[-1] for m in call('GET', 'models?pageSize=200').get('models', [])}
    for m in candidates:
        if m in _models:
            return m
    sys.exit(f'Nenhum destes modelos está disponível para esta chave: {candidates}')


def tts(text, model):
    body = {
        'contents': [{'parts': [{'text': STYLE + text}]}],
        'generationConfig': {
            'responseModalities': ['AUDIO'],
            'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': VOICE}}},
        },
    }
    r = call('POST', f'models/{model}:generateContent', body)
    part = r['candidates'][0]['content']['parts'][0]['inlineData']
    m = re.search(r'rate=(\d+)', part.get('mimeType', ''))
    if m and int(m.group(1)) != RATE:
        raise RuntimeError('taxa de amostragem inesperada: ' + part['mimeType'])
    return np.frombuffer(base64.b64decode(part['data']), dtype='<i2').astype(np.float32) / 32768.0


# ------------------------------------------------------------- arquivos
def falas():
    src = open(os.path.join(ROOT, 'src', 'falas.js'), encoding='utf-8').read()
    return json.loads(src[src.index('['):src.rindex(']') + 1])


def load_cache():
    return json.load(open(CACHE)) if os.path.exists(CACHE) else {}


def save_cache(c):
    json.dump(c, open(CACHE, 'w'), indent=1, ensure_ascii=False)


def write_wav(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())


def write_flac(path, x):
    tmp = path + '.tmp.wav'
    write_wav(tmp, x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-compression_level', '8', path], check=True)
    os.remove(tmp)


def read_audio(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', str(RATE), '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0


def fhash(text, model):
    return hashlib.sha1(f'{model}|{VOICE}|{STYLE}|{text}'.encode()).hexdigest()[:16]


def words(s):
    return len(s.split())


# ------------------------------------------------------- corte nas pausas
def silence_runs(x, hop_s=0.01):
    hop = int(RATE * hop_s)
    n = len(x) // hop
    rms = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1))
    thr = max(np.percentile(rms, 95) * 0.04, 2e-4)
    quiet = rms < thr
    runs, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            runs.append((i * hop, j * hop))
            i = j
        else:
            i += 1
    return runs


def trim(x, pad=0.08):
    runs = silence_runs(x)
    a, b = 0, len(x)
    if runs and runs[0][0] == 0:
        a = runs[0][1]
    if runs and runs[-1][1] >= len(x) - int(RATE * 0.01):
        b = runs[-1][0]
    p = int(RATE * pad)
    return x[max(0, a - p):min(len(x), b + p)]


def norm(s):
    s = unicodedata.normalize('NFKD', s.lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9 ]+', ' ', s).split()


def similarity(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def transcribe(clips):
    """Transcreve vários clipes num só pedido ao modelo de texto."""
    parts = [{'text': f'Abaixo há {len(clips)} áudios curtos em português. Transcreva cada um, na ordem, '
                      'palavra por palavra, escrevendo números por extenso como foram falados. Responda só com '
                      'uma lista JSON de strings, uma por áudio.'}]
    parts += [audio_part(x) for x in clips]
    return [str(t) for t in text_call(parts)]


def text_call(parts):
    """Pedido ao modelo de texto; se um modelo estiver sobrecarregado, tenta o próximo."""
    pick(TEXT_MODELS, 'GEMINI_TEXT_MODEL')
    models = [os.environ['GEMINI_TEXT_MODEL']] if os.environ.get('GEMINI_TEXT_MODEL') else [m for m in TEXT_MODELS if m in _models]
    for m in models:
        try:
            r = call('POST', f'models/{m}:generateContent',
                     {'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json'}},
                     attempts=3)
            return json.loads(r['candidates'][0]['content']['parts'][0]['text'])
        except Busy:
            print(f'    {m} sobrecarregado; tentando outro modelo')
        except RuntimeError as e:
            if '429' not in str(e):
                raise
            print(f'    {m} sem cota; tentando outro modelo')
    raise RuntimeError('nenhum modelo de texto disponível agora')


def audio_part(x, rate=16000):
    """Áudio em WAV (16 kHz) para enviar ao modelo de texto."""
    y = np.interp(np.arange(0, len(x), RATE / rate), np.arange(len(x)), x).astype(np.float32)
    tmp = os.path.join(AUDIO, '_tmp.wav')
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())
    data = base64.b64encode(open(tmp, 'rb').read()).decode()
    os.remove(tmp)
    return {'inlineData': {'mimeType': 'audio/wav', 'data': data}}


def paragraph_starts(x, texts):
    """Pergunta ao modelo de texto em que instante começa cada parágrafo do lote."""
    lista = '\n'.join(f'{i + 1}. {t}' for i, t in enumerate(texts))
    prompt = (f'O áudio é a leitura, em ordem, dos {len(texts)} parágrafos abaixo. Para cada parágrafo, informe '
              'o instante, em segundos com uma casa decimal contados do início do áudio, em que começa a primeira '
              f'palavra. Responda só com uma lista JSON de {len(texts)} números.\n\n{lista}')
    return [float(v) for v in text_call([{'text': prompt}, audio_part(x)])]


def clear_pauses(x, n):
    """Se o [long pause] gerou n-1 pausas bem mais longas que as outras, devolve os cortes nelas."""
    runs = [r for r in silence_runs(x) if r[0] > 0 and r[1] < len(x)]
    by_len = sorted(runs, key=lambda r: r[1] - r[0], reverse=True)
    if len(by_len) < n - 1:
        return None
    shortest = (by_len[n - 2][1] - by_len[n - 2][0]) / RATE
    nxt = (by_len[n - 1][1] - by_len[n - 1][0]) / RATE if len(by_len) >= n else 0
    if shortest < 1.5 or nxt > 0.6 * shortest:
        return None
    return [(a + b) // 2 for a, b in sorted(by_len[:n - 1])]


def cut(x, n, cuts):
    bounds = [0] + cuts + [len(x)]
    parts = [trim(x[bounds[i]:bounds[i + 1]]) for i in range(n)]
    if min(len(p) for p in parts) < RATE:
        raise ValueError('algum trecho ficou com menos de 1 s')
    return parts, [c / RATE for c in cuts]


def align(x, texts, starts):
    """Corta o lote no silêncio mais próximo do início de cada parágrafo. Devolve (partes, cortes) ou erro."""
    n = len(texts)
    if n == 1:
        return [trim(x)], []
    if len(starts) != n:
        raise ValueError(f'o modelo devolveu {len(starts)} instantes para {n} parágrafos')
    runs = [r for r in silence_runs(x) if r[0] > 0 and r[1] < len(x) and r[1] - r[0] >= int(0.12 * RATE)]
    cuts, last = [], 0
    for i in range(1, n):
        t = starts[i]
        cands = [r for r in runs if r[0] > last and t - 1.8 <= r[1] / RATE <= t + 1.2]
        if not cands:
            raise ValueError(f'nenhuma pausa perto do início do parágrafo {i + 1} ({t:.1f} s)')
        best = max(cands, key=lambda r: (r[1] - r[0]) / RATE - 0.35 * abs(r[1] / RATE - t))
        cuts.append((best[0] + best[1]) // 2)
        last = best[1]
    return cut(x, n, cuts)


def raw_batch(texts, model):
    """Áudio bruto do lote; fica guardado para que um novo corte não gaste cota."""
    text = PAUSE_TAG.join(texts)
    h = hashlib.sha1(f'{model}|{VOICE}|{STYLE}|{text}'.encode()).hexdigest()[:16]
    f = os.path.join(AUDIO, 'lotes', f'lote_{h}.flac')
    if os.path.exists(f):
        return read_audio(f)
    os.makedirs(os.path.dirname(f), exist_ok=True)
    x = tts(text, model)
    write_flac(f, x)
    return x


def synth_batch(idx, texts, model):
    """Gera os trechos idx (com textos texts) num pedido só e corta o áudio em um clipe por trecho."""
    print(f'  lote com {len(idx)} trecho(s): {idx[0]}–{idx[-1]}')
    x = trim(raw_batch(texts, model), pad=0.0)
    n = len(texts)
    clear = clear_pauses(x, n) if n > 1 else None
    if n == 1:
        parts, cuts = [trim(x)], []
    elif clear is not None:
        parts, cuts = cut(x, n, clear)
        print('    cortes nas pausas longas')
    else:
        starts = paragraph_starts(x, texts)
        print('    inícios estimados: ' + ', '.join(f'{v:.1f}' for v in starts))
        parts, cuts = align(x, texts, starts)
    print('    cortes: ' + ', '.join(f'{v:.1f}' for v in cuts))
    return dict(zip(idx, parts))


def batches(idx, fs):
    out, cur, w = [], [], 0
    for k in idx:
        if cur and (k != cur[-1] + 1 or w + words(fs[k]) > BATCH_WORDS):
            out.append(cur)
            cur, w = [], 0
        cur.append(k)
        w += words(fs[k])
    if cur:
        out.append(cur)
    return out


# ------------------------------------------------------------- comandos
def cmd_tts(only=None):
    os.makedirs(AUDIO, exist_ok=True)
    fs = falas()
    model = pick(TTS_MODELS, 'GEMINI_TTS_MODEL')
    print(f'Modelo: {model} · voz: {VOICE}')
    cache = load_cache()
    want = only if only is not None else range(len(fs))
    todo = [k for k in want if cache.get(str(k), {}).get('hash') != fhash(fs[k], model)]
    print(f'{len(todo)} trecho(s) para gerar')
    for b in batches(todo, fs):
        got = synth_batch(b, [fs[k] for k in b], model)
        for k, x in got.items():
            f = f'trecho_{k:02d}.flac'
            write_flac(os.path.join(AUDIO, f), x)
            cache[str(k)] = {'hash': fhash(fs[k], model), 'dur': round(len(x) / RATE, 3), 'file': f,
                             'model': model, 'voice': VOICE}
            print(f'    trecho {k:2d}: {len(x) / RATE:5.1f} s')
        save_cache(cache)
        time.sleep(3)
    if only is None:
        durs = [cache.get(str(k), {}).get('dur') if cache.get(str(k), {}).get('hash') == fhash(fs[k], model) else None
                for k in range(len(fs))]
        with open(os.path.join(ROOT, 'src', 'duracoes.js'), 'w') as f:
            f.write('// Gerado por narrar.py: duração (s) do áudio de cada trecho. null = sem narração.\n')
            f.write('window.AUDIO_DURS = ' + json.dumps(durs) + ';\n')
        print(f'src/duracoes.js atualizado ({sum(d is not None for d in durs)}/{len(durs)} trechos com áudio)')
    return cache


def cmd_amostra(arg):
    idx = [int(v) for v in arg.split(',')]
    cache = cmd_tts(only=idx)
    gap = np.zeros(int(RATE * 0.8), dtype=np.float32)
    x = np.concatenate([np.concatenate([read_audio(os.path.join(AUDIO, cache[str(k)]['file'])), gap]) for k in idx])
    write_wav(os.path.join(AUDIO, 'amostra.wav'), x)
    print('output/audio/amostra.wav')


def cmd_conferir():
    fs = falas()
    cache = load_cache()
    idx = sorted(int(k) for k in cache)
    bad = []
    for i in range(0, len(idx), 10):
        grp = idx[i:i + 10]
        got = transcribe([read_audio(os.path.join(AUDIO, cache[str(k)]['file'])) for k in grp])
        if len(got) != len(grp):
            print(f'  transcrição devolveu {len(got)} itens para {len(grp)} áudios; conferindo pelo que veio')
        for k, t in zip(grp, got):
            sim = similarity(fs[k], t)
            flag = '' if sim >= MIN_SIM else '  <-- conferir'
            print(f'  trecho {k:2d}: semelhança {sim:.2f}{flag}')
            if sim < MIN_SIM:
                bad.append((k, t))
        time.sleep(3)
    for k, t in bad:
        print(f'\nTrecho {k}\n  esperado: {fs[k]}\n  ouvido:   {t}')
    print(f'\n{len(idx) - len(bad)}/{len(idx)} trechos conferem')


def cmd_mix():
    tl = json.load(open(os.path.join(OUT, 'timeline.json')))
    if not tl.get('narrated'):
        sys.exit('O vídeo foi renderizado sem as durações da narração. Rode "python3 narrar.py tts" e "node render.cjs" antes.')
    cache = load_cache()
    total = int(tl['total'] * RATE) + RATE
    track = np.zeros(total, dtype=np.float32)
    for k, b in enumerate(tl['beats']):
        c = cache.get(str(k))
        if not c:
            continue
        x = read_audio(os.path.join(AUDIO, c['file']))
        a = int((b['start'] + tl['narrOffset']) * RATE)
        end = b['start'] + b['dur']
        if a / RATE + len(x) / RATE > end + 0.05:
            print(f'  aviso: a fala do trecho {k} passa do fim do trecho')
        track[a:a + len(x)] += x[:max(0, total - a)]
    wav = os.path.join(AUDIO, 'narracao.wav')
    write_wav(wav, track)
    video = os.path.join(OUT, 'video_sem_audio.mp4')
    final = os.path.join(OUT, 'montagem_protoboard.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-i', wav, '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '160k',
                    '-ar', '48000', '-shortest', '-movflags', '+faststart', final], check=True)
    os.remove(wav)
    print(final)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    c = sys.argv[1]
    if c == 'tts':
        cmd_tts()
    elif c == 'amostra':
        cmd_amostra(sys.argv[2] if len(sys.argv) > 2 else '2,13,26')
    elif c == 'conferir':
        cmd_conferir()
    elif c == 'mix':
        cmd_mix()
    else:
        sys.exit(__doc__)
