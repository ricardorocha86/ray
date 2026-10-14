# Vídeo: montagem do perceptron (função AND) na protoboard

Vídeo didático animado e narrado que mostra, furo por furo, como montar na protoboard o
circuito do material *Construindo uma rede neural física* (perceptron AND com LM358).

## O que tem nesta pasta

| Arquivo | Para que serve |
|---|---|
| `output/montagem_protoboard.mp4` | Vídeo pronto (1920×1080, ~11 min, narrado e com legendas na tela) |
| `output/roteiro_narracao.md` | Roteiro com os tempos: o que é falado e o que aparece escrito em cada trecho |
| `output/legendas.srt` | Legendas da narração em arquivo separado (YouTube, VLC etc.) |
| `output/protoboard_final.png` | Imagem da montagem completa, para usar como folha de consulta |
| `output/audio/` | Um áudio por trecho da narração (cache; evita gastar cota de novo) |
| `src/scene.js` | Desenho e roteiro da animação (legendas, ordem das peças, furos) |
| `src/falas.js` | Texto falado de cada trecho, escrito para ser lido em voz alta |
| `narrar.py` | Gera a narração com o TTS do Gemini e junta ao vídeo |
| `render.cjs` | Gera o vídeo, as legendas e o roteiro a partir de `src/` |
| `gerar_video_narrado.sh` | Faz tudo na ordem certa |

## Estrutura do vídeo

1. Abertura e visão geral: diagrama de blocos e conversão de pesos e viés em resistores e limiar
2. Material e código de cores dos resistores
3. Conhecendo a protoboard: colunas, canal central e trilhas
4. Passos 1 a 8 da montagem, com o furo de cada ligação destacado
5. Revisão antes de ligar
6. Ligar, medir 5 V e calibrar o limiar em cerca de 1,8 V
7. Teste das quatro combinações, com a leitura do multímetro e o estado do LED
8. Diagnóstico de problemas
9. Bônus: com o limiar em cerca de 0,6 V, o mesmo circuito faz OR

## Mapa de ligações (o mesmo do vídeo)

Protoboard de 400 pontos: colunas 1 a 30, linhas a–e (metade de cima) e f–j (metade de baixo).
Neste layout, a trilha de fora é +5 V e a de dentro é GND, nas duas bordas.

| Passo | Ligação | De | Para |
|---|---|---|---|
| 1 | Fonte +5 V (desligada) | fonte + | trilha + de cima |
| 1 | Fonte GND | fonte − | trilha − de cima |
| 1 | Ponte + (jumper vermelho) | trilha + de cima, col. 30 | trilha + de baixo, col. 30 |
| 1 | Ponte − (jumper preto) | trilha − de cima, col. 29 | trilha − de baixo, col. 29 |
| 2 | LM358, meia-lua à esquerda | pinos 1–4 em f15–f18 | pinos 8–5 em e15–e18 |
| 3 | Pino 8 → +5 V | a15 | trilha + de cima |
| 3 | Pino 4 → GND | j18 | trilha − de baixo |
| 3 | Capacitor 100 nF (“104”) | trilha + de cima, col. 14 | trilha − de cima, col. 14 |
| 4 | Pino 5 → GND | a18 | trilha − de cima |
| 4 | Pino 6 ↔ pino 7 | c16 | c17 |
| 5 | Chave x₁ | g1, g2 (comum), g3 | — |
| 5 | x₁: terminal lateral → +5 V | j1 | trilha + de baixo |
| 5 | x₁: terminal lateral → GND | j3 | trilha − de baixo |
| 5 | Chave x₂ | g8, g9 (comum), g10 | — |
| 5 | x₂: terminal lateral → +5 V | j8 | trilha + de baixo |
| 5 | x₂: terminal lateral → GND | j10 | trilha − de baixo |
| 6 | R1 10 kΩ (marrom-preto-laranja) | f2 | f5 |
| 6 | R2 10 kΩ (marrom-preto-laranja) | i9 | i5 |
| 6 | R0 4,7 kΩ (amarelo-violeta-vermelho) | j5 | trilha − de baixo, col. 7 |
| 6 | V_S → pino 3 (jumper amarelo) | h5 | h17 |
| 7 | Potenciômetro 10 kΩ | f11, f12 (cursor), f13 | — |
| 7 | Terminal externo → +5 V | j11 | trilha + de baixo |
| 7 | Terminal externo → GND | j13 | trilha − de baixo |
| 7 | V_ref → pino 2 (jumper verde) | i12 | i16 |
| 8 | Saída, pino 1 (jumper laranja) | g15 | g21 |
| 8 | Resistor 1 kΩ (marrom-preto-vermelho) | h21 | h25 |
| 8 | LED: ânodo (perna longa) / cátodo (perna curta) | g25 | g26 |
| 8 | Cátodo → GND (jumper preto) | j26 | trilha − de baixo |

