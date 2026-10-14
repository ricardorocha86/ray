#!/usr/bin/env node
/*
 * Gera o vídeo a partir de src/index.html.
 *
 *   node render.cjs                 -> output/video_sem_audio.mp4 + legendas + roteiro
 *   node render.cjs --stills 10,42  -> output/stills/quadro_<t>.png (instantes em segundos)
 *   node render.cjs --beats         -> um quadro do meio de cada trecho (revisão rápida)
 *   node render.cjs --layout        -> output/protoboard_final.png (folha de consulta)
 *   node render.cjs --textos        -> só legendas, roteiro e output/timeline.json (sem vídeo)
 *
 * Requer Node, Playwright (com Chromium) e ffmpeg no PATH.
 */
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* tenta a instalação global */ }
  const root = execSync('npm root -g').toString().trim();
  return require(path.join(root, 'playwright'));
}
const { chromium } = loadPlaywright();

const FPS = 30;
const OUT = path.join(__dirname, 'output');
const PAGE = 'file://' + path.join(__dirname, 'src', 'index.html');

function srtTime(t) {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, r = ms % 1000;
  const p = (x, k = 2) => String(x).padStart(k, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
}
const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const plain = s => s.replace(/_\{([^}]*)\}/g, '$1').replace(/\*/g, '');

function writeTexts(tl) {
  fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify(tl, null, 1));
  // com narração, a legenda acompanha a fala; sem narração, o texto que aparece na tela
  const subText = b => plain(tl.narrated && b.fala ? b.fala : b.cap);
  const srt = tl.beats.map((b, i) => `${i + 1}\n${srtTime(b.start + 0.1)} --> ${srtTime(b.start + b.dur - 0.1)}\n${subText(b)}\n`).join('\n');
  fs.writeFileSync(path.join(OUT, 'legendas.srt'), srt);

  let md = '# Roteiro de narração — montagem do perceptron na protoboard\n\n';
  md += 'Gerado automaticamente a partir de `src/scene.js` e `src/falas.js`. Os tempos batem com o vídeo;\n';
  md += '“Fala” é o texto narrado e “Legenda” é o que aparece escrito na tela.\n\n';
  md += `Duração total: **${mmss(tl.total)}**\n\n`;
  let last = '';
  for (const b of tl.beats) {
    const head = [b.step, b.title].filter(Boolean).join(' · ');
    if (head !== last) { md += `\n## ${head}\n\n`; last = head; }
    md += `**${mmss(b.start)}–${mmss(b.start + b.dur)}**`;
    if (b.item) md += ` · _Na tela:_ ${plain(b.item)}`;
    md += `\n\n**Fala:** ${plain(b.fala || b.cap)}\n\n**Legenda:** ${plain(b.cap)}\n\n`;
  }
  fs.writeFileSync(path.join(OUT, 'roteiro_narracao.md'), md);
  writeYoutube(tl);
}

// Título, descrição com capítulos e tags para colar no YouTube Studio.
function writeYoutube(tl) {
  const chapters = [];
  for (const b of tl.beats) {
    const m = /^PASSO (\d+)/.exec(b.step);
    let name = m ? `Passo ${m[1]} – ${b.title}` : b.title;
    if (!chapters.length) name = 'Introdução';
    if (b.title === 'Revisão') name = 'Revisão antes de ligar';
    if (b.title === 'Função AND') name = 'Teste da função AND';
    if (b.step === 'BÔNUS') name = 'Bônus: ' + b.title.charAt(0).toLowerCase() + b.title.slice(1);
    if (!chapters.length || chapters[chapters.length - 1].name !== name && chapters[chapters.length - 1].title !== b.title) chapters.push({ t: b.start, name, title: b.title });
  }
  const yt = `# Publicação no YouTube

Copie cada parte para o campo correspondente do YouTube Studio.

## Título

Perceptron físico na protoboard: montagem passo a passo da função AND (LM358)

## Descrição

Como montar na protoboard um perceptron que implementa a função lógica AND, usando o LM358 como comparador. O treinamento é feito no R; o circuito executa a regra aprendida: os pesos viram resistores e o viés vira uma tensão de referência.

Material: protoboard, fonte regulada de 5 V, LM358, 2 chaves SPDT, potenciômetro de 10 kΩ, resistores de 10 kΩ (2), 4,7 kΩ e 1 kΩ, LED vermelho, capacitor cerâmico de 100 nF, jumpers e multímetro.

Capítulos:
${chapters.map(c => `${mmss(c.t)} ${c.name}`).join('\n')}

Segurança: use fonte regulada de 5 V e desligue a fonte antes de mudar qualquer ligação.

Narração gerada com voz sintética (Gemini TTS).

## Tags

perceptron, rede neural, protoboard, LM358, eletrônica, função AND, porta lógica, amplificador operacional, comparador, aprendizado de máquina, ensino, linguagem R

## Legendas

As legendas já estão gravadas na imagem. O arquivo legendas.srt (o texto da narração) é opcional:
em Legendas > Adicionar idioma > Enviar arquivo. Se enviar, o espectador pode ver as duas legendas ao mesmo tempo
quando ativar o CC.
`;
  fs.writeFileSync(path.join(OUT, 'youtube.md'), yt);
}

(async () => {
  const args = process.argv.slice(2);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('Erro na página:', e.message); process.exit(1); });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY === true);
  const tl = await page.evaluate(() => window.TIMELINE);
  console.log(`Duração: ${tl.total.toFixed(1)} s, ${tl.beats.length} trechos`);

  if (args.includes('--textos')) {
    writeTexts(tl);
    console.log('Textos e output/timeline.json atualizados');
    await browser.close();
    return;
  }

  if (args.includes('--layout')) {
    await page.evaluate(() => window.renderLayout());
    const f = path.join(OUT, 'protoboard_final.png');
    await page.screenshot({ path: f });
    console.log(f);
    await browser.close();
    return;
  }

  const stillTimes = [];
  const si = args.indexOf('--stills');
  if (si >= 0) stillTimes.push(...args[si + 1].split(',').map(Number));
  if (args.includes('--beats')) tl.beats.forEach(b => stillTimes.push(+(b.start + Math.min(b.dur - 0.2, 2.6)).toFixed(2)));
  if (stillTimes.length) {
    const dir = path.join(OUT, 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of stillTimes) {
      await page.evaluate(t => window.renderAt(t), t);
      const f = path.join(dir, `quadro_${String(t.toFixed(2)).padStart(7, '0')}.png`);
      await page.screenshot({ path: f });
      console.log(f);
    }
    await browser.close();
    return;
  }

  writeTexts(tl);
  // sem áudio; narrar.py mix junta a narração e grava output/montagem_protoboard.mp4
  const file = path.join(OUT, 'video_sem_audio.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-tune', 'animation', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const write = buf => new Promise(res => { if (ff.stdin.write(buf)) res(); else ff.stdin.once('drain', res); });

  const N = Math.ceil(tl.total * FPS);
  let last = null, shots = 0;
  const t0 = Date.now();
  for (let f = 0; f < N; f++) {
    const changed = await page.evaluate(t => window.renderAt(t), f / FPS);
    if (changed || !last) { last = await page.screenshot({ type: 'png' }); shots++; }
    await write(last);
    if (f % 300 === 0) console.log(`quadro ${f}/${N} (${shots} capturas, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end();
  await new Promise(res => ff.on('close', res));
  await browser.close();
  console.log(`Pronto: ${file}`);
})();
