#!/usr/bin/env bash
# Gera o vídeo narrado: primeiro a narração, depois o vídeo no tempo de cada fala.
# Requer GEMINI_API_KEY no ambiente (veja narrar.py). Trechos já narrados ficam em cache
# (output/audio) e só são pedidos de novo se o texto em src/falas.js mudar.
set -euo pipefail
cd "$(dirname "$0")"
python3 narrar.py tts        # narração dos trechos novos ou alterados + src/duracoes.js
python3 narrar.py conferir   # transcreve cada trecho e compara com o texto
node render.cjs              # vídeo no tempo da narração (output/video_sem_audio.mp4)
node render.cjs --layout     # folha de consulta
python3 narrar.py mix        # output/montagem_protoboard.mp4 com a narração
