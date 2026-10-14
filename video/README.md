# Vídeo: montagem do perceptron (função AND) na protoboard

Vídeo didático animado que mostra, furo por furo, como montar na protoboard o
circuito do material *Construindo uma rede neural física* (perceptron AND com LM358).

## O que tem nesta pasta

| Arquivo | Para que serve |
|---|---|
| `output/montagem_protoboard.mp4` | Vídeo pronto (1920×1080, ~9 min, com legendas na tela e sem áudio) |
| `output/roteiro_narracao.md` | Texto da narração com os tempos de cada trecho, para gravar a voz por cima |
| `output/legendas.srt` | Legendas em arquivo separado (YouTube, VLC etc.) |
| `output/protoboard_final.png` | Imagem da montagem completa, para usar como folha de consulta |
| `src/scene.js` | Desenho e roteiro da animação (legendas, ordem das peças, furos) |
| `render.cjs` | Gera o vídeo, as legendas e o roteiro a partir de `src/` |

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

## Como usar o vídeo

- **Com narração:** grave a voz lendo `output/roteiro_narracao.md`. Cada fala tem a janela de tempo do
  trecho correspondente. Depois junte o áudio com qualquer editor, ou pelo terminal:
  `ffmpeg -i output/montagem_protoboard.mp4 -i narracao.m4a -c:v copy -c:a aac -shortest video_final.mp4`
- **Sem narração:** as legendas já estão gravadas na imagem. O `.srt` serve para plataformas que exibem
  legendas à parte.
- **Filmando uma montagem real:** use o roteiro como sequência de cenas, com a câmera de cima e a
  protoboard na mesma orientação do vídeo. A animação também pode entrar como inserto entre as tomadas.

## Como regenerar (após editar textos ou o layout)

Requer Node.js, Playwright com Chromium e ffmpeg.

```bash
cd video
node render.cjs                 # vídeo + legendas + roteiro em output/
node render.cjs --beats         # um quadro de cada trecho em output/stills/ (revisão rápida)
node render.cjs --stills 120.5  # quadro(s) em instantes específicos, em segundos
```

As legendas, os furos e a ordem das peças estão em `BEATS` e `COMP`, no arquivo `src/scene.js`.
A duração de cada trecho é calculada a partir do tamanho da legenda.