**Pontos de medição:** V_S na coluna 5 (furo g5), V_ref no cursor (furo g12), GND em qualquer furo da trilha −.

**Valores esperados** com R1 = R2 = 10 kΩ, R0 = 4,7 kΩ e V_ref ≈ 1,8 V:

| x₁ x₂ | V_S (4,7 kΩ) | V_S (5 kΩ, teórico) | LED |
|---|---|---|---|
| 0 0 | 0,00 V | 0,00 V | apagado |
| 0 1 | 1,21 V | 1,25 V | apagado |
| 1 0 | 1,21 V | 1,25 V | apagado |
| 1 1 | 2,42 V | 2,50 V | aceso |

## Observações sobre a montagem

- O capacitor de 100 nF fica entre as trilhas + e −, ao lado do pino 8. Isso equivale a ligá-lo entre os
  pinos 8 e 4, como diz o material.
- Na animação, alavanca à esquerda = 1 (5 V). Na chave real, confirme com o multímetro qual posição liga o
  comum ao +5 V. O material também alerta para isso.
- Com 5 V de alimentação, a saída do LM358 chega a cerca de 3,5 V. Assim o LED acende com brilho moderado
  (cerca de 1,5 mA com 1 kΩ). Isso é normal.
- Se as trilhas da sua protoboard forem interrompidas no meio, una as metades com jumpers.

## Como a narração é feita

A narração vem primeiro e o vídeo se ajusta a ela. Cada trecho do vídeo dura o tempo da sua fala
(mais uma pausa curta), então não há corte de áudio nem fala atropelada.

1. `src/falas.js` tem o texto falado de cada trecho. Ele segue a legenda, mas sem setas, subscritos ou
   símbolos de unidade.
2. `narrar.py tts` pede o áudio ao TTS do Gemini (voz `Charon`). Para economizar a cota gratuita
   (10 pedidos por dia por modelo), vários trechos vão num mesmo pedido, separados por `[long pause]`,
   e o áudio é cortado nessas pausas. O resultado fica em `output/audio/` e `src/duracoes.js`.
3. `narrar.py conferir` transcreve cada trecho com o Gemini e compara com o texto.
4. `node render.cjs` renderiza o vídeo usando as durações de `src/duracoes.js`.
5. `narrar.py mix` posiciona cada fala no início do seu trecho, normaliza o volume e grava o vídeo final.

A narração atual foi gerada com `gemini-3.1-flash-tts-preview`.

## Como regenerar (após editar textos ou o layout)

Requer Node.js, Playwright com Chromium, ffmpeg e Python 3 com numpy.

```bash
cd video
export GEMINI_API_KEY=...                  # só se alguma fala mudou
export GEMINI_TTS_MODEL=gemini-3.1-flash-tts-preview   # para manter a mesma voz
./gerar_video_narrado.sh                   # narração (só o que mudou) + vídeo + mixagem
```

- Mudou só o desenho ou uma legenda: `node render.cjs && python3 narrar.py mix` (não usa a API).
- Mudou uma fala em `src/falas.js`: rode `./gerar_video_narrado.sh`; só aquele trecho é narrado de novo.
- Trocar a voz: `GEMINI_TTS_VOICE=Kore ./gerar_video_narrado.sh` (narra tudo de novo).
- Revisão rápida: `node render.cjs --beats` (um quadro de cada trecho em `output/stills/`) ou
  `node render.cjs --stills 120.5`.

As legendas, os furos e a ordem das peças estão em `BEATS` e `COMP`, no arquivo `src/scene.js`.
Sem `src/duracoes.js` preenchido, a duração de cada trecho é estimada pelo tamanho da legenda.
