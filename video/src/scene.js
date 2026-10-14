'use strict';
/*
 * Animação "Perceptron físico na protoboard" (função AND com LM358).
 *
 * Tudo é desenhado em SVG. O roteiro (BEATS) define, para cada trecho,
 * a legenda, os componentes que entram na protoboard e o estado do
 * circuito (fonte, chaves, potenciômetro, multímetro). render.cjs chama
 * window.renderAt(t) quadro a quadro e grava o vídeo com o ffmpeg.
 */

// ---------------------------------------------------------------- utilidades
const W = 1920, H = 1080;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeInOut = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const lerp = (a, b, t) => a + (b - a) * t;
const n = x => Math.round(x * 10) / 10;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmtV = v => v.toFixed(2).replace('.', ',') + ' V';

const C = {
  bg: '#0e1726', bar: '#0a111d', panel: '#15202f', panelLine: '#26364d',
  text: '#eef2f8', muted: '#94a3b8', dim: '#55657c', accent: '#fbbf24', accentDark: '#1c1404',
  sky: '#38bdf8', ok: '#22c55e',
  board: '#f3efe6', boardEdge: '#d6cfbf', hole: '#34312c', gap: '#e3dccd', numbers: '#8f8777',
  railRed: '#e0393e', railBlue: '#2563eb',
  wRed: '#dc2626', wBlk: '#22262d', wYel: '#f5c400', wGrn: '#15a34a', wOrg: '#f97316', wPur: '#8b5cf6',
};
const BAND = {
  black: '#1b1b1b', brown: '#7b4a1e', red: '#d42a2a', orange: '#f57c00', yellow: '#f7d117',
  green: '#2e7d32', blue: '#1565c0', violet: '#7e57c2', gray: '#8d8d8d', white: '#f5f5f5', gold: '#c9a03a',
};
const R10K = ['brown', 'black', 'orange', 'gold'];
const R4K7 = ['yellow', 'violet', 'red', 'gold'];
const R1K = ['brown', 'black', 'red', 'gold'];

// ------------------------------------------------------------------- texto
const mctx = document.createElement('canvas').getContext('2d');
function mw(t, size, weight) {
  mctx.font = `${weight} ${size}px Inter, "DejaVu Sans", sans-serif`;
  return mctx.measureText(t).width;
}
// Marcação simples: _{x} = subscrito, *texto* = destaque em negrito.
function parseRich(s) {
  // número e unidade nunca ficam em linhas diferentes
  s = s.replace(/(\d) (?=(?:V|kΩ|Ω|nF|mA)(?![A-Za-zÀ-ú]))/g, '$1\u00a0');
  const out = []; let b = false, buf = '', i = 0;
  const push = (t, sub) => { if (t) out.push({ t, sub, b }); };
  while (i < s.length) {
    const ch = s[i];
    if (ch === '*') { push(buf, false); buf = ''; b = !b; i++; continue; }
    if (ch === '_' && s[i + 1] === '{') {
      push(buf, false); buf = '';
      const j = s.indexOf('}', i);
      push(s.slice(i + 2, j), true); i = j + 1; continue;
    }
    buf += ch; i++;
  }
  push(buf, false);
  return out;
}
function toWords(segs) {
  const words = []; let cur = [];
  for (const sg of segs) {
    sg.t.split(' ').forEach((p, k) => {
      if (k > 0) { words.push(cur); cur = []; }
      if (p) cur.push({ ...sg, t: p });
    });
  }
  words.push(cur);
  return words.filter(w => w.length);
}
const segW = (sg, size, weight) => mw(sg.t, sg.sub ? size * 0.7 : size, sg.b ? 700 : weight);
function wrapRich(s, size, weight, maxW) {
  const ws = toWords(parseRich(s));
  const sp = mw(' ', size, weight);
  const lines = []; let cur = [], curW = 0;
  for (const w of ws) {
    const ww = w.reduce((a, sg) => a + segW(sg, size, weight), 0);
    if (cur.length && curW + sp + ww > maxW) { lines.push({ words: cur, w: curW }); cur = [w]; curW = ww; }
    else { curW += (cur.length ? sp : 0) + ww; cur.push(w); }
  }
  if (cur.length) lines.push({ words: cur, w: curW });
  return lines;
}
function lineSpans(line, size, boldFill) {
  const segs = [];
  line.words.forEach((w, wi) => {
    if (wi > 0) segs.push({ t: ' ', sub: false, b: false });
    segs.push(...w);
  });
  let out = '', sub = false;
  const sh = size * 0.24;
  for (const sg of segs) {
    let dy = '';
    if (sg.sub && !sub) dy = ` dy="${n(sh)}"`;
    if (!sg.sub && sub) dy = ` dy="${n(-sh)}"`;
    sub = sg.sub;
    const fs = sg.sub ? ` font-size="${n(size * 0.7)}"` : '';
    const fw = sg.b ? ` font-weight="700"` : '';
    const fl = sg.b && boldFill ? ` fill="${boldFill}"` : '';
    out += `<tspan${dy}${fs}${fw}${fl}>${esc(sg.t)}</tspan>`;
  }
  return out;
}
// Desenha texto rico com quebra de linha. Retorna {svg, h, lines}.
function rtext(s, x, y, o = {}) {
  const size = o.size || 24, weight = o.weight || 400, fill = o.fill || C.text;
  const lh = o.lh || size * 1.32, anchor = o.anchor || 'start';
  const lines = o.maxW ? wrapRich(s, size, weight, o.maxW) : wrapRich(s, size, weight, 1e9);
  let svg = '';
  lines.forEach((ln, i) => {
    const extra = o.ls ? ` letter-spacing="${o.ls}"` : '';
    svg += `<text x="${n(x)}" y="${n(y + i * lh)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${extra}${o.opacity !== undefined ? ` opacity="${o.opacity}"` : ''}>${lineSpans(ln, size, o.boldFill)}</text>`;
  });
  return { svg, h: lines.length * lh, lines };
}
const T = (s, x, y, o) => rtext(s, x, y, o).svg;

// --------------------------------------------------------- geometria da placa
const P = 38;                 // passo entre furos (2,54 mm)
const BX = 150, BY = 120;     // canto superior esquerdo da protoboard
const NC = 30;                // colunas (protoboard de 400 pontos)
const ROWY = {
  'T+': 0.8, 'T-': 1.8, a: 3.2, b: 4.2, c: 5.2, d: 6.2, e: 7.2,
  f: 10.2, g: 11.2, h: 12.2, i: 13.2, j: 14.2, 'B-': 15.6, 'B+': 16.6,
};
const BW = (NC + 2) * P, BH = 17.4 * P;
const cx = c => BX + 1.5 * P + (c - 1) * P;
const ry = r => BY + ROWY[r] * P;
function hparse(h) {
  const m = /^([TB][+-]|[a-j])(\d+(?:\.\d+)?)$/.exec(h);
  if (!m) throw new Error('furo inválido: ' + h);
  return { row: m[1], col: +m[2] };
}
function hxy(h) { const { row, col } = hparse(h); return [cx(col), ry(row)]; }
const isRail = h => /^[TB]/.test(h);
function holeLabel(h) {
  if (!isRail(h)) return h;
  return h[1] === '+' ? '+5 V' : 'GND';
}

let BOARD_CACHE = null;
function boardSVG() {
  if (BOARD_CACHE) return BOARD_CACHE;
  let s = `<rect x="${BX}" y="${BY}" width="${BW}" height="${BH}" rx="16" fill="${C.board}" stroke="${C.boardEdge}" stroke-width="2" filter="url(#shadow)"/>`;
  const gy1 = ry('e') + 0.72 * P, gy2 = ry('f') - 0.72 * P;
  s += `<rect x="${BX + 10}" y="${n(gy1)}" width="${BW - 20}" height="${n(gy2 - gy1)}" rx="5" fill="${C.gap}"/>`;
  const x1 = cx(1) - 0.6 * P, x2 = cx(NC) + 0.6 * P;
  const rl = (y, col) => `<line x1="${n(x1)}" y1="${n(y)}" x2="${n(x2)}" y2="${n(y)}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
  s += rl(ry('T+') - 0.45 * P, C.railRed) + rl(ry('T-') + 0.45 * P, C.railBlue);
  s += rl(ry('B-') - 0.45 * P, C.railBlue) + rl(ry('B+') + 0.45 * P, C.railRed);
  for (const [r, sym, col] of [['T+', '+', C.railRed], ['T-', '−', C.railBlue], ['B-', '−', C.railBlue], ['B+', '+', C.railRed]]) {
    s += `<text x="${n(cx(1) - 1.0 * P)}" y="${n(ry(r) + 8)}" font-size="24" font-weight="700" fill="${col}" text-anchor="middle">${sym}</text>`;
    s += `<text x="${n(cx(NC) + 1.0 * P)}" y="${n(ry(r) + 8)}" font-size="24" font-weight="700" fill="${col}" text-anchor="middle">${sym}</text>`;
  }
  const hs = 0.34 * P;
  for (const r of Object.keys(ROWY)) {
    for (let c = 1; c <= NC; c++) {
      s += `<rect x="${n(cx(c) - hs / 2)}" y="${n(ry(r) - hs / 2)}" width="${n(hs)}" height="${n(hs)}" rx="2.5" fill="${C.hole}"/>`;
    }
  }
  for (let c = 1; c <= NC; c++) {
    const bold = c === 1 || c % 5 === 0;
    const fw = bold ? 700 : 500, fc = bold ? '#6f6858' : C.numbers;
    s += `<text x="${n(cx(c))}" y="${n(ry('a') - 0.5 * P)}" font-size="13" font-weight="${fw}" fill="${fc}" text-anchor="middle">${c}</text>`;
    s += `<text x="${n(cx(c))}" y="${n(ry('j') + 0.78 * P)}" font-size="13" font-weight="${fw}" fill="${fc}" text-anchor="middle">${c}</text>`;
  }
  for (const r of 'abcdefghij') {
    s += `<text x="${n(cx(1) - 0.95 * P)}" y="${n(ry(r) + 5)}" font-size="15" font-weight="600" fill="${C.numbers}" text-anchor="middle">${r}</text>`;
    s += `<text x="${n(cx(NC) + 0.95 * P)}" y="${n(ry(r) + 5)}" font-size="15" font-weight="600" fill="${C.numbers}" text-anchor="middle">${r}</text>`;
  }
  BOARD_CACHE = s;
  return s;
}

// --------------------------------------------------------------- componentes
function shade(hex, k) {
  const v = parseInt(hex.slice(1), 16);
  const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  const f = x => Math.round(x * (1 - k)).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}
const tip = (x, y, r = 0.12 * P) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#d5d9de" stroke="#7d8692" stroke-width="1.2"/>`;

function wireAt(x1, y1, x2, y2, color, w = 0.27 * P) {
  const L = `x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"`;
  return `<line ${L} stroke="rgba(0,0,0,0.25)" stroke-width="${n(w + 4)}" stroke-linecap="round" transform="translate(1.5,3)"/>`
    + `<line ${L} stroke="${shade(color, 0.45)}" stroke-width="${n(w + 3)}" stroke-linecap="round"/>`
    + `<line ${L} stroke="${color}" stroke-width="${n(w)}" stroke-linecap="round"/>`
    + `<line ${L} stroke="rgba(255,255,255,0.32)" stroke-width="${n(w * 0.26)}" stroke-linecap="round" transform="translate(-1,-2)"/>`
    + tip(x1, y1) + tip(x2, y2);
}
function resistorAt(x1, y1, x2, y2, bands, o = {}) {
  const L = Math.hypot(x2 - x1, y2 - y1);
  const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const bl = o.bl || Math.min(1.95 * P, L - 0.5 * P);
  const bh = o.bh || (bl < 1.3 * P ? 0.52 * P : 0.62 * P);
  let s = `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="#a9afb7" stroke-width="3.4" stroke-linecap="round"/>`;
  if (!o.noTips) s += tip(x1, y1, 0.1 * P) + tip(x2, y2, 0.1 * P);
  s += `<g transform="translate(${n(mx)},${n(my)}) rotate(${n(ang)})">`;
  s += `<rect x="${n(-bl / 2)}" y="${n(-bh / 2 + 2)}" width="${n(bl)}" height="${n(bh)}" rx="${n(bh / 2)}" fill="rgba(0,0,0,0.2)"/>`;
  s += `<rect x="${n(-bl / 2)}" y="${n(-bh / 2)}" width="${n(bl)}" height="${n(bh)}" rx="${n(bh / 2)}" fill="#e6cd9b" stroke="#a6874f" stroke-width="1.4"/>`;
  const pos = [-0.27, -0.12, 0.03, 0.29], bw = Math.max(3, 0.085 * bl);
  bands.forEach((b, i) => {
    s += `<rect x="${n(pos[i] * bl - bw / 2)}" y="${n(-bh / 2 + 0.7)}" width="${n(bw)}" height="${n(bh - 1.4)}" fill="${BAND[b]}"/>`;
  });
  s += `<rect x="${n(-bl / 2 + bh * 0.4)}" y="${n(-bh / 2 + 2)}" width="${n(bl - bh * 0.8)}" height="${n(bh * 0.2)}" rx="2" fill="rgba(255,255,255,0.28)"/>`;
  s += `</g>`;
  return s;
}
// Chave deslizante SPDT com 3 terminais centrada em (xm, y). knob: 1 = alavanca à esquerda.
function switchAt(xm, y, knob, scale = 1) {
  const w = 3 * P * scale, h = 0.92 * P * scale, x0 = xm - w / 2;
  let s = `<rect x="${n(x0)}" y="${n(y - h / 2 + 3)}" width="${n(w)}" height="${n(h)}" rx="6" fill="rgba(0,0,0,0.25)"/>`;
  s += `<rect x="${n(x0)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" rx="6" fill="#26324d" stroke="#0d1424" stroke-width="1.5"/>`;
  const sx = x0 + 0.22 * P * scale, sw = w - 0.44 * P * scale;
  s += `<rect x="${n(sx)}" y="${n(y - 0.2 * P * scale)}" width="${n(sw)}" height="${n(0.4 * P * scale)}" rx="4" fill="#0d1424"/>`;
  const kw = 1.05 * P * scale;
  const kx = lerp(sx + sw - kw, sx, knob);
  s += `<rect x="${n(kx)}" y="${n(y - 0.33 * P * scale)}" width="${n(kw)}" height="${n(0.66 * P * scale)}" rx="5" fill="#e8ebef" stroke="#8d96a3" stroke-width="1.2"/>`;
  for (let k = -1; k <= 1; k++) {
    const gx = kx + kw / 2 + k * 0.2 * P * scale;
    s += `<line x1="${n(gx)}" y1="${n(y - 0.18 * P * scale)}" x2="${n(gx)}" y2="${n(y + 0.18 * P * scale)}" stroke="#9aa3ae" stroke-width="1.5"/>`;
  }
  return s;
}
// Trimpot: pernas em (x0..x2, yl); corpo logo acima. volts define o ângulo do cursor.
function potAt(xm, yl, volts, legs = true, scale = 1) {
  const bw = 2.5 * P * scale, bh = 1.75 * P * scale;
  const by = yl - 0.1 * P * scale - bh;
  let s = '';
  if (legs) {
    for (let k = -1; k <= 1; k++) {
      const x = xm + k * P * scale;
      s += `<line x1="${n(x)}" y1="${n(by + bh - 4)}" x2="${n(x)}" y2="${n(yl)}" stroke="#a9afb7" stroke-width="4" stroke-linecap="round"/>` + tip(x, yl, 0.1 * P * scale);
    }
  }
  s += `<rect x="${n(xm - bw / 2)}" y="${n(by + 3)}" width="${n(bw)}" height="${n(bh)}" rx="7" fill="rgba(0,0,0,0.25)"/>`;
  s += `<rect x="${n(xm - bw / 2)}" y="${n(by)}" width="${n(bw)}" height="${n(bh)}" rx="7" fill="#2c64cc" stroke="#163c86" stroke-width="1.5"/>`;
  const kcx = xm, kcy = by + bh / 2, kr = 0.62 * P * scale;
  s += `<circle cx="${n(kcx)}" cy="${n(kcy)}" r="${n(kr)}" fill="#f4f6fa" stroke="#b9c1cc" stroke-width="1.5"/>`;
  const th = (-135 + 270 * clamp(volts / 5)) * Math.PI / 180;
  const dx = Math.sin(th), dy = -Math.cos(th);
  s += `<line x1="${n(kcx - dx * kr * 0.72)}" y1="${n(kcy - dy * kr * 0.72)}" x2="${n(kcx + dx * kr * 0.72)}" y2="${n(kcy + dy * kr * 0.72)}" stroke="#5b6573" stroke-width="${n(4 * scale)}" stroke-linecap="round"/>`;
  s += `<circle cx="${n(kcx + dx * kr * 0.72)}" cy="${n(kcy + dy * kr * 0.72)}" r="${n(3.5 * scale)}" fill="#e2483d"/>`;
  s += `<text x="${n(xm - bw / 2 + 6 * scale)}" y="${n(by + 14 * scale)}" font-size="${n(11 * scale)}" font-weight="700" fill="#dbe7ff">103</text>`;
  return s;
}
// LM358 com a meia-lua à esquerda. Pinos 1–4 embaixo, 8–5 em cima.
function chipAt(xs, yTop, yBot, o = {}) {
  // xs: x dos 4 pinos; yTop/yBot: y dos furos dos pinos de cima e de baixo
  const pitch = xs[1] - xs[0];
  const xL = xs[0] - 0.62 * pitch, xR = xs[3] + 0.62 * pitch;
  const gapY = (yBot - yTop);
  const yT = yTop + 0.2 * gapY, yB = yBot - 0.2 * gapY;
  let s = '';
  const pw = 0.34 * pitch;
  xs.forEach(x => {
    s += `<rect x="${n(x - pw / 2)}" y="${n(yTop - 0.1 * pitch)}" width="${n(pw)}" height="${n(yT - yTop + 0.1 * pitch + 2)}" rx="2" fill="#c9ced6" stroke="#858d98" stroke-width="1"/>`;
    s += `<rect x="${n(x - pw / 2)}" y="${n(yB - 2)}" width="${n(pw)}" height="${n(yBot - yB + 0.1 * pitch + 2)}" rx="2" fill="#c9ced6" stroke="#858d98" stroke-width="1"/>`;
  });
  s += `<rect x="${n(xL)}" y="${n(yT + 3)}" width="${n(xR - xL)}" height="${n(yB - yT)}" rx="6" fill="rgba(0,0,0,0.3)"/>`;
  s += `<rect x="${n(xL)}" y="${n(yT)}" width="${n(xR - xL)}" height="${n(yB - yT)}" rx="6" fill="#23262c" stroke="#0c0e11" stroke-width="1.5"/>`;
  const ym = (yT + yB) / 2, nr = 0.3 * pitch;
  s += `<path d="M ${n(xL)} ${n(ym - nr)} A ${n(nr)} ${n(nr)} 0 0 1 ${n(xL)} ${n(ym + nr)} Z" fill="#454b55"/>`;
  s += `<circle cx="${n(xL + 0.3 * pitch)}" cy="${n(yB - 0.3 * pitch)}" r="${n(0.09 * pitch)}" fill="#535a65"/>`;
  const fs = o.fs || 19;
  s += `<text x="${n((xL + xR) / 2)}" y="${n(ym + fs * 0.36)}" font-size="${fs}" font-weight="700" fill="#c2c8d0" text-anchor="middle" letter-spacing="1.5">LM358</text>`;
  if (o.numbers !== false) {
    const nf = o.nfs || 12;
    [8, 7, 6, 5].forEach((p, i) => { s += `<text x="${n(xs[i])}" y="${n(yT + nf + 2)}" font-size="${nf}" font-weight="600" fill="#8a929d" text-anchor="middle">${p}</text>`; });
    [1, 2, 3, 4].forEach((p, i) => { s += `<text x="${n(xs[i])}" y="${n(yB - 5)}" font-size="${nf}" font-weight="600" fill="#8a929d" text-anchor="middle">${p}</text>`; });
  }
  return s;
}
function capAt(x1, y1, x2, y2, r = 0.42 * P) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  let s = `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="#a9afb7" stroke-width="3" stroke-linecap="round"/>` + tip(x1, y1, 0.1 * P) + tip(x2, y2, 0.1 * P);
  s += `<circle cx="${n(mx + 1)}" cy="${n(my + 2.5)}" r="${n(r)}" fill="rgba(0,0,0,0.25)"/>`;
  s += `<circle cx="${n(mx)}" cy="${n(my)}" r="${n(r)}" fill="#f0a116" stroke="#ad6a00" stroke-width="1.5"/>`;
  s += `<text x="${n(mx)}" y="${n(my + r * 0.3)}" font-size="${n(r * 0.75)}" font-weight="700" fill="#5a3600" text-anchor="middle">104</text>`;
  return s;
}
// LED visto de cima, com o lado chato (cátodo) voltado para (xk, yk).
function ledAt(xa, ya, xk, yk, on, r = 0.64 * P) {
  const mx = (xa + xk) / 2, my = (ya + yk) / 2;
  const ang = Math.atan2(yk - ya, xk - xa) * 180 / Math.PI;
  let s = '';
  if (on > 0) s += `<circle cx="${n(mx)}" cy="${n(my)}" r="${n(r * 4.2)}" fill="url(#ledGlow)" opacity="${n(on)}"/>`;
  const d = 0.8 * r, h = Math.sqrt(r * r - d * d);
  const R2 = r * 1.1, d2 = 0.8 * R2, h2 = Math.sqrt(R2 * R2 - d2 * d2);
  s += `<g transform="translate(${n(mx)},${n(my)}) rotate(${n(ang)})">`;
  s += `<path d="M ${n(d2)} ${n(-h2)} A ${n(R2)} ${n(R2)} 0 1 0 ${n(d2)} ${n(h2)} Z" fill="rgba(0,0,0,0.25)" transform="translate(1,3)"/>`;
  s += `<path d="M ${n(d2)} ${n(-h2)} A ${n(R2)} ${n(R2)} 0 1 0 ${n(d2)} ${n(h2)} Z" fill="${on > 0.5 ? '#ff6b6b' : '#9b2222'}" stroke="#5c0f0f" stroke-width="1.2"/>`;
  const fill = on > 0.5 ? 'url(#ledOn)' : 'url(#ledOff)';
  s += `<path d="M ${n(d)} ${n(-h)} A ${n(r)} ${n(r)} 0 1 0 ${n(d)} ${n(h)} Z" fill="${fill}" stroke="#6b1010" stroke-width="1"/>`;
  s += `</g>`;
  s += `<ellipse cx="${n(mx - r * 0.3)}" cy="${n(my - r * 0.35)}" rx="${n(r * 0.28)}" ry="${n(r * 0.18)}" fill="#fff" opacity="0.45"/>`;
  return s;
}
function supplyAt(on) {
  const x = 14, y = 126, w = 118, h = 150;
  let s = `<rect x="${x}" y="${y + 3}" width="${w}" height="${h}" rx="12" fill="rgba(0,0,0,0.35)"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#2b3544" stroke="#0f141b" stroke-width="2"/>`;
  s += `<text x="${x + 14}" y="${y + 26}" font-size="14" font-weight="700" fill="#9fb0c6" letter-spacing="1.5">FONTE</text>`;
  s += `<text x="${x + 14}" y="${y + 66}" font-size="34" font-weight="800" fill="#f3f6fa">5 V</text>`;
  s += `<circle cx="${x + 22}" cy="${y + 96}" r="7" fill="${on ? '#22c55e' : '#4b5563'}"/>`;
  if (on) s += `<circle cx="${x + 22}" cy="${y + 96}" r="13" fill="#22c55e" opacity="0.3"/>`;
  s += `<text x="${x + 36}" y="${y + 101}" font-size="13" font-weight="700" fill="${on ? '#86efac' : '#9aa6b5'}">${on ? 'LIGADA' : 'DESLIGADA'}</text>`;
  const [tx1, ty1] = hxy('T+1'), [tx2, ty2] = hxy('T-1');
  const px = x + w - 10;
  s += `<path d="M ${px} ${n(ty1)} C ${px + 30} ${n(ty1)} ${n(tx1 - 30)} ${n(ty1)} ${n(tx1)} ${n(ty1)}" stroke="#7f1d1d" stroke-width="11" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M ${px} ${n(ty1)} C ${px + 30} ${n(ty1)} ${n(tx1 - 30)} ${n(ty1)} ${n(tx1)} ${n(ty1)}" stroke="${C.wRed}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M ${px} ${n(ty2)} C ${px + 30} ${n(ty2)} ${n(tx2 - 30)} ${n(ty2)} ${n(tx2)} ${n(ty2)}" stroke="#000" stroke-width="11" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M ${px} ${n(ty2)} C ${px + 30} ${n(ty2)} ${n(tx2 - 30)} ${n(ty2)} ${n(tx2)} ${n(ty2)}" stroke="${C.wBlk}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  s += `<circle cx="${px}" cy="${n(ty1)}" r="9" fill="#b91c1c" stroke="#450a0a" stroke-width="2"/>`;
  s += `<circle cx="${px}" cy="${n(ty2)}" r="9" fill="#111" stroke="#000" stroke-width="2"/>`;
  s += tip(tx1, ty1) + tip(tx2, ty2);
  return s;
}

// Componentes da montagem final (furos conforme o mapa de ligações).
const COMP = {
  supply: { type: 'supply', tags: [['T+1', '+5 V'], ['T-1', 'GND']] },
  br_p: { type: 'wire', a: 'T+30', b: 'B+30', color: C.wRed },
  br_n: { type: 'wire', a: 'T-29', b: 'B-29', color: C.wBlk },
  ic: { type: 'ic', c: 15 },
  w_p8: { type: 'wire', a: 'a15', b: 'T+15', color: C.wRed },
  w_p4: { type: 'wire', a: 'j18', b: 'B-18', color: C.wBlk },
  cap: { type: 'cap', a: 'T+14', b: 'T-14', tags: [['T+14', '+5 V', 'left'], ['T-14', 'GND', 'left']] },
  w_p5: { type: 'wire', a: 'a18', b: 'T-18', color: C.wBlk },
  w_67: { type: 'wire', a: 'c16', b: 'c17', color: C.wPur },
  S1: { type: 'switch', c: 1, row: 'g', idx: 0 },
  w_s1p: { type: 'wire', a: 'j1', b: 'B+1', color: C.wRed },
  w_s1n: { type: 'wire', a: 'j3', b: 'B-3', color: C.wBlk },
  S2: { type: 'switch', c: 8, row: 'g', idx: 1 },
  w_s2p: { type: 'wire', a: 'j8', b: 'B+8', color: C.wRed },
  w_s2n: { type: 'wire', a: 'j10', b: 'B-10', color: C.wBlk },
  R1: { type: 'res', a: 'f2', b: 'f5', bands: R10K },
  R2: { type: 'res', a: 'i9', b: 'i5', bands: R10K },
  R0: { type: 'res', a: 'j5', b: 'B-7', bands: R4K7 },
  w_vs: { type: 'wire', a: 'h5', b: 'h17', color: C.wYel },
  pot: { type: 'pot', c: 11, row: 'f' },
  w_potp: { type: 'wire', a: 'j11', b: 'B+11', color: C.wRed },
  w_potn: { type: 'wire', a: 'j13', b: 'B-13', color: C.wBlk },
  w_vref: { type: 'wire', a: 'i12', b: 'i16', color: C.wGrn },
  w_out: { type: 'wire', a: 'g15', b: 'g21', color: C.wOrg },
  Rled: { type: 'res', a: 'h21', b: 'h25', bands: R1K },
  led: { type: 'led', a: 'g25', k: 'g26' },
  w_led: { type: 'wire', a: 'j26', b: 'B-26', color: C.wBlk },
};
// Ordem de desenho (de baixo para cima).
const ZORDER = ['supply', 'cap', 'R1', 'R2', 'R0', 'Rled', 'S1', 'S2', 'pot', 'ic',
  'br_p', 'br_n', 'w_p8', 'w_p4', 'w_p5', 'w_67', 'w_s1p', 'w_s1n', 'w_s2p', 'w_s2n',
  'w_vs', 'w_potp', 'w_potn', 'w_vref', 'w_out', 'w_led', 'led'];

function compSVG(id, st) {
  const c = COMP[id];
  switch (c.type) {
    case 'supply': return supplyAt(st.power);
    case 'wire': { const [x1, y1] = hxy(c.a), [x2, y2] = hxy(c.b); return wireAt(x1, y1, x2, y2, c.color); }
    case 'res': { const [x1, y1] = hxy(c.a), [x2, y2] = hxy(c.b); return resistorAt(x1, y1, x2, y2, c.bands); }
    case 'cap': { const [x1, y1] = hxy(c.a), [x2, y2] = hxy(c.b); return capAt(x1, y1, x2, y2, 0.47 * P); }
    case 'switch': return switchAt(cx(c.c + 1), ry(c.row), st.knob[c.idx]);
    case 'pot': return potAt(cx(c.c + 1), ry(c.row), st.pot);
    case 'ic': return chipAt([0, 1, 2, 3].map(k => cx(c.c + k)), ry('e'), ry('f'));
    case 'led': { const [xa, ya] = hxy(c.a), [xk, yk] = hxy(c.k); return ledAt(xa, ya, xk, yk, st.ledOn); }
  }
  return '';
}
function compTags(id) {
  const c = COMP[id];
  if (c.tags) return c.tags.map(([h, l, side]) => ({ h, l, side }));
  switch (c.type) {
    case 'wire': case 'res': case 'cap': return [c.a, c.b].map(h => ({ h, l: holeLabel(h) }));
    case 'switch': return [0, 1, 2].map(k => ({ h: c.row + (c.c + k), l: c.row + (c.c + k) }));
    case 'pot': return [0, 1, 2].map(k => ({ h: c.row + (c.c + k), l: c.row + (c.c + k), side: 'below' }));
    case 'led': return [{ h: c.a, l: c.a + ' (+)', side: 'left' }, { h: c.k, l: c.k + ' (−)', side: 'right' }];
  }
  return [];
}

// --------------------------------------------------------- etapas e roteiro
const STEPS = [
  { key: 'intro', label: '', title: 'Perceptron físico na protoboard' },
  { key: 'plan', label: 'VISÃO GERAL', title: 'O que vamos montar' },
  { key: 'parts', label: 'VISÃO GERAL', title: 'Material' },
  { key: 'board', label: 'ANTES DE COMEÇAR', title: 'Conhecendo a protoboard', panel: 'items' },
  { key: 'p1', label: 'PASSO 1 DE 8', title: 'Alimentação da protoboard', panel: 'items' },
  { key: 'p2', label: 'PASSO 2 DE 8', title: 'Posicionar o LM358', panel: 'items' },
  { key: 'p3', label: 'PASSO 3 DE 8', title: 'Alimentar o LM358', panel: 'items' },
  { key: 'p4', label: 'PASSO 4 DE 8', title: 'Segundo amplificador', panel: 'items' },
  { key: 'p5', label: 'PASSO 5 DE 8', title: 'Chaves de entrada', panel: 'items' },
  { key: 'p6', label: 'PASSO 6 DE 8', title: 'Nó de soma', panel: 'items' },
  { key: 'p7', label: 'PASSO 7 DE 8', title: 'Limiar com o potenciômetro', panel: 'items' },
  { key: 'p8', label: 'PASSO 8 DE 8', title: 'Saída e LED', panel: 'items' },
  { key: 'rev', label: 'ANTES DE LIGAR', title: 'Revisão', panel: 'checks' },
  { key: 'on', label: 'TESTE', title: 'Ligar e calibrar', panel: 'items' },
  { key: 'test', label: 'TESTE', title: 'Função AND', panel: 'table' },
  { key: 'diag', label: 'DIAGNÓSTICO', title: 'Se algo der errado' },
  { key: 'or', label: 'BÔNUS', title: 'O mesmo circuito faz OR', panel: 'items' },
  { key: 'end', label: '', title: 'Resumo' },
];
const STEP_IDX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));

const CHECKS = [
  'Meia-lua do LM358 para a esquerda',
  'Pino 8 no +5 V',
  'Pino 4 no GND',
  'Nenhum fio ligando +5 V direto ao GND',
  'V_{S} (coluna 5) chega ao pino 3',
  'Cursor (V_{ref}) chega ao pino 2',
  'LED: perna longa do lado do resistor',
  'Todas as partes no mesmo GND',
];

// Furos destacados na protoboard enquanto cada item da revisão é marcado.
const CHECK_HL = [
  ['e15', 'f15'], ['a15', 'T+15'], ['j18', 'B-18'], [],
  ['h5', 'h17'], ['i12', 'i16'], ['g25', 'h25'], ['T-1', 'B-29'],
];
function checksDone(b, lt) {
  return b.checks[0] + clamp(Math.floor((lt - 0.6) / 1.1) + 1, 0, b.checks[1] - b.checks[0]);
}

const BEATS = [
  // ---- abertura e visão geral
  { step: 'intro', scene: 'title',
    cap: 'Neste vídeo, vamos montar na protoboard o perceptron que implementa a função AND — passo a passo, furo por furo.' },
  { step: 'plan', scene: 'diagram', reveal: 0,
    cap: 'O treinamento acontece no R. O circuito apenas executa a regra aprendida: os pesos viram resistores e o viés vira uma tensão de referência.' },
  { step: 'plan', scene: 'diagram', reveal: 1,
    cap: 'Com w_{1} = w_{2} = 2 e b = −3, usamos R1 = R2 = 10 kΩ, R0 = 4,7 kΩ e um limiar de cerca de 1,8 V. O LED acende só quando x_{1} = x_{2} = 1.' },
  { step: 'parts', scene: 'parts', hlRes: false,
    cap: 'Separe o material: protoboard, fonte regulada de 5 V, LM358, duas chaves, potenciômetro de 10 kΩ, resistores, LED, capacitor de 100 nF, jumpers e multímetro.' },
  { step: 'parts', scene: 'parts', hlRes: true,
    cap: 'Identifique os resistores pelas cores: 10 kΩ é marrom-preto-laranja, 4,7 kΩ é amarelo-violeta-vermelho e 1 kΩ é marrom-preto-vermelho.' },

  // ---- anatomia da protoboard
  { step: 'board', scene: 'board', hl: 'col', item: 'Cada coluna tem dois grupos de 5 furos ligados: a–e e f–j',
    cap: 'Na protoboard, os cinco furos de uma mesma coluna numerada estão ligados entre si: a–e na metade de cima e f–j na metade de baixo.' },
  { step: 'board', scene: 'board', hl: 'gap', item: 'O canal central isola as duas metades',
    cap: 'O canal central separa as duas metades. É sobre ele que o chip será encaixado, para que os pinos de um lado não encostem nos do outro.' },
  { step: 'board', scene: 'board', hl: 'rails', item: 'Trilhas: + (linha vermelha) e − (linha azul)',
    cap: 'As trilhas das bordas levam a alimentação. Neste vídeo, a trilha de fora é +5 V (linha vermelha) e a de dentro é GND (linha azul).' },
  { step: 'board', scene: 'board', hl: 'railbreak', item: 'Trilha interrompida no meio? Una com um jumper',
    cap: 'Confira as marcas da sua protoboard. Em alguns modelos, as trilhas são interrompidas no meio: nesse caso, una as duas metades com um jumper.' },

  // ---- passo 1
  { step: 'p1', scene: 'board', add: ['supply'], item: 'Fonte *desligada*: + na trilha + e GND na trilha − (em cima)',
    cap: 'Passo 1: com a fonte *desligada*, ligue o positivo de 5 V à trilha + de cima e o GND à trilha − de cima. Ela só será ligada no final.' },
  { step: 'p1', scene: 'board', add: ['br_p', 'br_n'], item: 'Pontes na direita: + com + (col. 30) e − com − (col. 29)',
    cap: 'Leve +5 V e GND também às trilhas de baixo com dois jumpers na ponta direita: o vermelho liga + com +, e o preto liga − com −.' },

  // ---- passo 2
  { step: 'p2', scene: 'board', fig: 'pinout', item: 'Ache a meia-lua: o pino 1 fica ao lado dela',
    cap: 'Passo 2: pegue o LM358 e encontre a meia-lua (ou o pontinho) no corpo do chip. Ela marca o pino 1, e a contagem segue no sentido anti-horário.' },
  { step: 'p2', scene: 'board', add: ['ic'], hl: 'icpins', fig: 'pinout', item: 'Chip sobre o canal, colunas 15 a 18, meia-lua à esquerda',
    cap: 'Encaixe o chip sobre o canal central, nas colunas 15 a 18, com a meia-lua para a esquerda. Os pinos 1 a 4 ficam embaixo e os pinos 8 a 5, em cima.' },
  { step: 'p2', scene: 'board', hl: 'icA', fig: 'pinout', item: 'Usaremos o amplificador A: pinos 1, 2 e 3',
    cap: 'Vamos usar o primeiro amplificador: o pino 3 recebe a soma V_{S}, o pino 2 recebe o limiar V_{ref} e o pino 1 é a saída que acende o LED.' },

  // ---- passo 3
  { step: 'p3', scene: 'board', add: ['w_p8'], item: 'Pino 8 → +5 V: jumper a15 → trilha +',
    cap: 'Passo 3: ligue o pino 8 ao +5 V com um jumper vermelho, do furo a15 até a trilha + de cima.' },
  { step: 'p3', scene: 'board', add: ['w_p4'], item: 'Pino 4 → GND: jumper j18 → trilha −',
    cap: 'Ligue o pino 4 ao GND com um jumper preto, do furo j18 até a trilha − de baixo.' },
  { step: 'p3', scene: 'board', add: ['cap'], item: 'Capacitor 100 nF entre + e −, ao lado do chip',
    cap: 'Coloque o capacitor de 100 nF entre +5 V e GND, bem ao lado do chip. É o mesmo que ligá-lo entre os pinos 8 e 4, e ele estabiliza a alimentação.' },

  // ---- passo 4
  { step: 'p4', scene: 'board', add: ['w_p5'], item: 'Pino 5 → GND: jumper a18 → trilha −',
    cap: 'Passo 4: o segundo amplificador não será usado, mas não pode ficar com as entradas soltas. Ligue o pino 5 ao GND: jumper de a18 até a trilha −.' },
  { step: 'p4', scene: 'board', add: ['w_67'], item: 'Pino 6 ↔ pino 7: jumper c16 → c17',
    cap: 'Agora ligue o pino 6 ao pino 7 com um jumper curto, de c16 a c17. Assim o segundo amplificador fica quieto, como um seguidor de 0 V.' },

  // ---- passo 5
  { step: 'p5', scene: 'board', add: ['S1'], item: 'Chave x_{1} em g1, g2, g3 (comum = g2)',
    cap: 'Passo 5: encaixe a chave da entrada x_{1} nos furos g1, g2 e g3. O terminal do meio, g2, é o comum: é ele que vai para o resistor.' },
  { step: 'p5', scene: 'board', add: ['w_s1p', 'w_s1n'], item: 'j1 → +5 V e j3 → GND',
    cap: 'Ligue um terminal lateral ao +5 V (jumper de j1 até a trilha +) e o outro ao GND (de j3 até a trilha −). A chave escolhe entre 0 V e 5 V.' },
  { step: 'p5', scene: 'board', add: ['S2', 'w_s2p', 'w_s2n'], item: 'Chave x_{2} em g8, g9, g10; j8 → +5 V e j10 → GND',
    cap: 'Repita para a entrada x_{2}: chave em g8, g9 e g10, jumper de j8 até o +5 V e de j10 até o GND.' },
  { step: 'p5', scene: 'board', fig: 'common', item: 'Confira o comum com o multímetro',
    cap: 'Atenção: confira com o multímetro qual terminal é o comum da sua chave, pois a posição da alavanca não garante isso. E nunca ligue +5 V direto no GND.' },

  // ---- passo 6
  { step: 'p6', scene: 'board', add: ['R1'], fig: 'formula', item: 'R1 (10 kΩ): f2 → f5',
    cap: 'Passo 6: a coluna 5 será o nó de soma, V_{S}. Ligue R1, de 10 kΩ, do furo f2 (comum da chave x_{1}) até f5.' },
  { step: 'p6', scene: 'board', add: ['R2'], fig: 'formula', item: 'R2 (10 kΩ): i9 → i5',
    cap: 'Ligue R2, também de 10 kΩ, do furo i9 (comum da chave x_{2}) até i5.' },
  { step: 'p6', scene: 'board', add: ['R0'], fig: 'formula', item: 'R0 (4,7 kΩ): j5 → trilha −',
    cap: 'Ligue R0, de 4,7 kΩ, do furo j5 até a trilha GND. Ele puxa o nó para 0 V quando as duas chaves estão em 0.' },
  { step: 'p6', scene: 'board', add: ['w_vs'], fig: 'formula', item: 'V_{S} → pino 3: jumper h5 → h17',
    cap: 'Por fim, leve V_{S} ao pino 3 do LM358 com um jumper amarelo, do furo h5 até h17.' },

  // ---- passo 7
  { step: 'p7', scene: 'board', add: ['pot'], item: 'Potenciômetro em f11, f12, f13 (cursor = f12)',
    cap: 'Passo 7: o potenciômetro de 10 kΩ gera o limiar. Encaixe-o nos furos f11, f12 e f13. O terminal do meio, f12, é o cursor.' },
  { step: 'p7', scene: 'board', add: ['w_potp', 'w_potn'], item: 'j11 → +5 V e j13 → GND',
    cap: 'Ligue um terminal externo ao +5 V (jumper de j11 até a trilha +) e o outro ao GND (de j13 até a trilha −).' },
  { step: 'p7', scene: 'board', add: ['w_vref'], item: 'Cursor → pino 2: jumper i12 → i16',
    cap: 'Leve o cursor ao pino 2 do LM358 com um jumper verde, do furo i12 até i16. Girando o potenciômetro, V_{ref} varia entre 0 e 5 V.' },

  // ---- passo 8
  { step: 'p8', scene: 'board', add: ['w_out'], item: 'Pino 1 → coluna 21: jumper g15 → g21',
    cap: 'Passo 8: leve a saída, o pino 1, para a direita com um jumper laranja, do furo g15 até g21.' },
  { step: 'p8', scene: 'board', add: ['Rled'], item: 'Resistor 1 kΩ: h21 → h25',
    cap: 'Coloque o resistor de 1 kΩ de h21 até h25. Ele limita a corrente do LED e nunca deve ser retirado.' },
  { step: 'p8', scene: 'board', add: ['led'], fig: 'led', item: 'LED: perna longa em g25, perna curta em g26',
    cap: 'O LED tem polaridade: a perna longa (ânodo) vai em g25, junto do resistor; a perna curta (cátodo, lado chato) vai em g26.' },
  { step: 'p8', scene: 'board', add: ['w_led'], fig: 'led', item: 'Cátodo → GND: jumper j26 → trilha −',
    cap: 'Feche o circuito ligando a coluna 26 ao GND, com um jumper preto de j26 até a trilha −. A montagem está completa!' },

  // ---- revisão
  { step: 'rev', scene: 'board', checks: [0, 4],
    cap: 'Antes de ligar, revise: meia-lua para a esquerda, pino 8 no +5 V, pino 4 no GND e nenhum fio ligando +5 V direto ao GND.' },
  { step: 'rev', scene: 'board', checks: [4, 8],
    cap: 'Confira também: V_{S} no pino 3, V_{ref} no pino 2, LED com a perna longa do lado do resistor e todas as partes no mesmo GND.' },

  // ---- ligar e calibrar
  { step: 'on', scene: 'board', power: true, meter: { red: 'T+7', black: 'T-10', q: 'RAIL', redLabel: 'trilha +', blackLabel: 'trilha −', redAng: 55, blackAng: 55 },
    item: 'Ligue a fonte e meça entre + e −: cerca de 5 V',
    cap: 'Tudo certo? Ligue a fonte. Com o multímetro em tensão contínua, meça entre as trilhas + e −: o valor deve ficar perto de 5 V.' },
  { step: 'on', scene: 'board', pot: 1.8, potAt: 1.2, potDur: 3.6, meter: { red: 'g12', black: 'T-22', q: 'POT', redLabel: 'g12 (cursor)', blackLabel: 'GND', redAng: -150, blackAng: -60 },
    item: 'Meça o cursor (g12) e ajuste para cerca de 1,8 V', extra: 2.5,
    cap: 'Agora meça o cursor do potenciômetro (furo g12) em relação ao GND e gire até cerca de 1,8 V. Esse é o limiar da função AND.' },

  // ---- teste AND
  { step: 'test', scene: 'board', sw: [0, 0], row: 0, meter: { red: 'g5', black: 'T-22', q: 'VS', redLabel: 'g5 (V_{S})', blackLabel: 'GND', redAng: -40, blackAng: -60 },
    cap: 'Teste as quatro combinações medindo V_{S} na coluna 5. Com x_{1} = 0 e x_{2} = 0, V_{S} = 0 V, abaixo do limiar: LED apagado.' },
  { step: 'test', scene: 'board', sw: [0, 1], row: 1, meter: { red: 'g5', black: 'T-22', q: 'VS', redLabel: 'g5 (V_{S})', blackLabel: 'GND', redAng: -40, blackAng: -60 },
    cap: 'x_{1} = 0 e x_{2} = 1: V_{S} ≈ 1,21 V, ainda abaixo de 1,8 V. LED apagado.' },
  { step: 'test', scene: 'board', sw: [1, 0], row: 2, meter: { red: 'g5', black: 'T-22', q: 'VS', redLabel: 'g5 (V_{S})', blackLabel: 'GND', redAng: -40, blackAng: -60 },
    cap: 'x_{1} = 1 e x_{2} = 0: o mesmo valor, cerca de 1,21 V. LED apagado.' },
  { step: 'test', scene: 'board', sw: [1, 1], row: 3, meter: { red: 'g5', black: 'T-22', q: 'VS', redLabel: 'g5 (V_{S})', blackLabel: 'GND', redAng: -40, blackAng: -60 },
    cap: 'x_{1} = 1 e x_{2} = 1: V_{S} ≈ 2,42 V, acima do limiar. O LED acende — o circuito implementa a função AND!' },
  { step: 'test', scene: 'board', row: 4, meter: { red: 'g5', black: 'T-22', q: 'VS', redLabel: 'g5 (V_{S})', blackLabel: 'GND', redAng: -40, blackAng: -60 },
    cap: 'Com R0 = 4,7 kΩ, as tensões ficam um pouco abaixo das teóricas com 5 kΩ (1,25 V e 2,50 V). Vale o que você medir: anote tudo na folha de registro.' },

  // ---- diagnóstico
  { step: 'diag', scene: 'diag', cards: [0],
    cap: 'LED nunca acende? Confira a polaridade do LED, a alimentação do LM358 (pinos 8 e 4), o resistor de 1 kΩ e a tensão de referência.' },
  { step: 'diag', scene: 'diag', cards: [1],
    cap: 'LED sempre aceso? Meça V_{S} e V_{ref}: o limiar pode estar baixo demais, ou os fios dos pinos 2 e 3 podem estar trocados.' },
  { step: 'diag', scene: 'diag', cards: [2, 3],
    cap: 'As chaves não mudam nada? Verifique o comum das chaves e o GND comum. O LED pisca? Afaste V_{ref} das tensões medidas.' },

  // ---- bônus OR
  { step: 'or', scene: 'board', pot: 0.6, potAt: 1.0, potDur: 3.2, meter: { red: 'g12', black: 'T-22', q: 'POT', redLabel: 'g12 (cursor)', blackLabel: 'GND', redAng: -150, blackAng: -60 },
    item: 'Gire o cursor até cerca de 0,6 V', extra: 2,
    cap: 'Bônus: gire o potenciômetro até cerca de 0,6 V. Sem trocar nenhuma peça, o mesmo circuito passa a implementar a função OR.' },
  { step: 'or', scene: 'board', swSeq: [[0, 0], [0, 1], [1, 0], [1, 1]], seqDt: 1.8, meter: { red: 'g5', black: 'T-22', q: 'VS', redLabel: 'g5 (V_{S})', blackLabel: 'GND', redAng: -40, blackAng: -60 },
    item: 'Teste: 00 apagado; 01, 10 e 11 acesos', extra: 2,
    cap: 'Agora o LED acende em 01, 10 e 11, e só fica apagado em 00. Quem decide a regra lógica é o limiar.' },

  // ---- encerramento
  { step: 'end', scene: 'end',
    cap: 'Resumo: dados rotulados → treino em R → pesos e viés → resistores e limiar → classificação física. Bom experimento!' },
];

// ----------------------------------------------------- linha do tempo e estado
const XF = 0.6;   // duração da transição entre cenas
const NARR_OFFSET = 0.4;   // a fala começa um pouco depois do início do trecho
function capWords(s) { return s.replace(/[_{}*]/g, '').split(/\s+/).filter(Boolean).length; }
function computeTimeline() {
  let t = 0;
  let st = { power: false, sw: [0, 0], pot: 2.9 };
  const added = {};
  const audio = window.AUDIO_DURS;
  if (window.FALAS && window.FALAS.length !== BEATS.length) throw new Error('falas.js e BEATS têm tamanhos diferentes');
  BEATS.forEach((b, k) => {
    b.stepIdx = STEP_IDX[b.step];
    b.fala = window.FALAS ? window.FALAS[k] : '';
    let d;
    if (audio && audio[k]) {
      // com narração, o trecho dura o tempo da fala mais uma pequena pausa
      d = NARR_OFFSET + audio[k] + 0.9;
      if (b.potDur) d = Math.max(d, b.potAt + b.potDur + 1.5);
      if (b.swSeq) d = Math.max(d, b.swSeq.length * b.seqDt + 1.0);
    } else {
      d = Math.max(4.5, capWords(b.cap) / 2.6 + 1.3);
      if (b.add) d += 0.35 * (b.add.length - 1);
      if (b.potDur) d = Math.max(d, b.potAt + b.potDur + 3.5);
      if (b.swSeq) d = Math.max(d, b.swSeq.length * b.seqDt + 1.5);
      d += b.extra || 0;
    }
    if (b.checks) d = Math.max(d, (b.checks[1] - b.checks[0]) * 1.1 + 2.5);
    if (k === BEATS.length - 1) d += 2.5;
    b.dur = Math.round(d * 10) / 10;
    b.start = Math.round(t * 1000) / 1000;
    t += b.dur;
    b.st0 = { ...st, sw: st.sw.slice() };
    if (b.power !== undefined) st.power = b.power;
    if (b.sw) st.sw = b.sw.slice();
    if (b.swSeq) st.sw = b.swSeq[b.swSeq.length - 1].slice();
    if (b.pot !== undefined) st.pot = b.pot;
    b.st1 = { ...st, sw: st.sw.slice() };
    (b.add || []).forEach(id => { added[id] = k; });
  });
  return { total: t, added };
}
const TL = computeTimeline();

const R1v = 10e3, R2v = 10e3, R0v = 4.7e3, VCC = 5;
function vsOf(x1, x2) { return VCC * (x1 / R1v + x2 / R2v) / (1 / R1v + 1 / R2v + 1 / R0v); }

function stateAt(k, lt) {
  const b = BEATS[k];
  const st = { power: b.st0.power, knob: b.st0.sw.slice(), pot: b.st0.pot };
  if (b.power !== undefined) st.power = lt > 0.9 ? b.power : b.st0.power;
  if (b.sw) {
    const a = easeInOut((lt - 0.5) / 0.4);
    st.knob = [0, 1].map(i => lerp(b.st0.sw[i], b.sw[i], a));
  }
  if (b.swSeq) {
    const i = clamp(Math.floor(lt / b.seqDt), 0, b.swSeq.length - 1);
    const from = i === 0 ? b.st0.sw : b.swSeq[i - 1];
    const a = easeInOut((lt - i * b.seqDt - 0.15) / 0.35);
    st.knob = [0, 1].map(j => lerp(from[j], b.swSeq[i][j], a));
  }
  if (b.pot !== undefined) st.pot = lerp(b.st0.pot, b.pot, easeInOut((lt - b.potAt) / b.potDur));
  const bits = st.knob.map(v => (v > 0.5 ? 1 : 0));
  st.bits = bits;
  st.vs = st.power ? vsOf(bits[0], bits[1]) : 0;
  st.vref = st.power ? st.pot : 0;
  st.ledOn = st.power && st.vs > st.vref ? 1 : 0;
  return st;
}

// ------------------------------------------------------------- sobreposições
function tagSVG(h, label, lt, side) {
  const [x, y] = hxy(h);
  const { row } = hparse(h);
  if (!side) side = row === 'B-' || row === 'B+' ? 'below' : 'above';
  const pulse = lt < 1.8 ? 1 + 0.35 * Math.max(0, Math.sin(lt * Math.PI * 2.2)) * (1 - lt / 1.8) : 1;
  let s = `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.3 * P * pulse)}" fill="none" stroke="${C.accent}" stroke-width="3"/>`;
  const fs = 15, tw = mw(label, fs, 700) + 14, th = 22;
  let tx = x, ty = y;
  if (side === 'above') ty = y - 0.72 * P;
  else if (side === 'below') ty = y + 0.72 * P;
  else if (side === 'left') tx = x - 0.45 * P - tw / 2;
  else if (side === 'right') tx = x + 0.45 * P + tw / 2;
  s += `<rect x="${n(tx - tw / 2)}" y="${n(ty - th / 2)}" width="${n(tw)}" height="${th}" rx="11" fill="${C.accent}" stroke="${C.accentDark}" stroke-width="1"/>`;
  s += `<text x="${n(tx)}" y="${n(ty + 5.5)}" font-size="${fs}" font-weight="700" fill="${C.accentDark}" text-anchor="middle">${esc(label)}</text>`;
  return s;
}
function pill(x, y, label, o = {}) {
  const fs = o.fs || 16, tw = (o.w || mw(label.replace(/[_{}]/g, ''), fs, 700)) + 20, th = fs + 12;
  const fill = o.fill || C.accent, tc = o.tc || C.accentDark;
  const ax = o.anchor === 'start' ? x : x - tw / 2;
  return `<rect x="${n(ax)}" y="${n(y - th / 2)}" width="${n(tw)}" height="${th}" rx="${th / 2}" fill="${fill}" stroke="${shade(fill, 0.5)}" stroke-width="1"/>`
    + T(label, ax + tw / 2, y + fs * 0.36, { size: fs, weight: 700, fill: tc, anchor: 'middle' });
}
function boardHighlight(kind, lt) {
  const a = easeOut(lt / 0.5);
  let s = `<g opacity="${n(a * 100) / 100}">`;
  const box = (x1, y1, x2, y2, col = C.accent) => `<rect x="${n(x1)}" y="${n(y1)}" width="${n(x2 - x1)}" height="${n(y2 - y1)}" rx="10" fill="${col}" fill-opacity="0.16" stroke="${col}" stroke-width="3"/>`;
  if (kind === 'col') {
    for (const [r1, r2] of [['a', 'e'], ['f', 'j']]) {
      s += box(cx(5) - 0.45 * P, ry(r1) - 0.45 * P, cx(5) + 0.45 * P, ry(r2) + 0.45 * P);
      s += `<line x1="${n(cx(5))}" y1="${n(ry(r1))}" x2="${n(cx(5))}" y2="${n(ry(r2))}" stroke="${C.accent}" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round"/>`;
    }
    s += box(cx(9) - 0.45 * P, ry('a') - 0.45 * P, cx(9) + 0.45 * P, ry('e') + 0.45 * P, C.sky);
    s += pill(cx(5) + 0.8 * P, ry('c'), 'a–e: ligados', { anchor: 'start' });
    s += pill(cx(5) + 0.8 * P, ry('h'), 'f–j: ligados', { anchor: 'start' });
    s += pill(cx(9) + 0.8 * P, ry('c'), 'outra coluna: separada', { anchor: 'start', fill: C.sky, tc: '#04121c' });
  } else if (kind === 'gap') {
    s += box(BX + 10, ry('e') + 0.62 * P, BX + BW - 10, ry('f') - 0.62 * P);
    s += pill(cx(15.5), (ry('e') + ry('f')) / 2, 'canal central — sem ligação entre e e f');
  } else if (kind === 'rails') {
    for (const [r, col, lab] of [['T+', C.railRed, '+5 V'], ['T-', C.railBlue, 'GND'], ['B-', C.railBlue, 'GND'], ['B+', C.railRed, '+5 V']]) {
      s += box(cx(1) - 0.5 * P, ry(r) - 0.36 * P, cx(NC) + 0.5 * P, ry(r) + 0.36 * P, col);
      s += pill(cx(15.5), ry(r), lab + ' — furos ligados na horizontal', { fill: col, tc: '#fff', fs: 14 });
    }
  } else if (kind === 'railbreak') {
    for (const r of ['T+', 'T-', 'B-', 'B+']) s += box(cx(1) - 0.5 * P, ry(r) - 0.36 * P, cx(NC) + 0.5 * P, ry(r) + 0.36 * P, r[1] === '+' ? C.railRed : C.railBlue);
    const xm = cx(15.5);
    for (const [r1, r2] of [['T+', 'T-'], ['B-', 'B+']]) {
      s += `<line x1="${n(xm)}" y1="${n(ry(r1) - 0.6 * P)}" x2="${n(xm)}" y2="${n(ry(r2) + 0.6 * P)}" stroke="${C.accent}" stroke-width="4" stroke-dasharray="7 6"/>`;
    }
    s += pill(xm, (ry('e') + ry('f')) / 2, 'algumas protoboards cortam as trilhas aqui');
  } else if (kind === 'icpins') {
    const c0 = COMP.ic.c;
    [8, 7, 6, 5].forEach((p, i) => { s += badge(cx(c0 + i), ry('d'), String(p)); });
    [1, 2, 3, 4].forEach((p, i) => { s += badge(cx(c0 + i), ry('g'), String(p)); });
  } else if (kind === 'icA') {
    const c0 = COMP.ic.c;
    const items = [[c0 + 2, 'g', '3 · entrada + ← V_{S}'], [c0 + 1, 'h', '2 · entrada − ← V_{ref}'], [c0, 'i', '1 · saída → LED']];
    items.forEach(([c, r, lab]) => {
      const x = cx(c), y = ry(r), x2 = cx(c0 + 4.6);
      s += `<path d="M ${n(x)} ${n(ry('f') + 0.25 * P)} L ${n(x)} ${n(y)} L ${n(x2)} ${n(y)}" fill="none" stroke="${C.accent}" stroke-width="3"/>`;
      s += `<circle cx="${n(x)}" cy="${n(ry('f'))}" r="${n(0.3 * P)}" fill="none" stroke="${C.accent}" stroke-width="3"/>`;
      s += pill(x2, y, lab, { anchor: 'start', w: mw(lab.replace(/[_{}]/g, ''), 16, 700) - 8 });
    });
  }
  return s + '</g>';
}
function badge(x, y, label, col = C.accent) {
  return `<circle cx="${n(x)}" cy="${n(y)}" r="13" fill="${col}" stroke="${C.accentDark}" stroke-width="1.2"/>`
    + `<text x="${n(x)}" y="${n(y + 5.5)}" font-size="15" font-weight="800" fill="${C.accentDark}" text-anchor="middle">${esc(label)}</text>`;
}
function probeSVG(h, color, ang) {
  const [x, y] = hxy(h);
  const t = ang * Math.PI / 180, dx = Math.cos(t), dy = Math.sin(t);
  const p1 = [x + dx * 16, y + dy * 16], p2 = [x + dx * 84, y + dy * 84], p3 = [x + dx * 125, y + dy * 125];
  let s = `<line x1="${n(p2[0])}" y1="${n(p2[1])}" x2="${n(p3[0])}" y2="${n(p3[1])}" stroke="${color === 'red' ? '#7f1d1d' : '#111'}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>`;
  s += `<line x1="${n(x)}" y1="${n(y)}" x2="${n(p1[0])}" y2="${n(p1[1])}" stroke="#cfd5dc" stroke-width="4" stroke-linecap="round"/>`;
  s += `<line x1="${n(p1[0])}" y1="${n(p1[1])}" x2="${n(p2[0])}" y2="${n(p2[1])}" stroke="${color === 'red' ? '#dc2626' : '#1f2328'}" stroke-width="13" stroke-linecap="round"/>`;
  s += `<line x1="${n(p1[0])}" y1="${n(p1[1])}" x2="${n(p2[0])}" y2="${n(p2[1])}" stroke="rgba(255,255,255,0.3)" stroke-width="3" stroke-linecap="round" transform="translate(-2,-2)"/>`;
  s += `<circle cx="${n(x)}" cy="${n(y)}" r="9" fill="none" stroke="${color === 'red' ? '#dc2626' : '#1f2328'}" stroke-width="3"/>`;
  return s;
}

// ------------------------------------------------------------ cena: protoboard
function boardLayer(k, lt, st, thumb) {
  const b = BEATS[k];
  let s = boardSVG();
  const present = ZORDER.filter(id => TL.added[id] !== undefined && TL.added[id] <= k);
  for (const id of present) {
    const isNew = TL.added[id] === k && !thumb;
    let inner = compSVG(id, st);
    if (isNew) {
      const i = b.add.indexOf(id);
      const p = easeOut((lt - 0.15 - i * 0.35) / 0.55);
      inner = `<g transform="translate(0,${n((1 - p) * -28)})" opacity="${n(p * 100) / 100}" filter="url(#glow)">${inner}</g>`;
    }
    s += inner;
  }
  if (thumb) return s;
  if (b.hl) s += boardHighlight(b.hl, lt);
  // etiquetas dos furos usados pelas peças novas
  if (b.add) {
    b.add.forEach((id, i) => {
      const lt2 = lt - 0.5 - i * 0.35;
      if (lt2 < 0) return;
      compTags(id).forEach(tg => { s += tagSVG(tg.h, tg.l, lt2, tg.side); });
    });
  }
  if (b.checks) {
    const cur = checksDone(b, lt) - 1;
    if (cur >= b.checks[0]) (CHECK_HL[cur] || []).forEach(h => {
      const [x, y] = hxy(h);
      s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.42 * P)}" fill="${C.ok}" fill-opacity="0.18" stroke="${C.ok}" stroke-width="3.5"/>`;
    });
  }
  if (b.meter) {
    s += probeSVG(b.meter.black, 'black', b.meter.blackAng);
    s += probeSVG(b.meter.red, 'red', b.meter.redAng);
  }
  // indicadores abaixo da placa quando a fonte está ligada
  if (st.power) {
    const y = BY + BH + 30;
    const lab = (x, txt, on) => pill(x, y, txt, { fill: on ? C.accent : '#2a3a52', tc: on ? C.accentDark : '#dbe4ef', fs: 17 });
    s += lab(cx(2), `x_{1} = ${st.bits[0]}`, st.bits[0]);
    s += lab(cx(8), `x_{2} = ${st.bits[1]}`, st.bits[1]);
    s += pill(cx(24.5), y, st.ledOn ? 'LED aceso' : 'LED apagado', { fill: st.ledOn ? '#ef4444' : '#2a3a52', tc: '#fff', fs: 17 });
  }
  return s;
}

// ------------------------------------------------------------ painel lateral
const PX = 1392, PY = 120, PW = 498, PH = BH;
function panelLayer(k, lt, st) {
  const b = BEATS[k], step = STEPS[b.stepIdx];
  let s = `<rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="18" fill="${C.panel}" stroke="${C.panelLine}" stroke-width="1.5"/>`;
  const x = PX + 28, iw = PW - 56;
  s += T(step.label, x, PY + 42, { size: 16, weight: 800, fill: C.accent, ls: 2 });
  const tt = rtext(step.title, x, PY + 82, { size: 30, weight: 800, maxW: iw });
  s += tt.svg;
  let y = PY + 82 + tt.h + 6;
  const beatsInStep = BEATS.map((bb, i) => [bb, i]).filter(([bb]) => bb.stepIdx === b.stepIdx);

  if (step.panel === 'items') {
    beatsInStep.filter(([bb]) => bb.item).forEach(([bb, i]) => {
      const state = i < k ? 'done' : i === k ? 'cur' : 'todo';
      const fill = state === 'cur' ? C.text : state === 'done' ? C.muted : C.dim;
      const r = rtext(bb.item, x + 40, y + 26, { size: 21, weight: state === 'cur' ? 600 : 500, fill, maxW: iw - 44, lh: 27, boldFill: C.accent });
      if (state === 'cur') s += `<rect x="${x - 12}" y="${n(y)}" width="${iw + 24}" height="${n(r.h + 18)}" rx="10" fill="#22324a"/>`;
      if (state === 'done') s += checkMark(x + 14, y + 19, C.ok);
      else if (state === 'cur') s += `<path d="M ${x + 6} ${y + 9} L ${x + 22} ${y + 19} L ${x + 6} ${y + 29} Z" fill="${C.accent}"/>`;
      else s += `<circle cx="${x + 14}" cy="${y + 19}" r="6" fill="none" stroke="${C.dim}" stroke-width="2"/>`;
      s += r.svg;
      y += r.h + 24;
    });
  } else if (step.panel === 'checks') {
    const done = b.checks ? checksDone(b, lt) : 0;
    CHECKS.forEach((txt, i) => {
      const on = i < done;
      const active = b.checks && i >= b.checks[0] && i < b.checks[1];
      s += `<rect x="${x}" y="${n(y + 6)}" width="26" height="26" rx="6" fill="${on ? C.ok : 'none'}" stroke="${on ? C.ok : C.dim}" stroke-width="2"/>`;
      if (on) s += checkMark(x + 13, y + 19, '#06210f', 1);
      s += T(txt, x + 42, y + 27, { size: 21, weight: active ? 600 : 500, fill: active || on ? C.text : C.muted, maxW: iw - 44 });
      y += 50;
    });
  } else if (step.panel === 'table') {
    s += tableFig(x, y + 4, iw, k, lt, st);
  }
  // figura
  const fig = b.fig;
  const yb = PY + PH - 18;
  if (fig === 'pinout') s += pinoutFig(PX, yb - 282, PW, b.hl === 'icA');
  if (fig === 'formula') s += formulaFig(x, yb - 210, iw);
  if (fig === 'led') s += ledFig(x, yb - 240, iw);
  if (fig === 'common') s += commonFig(x, yb - 252, iw);
  if (b.meter) s += meterFig(x, yb - 190, iw, st, b.meter);
  if (step.key === 'board' && b.hl === 'railbreak') s += noteBox(x, yb - 120, iw, 'Teste a continuidade das trilhas com o multímetro antes de montar.');
  if (step.key === 'p1') s += noteBox(x, yb - 120, iw, 'Use fonte regulada de 5 V. Não use bateria de 9 V direto nesta montagem.');
  if (step.key === 'p3' && !fig) s += noteBox(x, yb - 150, iw, 'Os pinos 8 (+5 V) e 4 (GND) alimentam os dois amplificadores do chip.');
  if (step.key === 'p4') s += noteBox(x, yb - 150, iw, 'Entradas soltas captam ruído e podem fazer o chip oscilar.');
  if (step.key === 'p7') s += noteBox(x, yb - 150, iw, 'Para a função AND, V_{ref} será ajustada para cerca de 1,8 V depois de ligar.');
  if (step.key === 'p8' && !fig) s += noteBox(x, yb - 150, iw, 'O LM358 não chega a 5 V na saída: o LED pode ter brilho moderado. É normal.');
  if (step.key === 'rev') s += noteBox(x, yb - 104, iw, 'Desligue a fonte sempre que for mudar alguma ligação.');
  return s;
}
function checkMark(x, y, col, sc = 1) {
  return `<path d="M ${n(x - 7 * sc)} ${n(y)} L ${n(x - 2 * sc)} ${n(y + 5 * sc)} L ${n(x + 8 * sc)} ${n(y - 6 * sc)}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function noteBox(x, y, w, txt) {
  const r = rtext(txt, x + 46, y + 32, { size: 19, weight: 500, fill: '#e9edf3', maxW: w - 62, lh: 25 });
  const h = r.h + 26;
  return `<rect x="${x - 6}" y="${n(y)}" width="${w + 12}" height="${n(h)}" rx="12" fill="#2a2412" stroke="#6b5413" stroke-width="1.5"/>`
    + `<circle cx="${x + 20}" cy="${n(y + 27)}" r="13" fill="${C.accent}"/>`
    + `<text x="${x + 20}" y="${n(y + 33)}" font-size="18" font-weight="900" fill="${C.accentDark}" text-anchor="middle">!</text>` + r.svg;
}
function pinoutFig(px, y, pw, onlyA) {
  const cxm = px + pw / 2, pp = 74;
  const xs = [0, 1, 2, 3].map(i => cxm + (i - 1.5) * pp);
  const yTop = y + 92, yBot = y + 192;
  let s = chipAt(xs, yTop, yBot, { fs: 24, numbers: false });
  const top = [['+5 V'], ['saída B'], ['entr. − B'], ['entr. + B']];
  const bot = [['saída A', '→ LED'], ['entr. − A', '← V_{ref}'], ['entr. + A', '← V_{S}'], ['GND']];
  const used = { 8: 1, 1: 1, 2: 1, 3: 1, 4: 1 };
  [8, 7, 6, 5].forEach((p, i) => {
    const col = onlyA && !used[p] ? C.dim : used[p] ? C.accent : C.muted;
    s += T(top[i][0], xs[i], yTop - 32, { size: 15, weight: 700, fill: col, anchor: 'middle' });
    s += badge(xs[i], yTop - 12, String(p), onlyA && !used[p] ? '#5b6779' : C.accent);
  });
  [1, 2, 3, 4].forEach((p, i) => {
    const col = used[p] ? C.accent : C.muted;
    s += badge(xs[i], yBot + 12, String(p));
    bot[i].forEach((ln, j) => { s += T(ln, xs[i], yBot + 48 + j * 20, { size: 15, weight: 700, fill: j ? C.text : col, anchor: 'middle' }); });
  });
  s += T('Vista de cima · meia-lua à esquerda', cxm, y + 14, { size: 16, weight: 600, fill: C.muted, anchor: 'middle' });
  return s;
}
function formulaFig(x, y, w) {
  let s = `<rect x="${x - 6}" y="${y}" width="${w + 12}" height="196" rx="12" fill="#101a28" stroke="${C.panelLine}"/>`;
  const fy = y + 62;
  s += T('V_{S} = 5 V ·', x + 12, fy + 8, { size: 23, weight: 700 });
  const fx = x + 168, fw = w - 180;
  s += T('x_{1}/R1 + x_{2}/R2', fx + fw / 2, fy - 12, { size: 21, weight: 600, anchor: 'middle' });
  s += `<line x1="${fx}" y1="${fy}" x2="${fx + fw}" y2="${fy}" stroke="${C.text}" stroke-width="2"/>`;
  s += T('1/R1 + 1/R2 + 1/R0', fx + fw / 2, fy + 28, { size: 21, weight: 600, anchor: 'middle' });
  const rows = [['00', '0 V'], ['01 ou 10', fmtV(vsOf(0, 1))], ['11', fmtV(vsOf(1, 1))]];
  rows.forEach(([a, v], i) => {
    const yy = y + 128 + i * 26;
    s += T(`x_{1}x_{2} = ${a}`, x + 14, yy, { size: 19, weight: 500, fill: C.muted });
    s += T('V_{S} ≈ ' + v, x + w - 10, yy, { size: 19, weight: 700, fill: C.accent, anchor: 'end' });
  });
  return s;
}
function ledFig(x, y, w) {
  const cxm = x + 120, top = y + 30;
  let s = `<rect x="${x - 6}" y="${y}" width="${w + 12}" height="236" rx="12" fill="#101a28" stroke="${C.panelLine}"/>`;
  s += `<line x1="${cxm - 14}" y1="${top + 66}" x2="${cxm - 14}" y2="${top + 178}" stroke="#b6bcc4" stroke-width="5"/>`;
  s += `<line x1="${cxm + 14}" y1="${top + 66}" x2="${cxm + 14}" y2="${top + 146}" stroke="#b6bcc4" stroke-width="5"/>`;
  s += `<path d="M ${cxm - 34} ${top + 68} L ${cxm - 34} ${top + 30} A 34 34 0 0 1 ${cxm + 34} ${top + 30} L ${cxm + 34} ${top + 68} Z" fill="#d62f2f" stroke="#7a1414" stroke-width="2"/>`;
  s += `<rect x="${cxm - 40}" y="${top + 62}" width="74" height="10" rx="2" fill="#b92525" stroke="#7a1414" stroke-width="1.5"/>`;
  s += `<line x1="${cxm + 34}" y1="${top + 58}" x2="${cxm + 34}" y2="${top + 74}" stroke="#ffd2d2" stroke-width="3"/>`;
  s += `<ellipse cx="${cxm - 14}" cy="${top + 24}" rx="8" ry="14" fill="#fff" opacity="0.35"/>`;
  s += T('Ânodo (+)', x + 218, top + 40, { size: 21, weight: 800, fill: C.accent });
  s += T('perna longa → g25', x + 218, top + 66, { size: 19, weight: 500 });
  s += T('Cátodo (−)', x + 218, top + 116, { size: 21, weight: 800, fill: C.sky });
  s += T('perna curta, lado chato', x + 218, top + 142, { size: 19, weight: 500 });
  s += T('→ g26', x + 218, top + 166, { size: 19, weight: 500 });
  s += `<line x1="${cxm - 14}" y1="${top + 178}" x2="${x + 208}" y2="${top + 58}" stroke="${C.accent}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  s += `<line x1="${cxm + 14}" y1="${top + 146}" x2="${x + 208}" y2="${top + 134}" stroke="${C.sky}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  return s;
}
function commonFig(x, y, w) {
  let s = `<rect x="${x - 6}" y="${y}" width="${w + 12}" height="244" rx="12" fill="#101a28" stroke="${C.panelLine}"/>`;
  const xm = x + w / 2, yb = y + 62;
  s += switchAt(xm, yb, 1, 2.0);
  const labels = [['+5 V', C.railRed], ['comum', C.accent], ['GND', '#9aa6b5']];
  [-1, 0, 1].forEach((k, i) => {
    const lx = xm + k * 2.0 * P;
    s += `<line x1="${n(lx)}" y1="${yb + 36}" x2="${n(lx)}" y2="${yb + 78}" stroke="#b6bcc4" stroke-width="5" stroke-linecap="round"/>`;
    s += T(labels[i][0], lx, yb + 104, { size: 19, weight: 800, fill: labels[i][1], anchor: 'middle' });
  });
  s += T('O comum alterna entre 0 V e 5 V quando a alavanca muda de lado.', x + 8, y + 196, { size: 17, weight: 500, fill: C.muted, maxW: w - 10, lh: 22 });
  return s;
}
function meterValue(st, q) {
  if (!st.power) return 0;
  if (q === 'RAIL') return 5.0;
  if (q === 'POT') return st.pot;
  return st.vs;
}
function meterFig(x, y, w, st, m) {
  const mx = x, my = y, mwid = 176, mh = 176;
  let s = `<rect x="${mx}" y="${my}" width="${mwid}" height="${mh}" rx="18" fill="#f2c318" stroke="#8a6d00" stroke-width="2"/>`;
  s += `<rect x="${mx + 12}" y="${my + 12}" width="${mwid - 24}" height="${mh - 24}" rx="12" fill="#2a2d33"/>`;
  s += `<rect x="${mx + 22}" y="${my + 24}" width="${mwid - 44}" height="58" rx="6" fill="#bcd0b0" stroke="#6c7d63" stroke-width="1.5"/>`;
  const v = meterValue(st, m.q);
  s += `<text x="${mx + mwid - 30}" y="${my + 67}" font-size="34" font-weight="700" fill="#17201a" text-anchor="end" font-family="DejaVu Sans Mono, monospace">${v.toFixed(2).replace('.', ',')}</text>`;
  s += `<circle cx="${mx + mwid / 2}" cy="${my + 128}" r="26" fill="#3b4048" stroke="#14171b" stroke-width="2"/>`;
  s += `<line x1="${mx + mwid / 2}" y1="${my + 128}" x2="${mx + mwid / 2 - 14}" y2="${my + 108}" stroke="#e8ebef" stroke-width="4" stroke-linecap="round"/>`;
  s += `<text x="${mx + 34}" y="${my + 112}" font-size="14" font-weight="800" fill="#e8ebef">V⎓</text>`;
  const tx = x + mwid + 24;
  s += T('Multímetro: tensão contínua', tx, my + 26, { size: 17, weight: 700, fill: C.muted });
  s += `<circle cx="${tx + 8}" cy="${my + 64}" r="7" fill="#dc2626"/>`;
  s += T('vermelha: ' + m.redLabel, tx + 24, my + 70, { size: 19, weight: 600, maxW: w - mwid - 50 });
  s += `<circle cx="${tx + 8}" cy="${my + 104}" r="7" fill="#1f2328" stroke="#9aa6b5"/>`;
  s += T('preta: ' + m.blackLabel, tx + 24, my + 110, { size: 19, weight: 600, maxW: w - mwid - 50 });
  s += T(v === 0 && !st.power ? 'fonte desligada' : 'leitura: ' + fmtV(v), tx, my + 156, { size: 22, weight: 800, fill: C.accent });
  return s;
}
function tableFig(x, y, w, k, lt, st) {
  const b = BEATS[k];
  const cols = [x + 10, x + 150, x + 330];
  let s = '';
  s += T('Limiar: V_{ref} ≈ 1,80 V', x, y + 22, { size: 20, weight: 700, fill: C.accent });
  y += 44;
  s += T('x_{1} x_{2}', cols[0], y + 22, { size: 18, weight: 700, fill: C.muted });
  s += T('V_{S} medida', cols[1], y + 22, { size: 18, weight: 700, fill: C.muted });
  s += T('LED', cols[2], y + 22, { size: 18, weight: 700, fill: C.muted });
  y += 34;
  const combos = [[0, 0], [0, 1], [1, 0], [1, 1]];
  combos.forEach(([a, c], i) => {
    const filled = i < b.row || (i === b.row && lt > 1.0);
    const cur = i === b.row;
    if (cur) s += `<rect x="${x - 12}" y="${y}" width="${w + 24}" height="44" rx="10" fill="#22324a"/>`;
    s += `<text x="${cols[0]}" y="${y + 30}" font-size="22" font-weight="700" fill="${cur ? C.text : C.muted}" font-family="DejaVu Sans Mono, monospace">${a} ${c}</text>`;
    if (filled) {
      const v = vsOf(a, c), on = v > 1.8;
      s += T(fmtV(v), cols[1], y + 30, { size: 22, weight: 700, fill: cur ? C.text : C.muted });
      s += `<circle cx="${cols[2] + 10}" cy="${y + 22}" r="9" fill="${on ? '#ff4d4d' : '#4a1d1d'}" stroke="${on ? '#ffd0d0' : '#2b0d0d'}"/>`;
      s += T(on ? 'aceso' : 'apagado', cols[2] + 28, y + 30, { size: 21, weight: 700, fill: on ? '#ff8a8a' : (cur ? C.text : C.muted) });
    }
    y += 50;
  });
  s += T('Nesta animação: alavanca à esquerda = 1', x, y + 18, { size: 16, weight: 500, fill: C.muted });
  return s + '';
}

// ---------------------------------------------------- cenas de tela cheia
function arrow(x1, y1, x2, y2, col = C.muted) {
  return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${col}" stroke-width="3.5" marker-end="url(#arrow)"/>`;
}
function block(x, y, w, h, t1, t2, col = '#1b2a40', stroke = '#3a5275') {
  return `<rect x="${n(x - w / 2)}" y="${n(y - h / 2)}" width="${w}" height="${h}" rx="16" fill="${col}" stroke="${stroke}" stroke-width="2"/>`
    + T(t1, x, y - (t2 ? 6 : -9), { size: 27, weight: 800, anchor: 'middle' })
    + (t2 ? T(t2, x, y + 28, { size: 20, weight: 500, fill: C.muted, anchor: 'middle' }) : '');
}
function diagramScene(k, lt) {
  const b = BEATS[k];
  let s = T('LED aceso  ⇔  w_{1}x_{1} + w_{2}x_{2} + b > 0  ⇔  V_{S} > V_{ref}', 960, 190, { size: 38, weight: 700, anchor: 'middle' });
  s += block(250, 300, 290, 100, 'Chave x_{1}', '0 V ou 5 V');
  s += block(250, 490, 290, 100, 'Chave x_{2}', '0 V ou 5 V');
  s += block(690, 395, 300, 120, 'Nó de soma', 'R1, R2 e R0');
  s += block(1150, 395, 300, 120, 'LM358', 'comparador');
  s += block(1150, 585, 300, 96, 'Potenciômetro', 'gera V_{ref}');
  s += block(1600, 395, 280, 110, 'Resistor + LED', 'saída');
  s += arrow(395, 300, 536, 372) + arrow(395, 490, 536, 418);
  s += arrow(840, 395, 994, 395) + arrow(1150, 537, 1150, 461) + arrow(1300, 395, 1454, 395);
  s += T('V_{S} → pino 3 (+)', 917, 380, { size: 18, weight: 600, fill: C.accent, anchor: 'middle' });
  s += T('V_{ref} → pino 2 (−)', 1166, 508, { size: 18, weight: 600, fill: C.accent });
  s += T('pino 1', 1377, 380, { size: 18, weight: 600, fill: C.accent, anchor: 'middle' });
  s += T('Todas as partes compartilham o mesmo GND · alimentação regulada de 5 V', 960, 680, { size: 20, weight: 500, fill: C.muted, anchor: 'middle' });
  if (b.reveal) {
    const a = easeOut((lt - 0.2) / 0.6);
    const boxes = [
      ['w_{1} = 2', 'R1 = K/w_{1} = 10 kΩ'],
      ['w_{2} = 2', 'R2 = K/w_{2} = 10 kΩ'],
      ['w_{1} + w_{2} = 4', 'R0 = 5 kΩ → use 4,7 kΩ'],
      ['b = −3', 'V_{ref} = 1,875 V → ajuste ≈ 1,8 V'],
    ];
    let g = '';
    boxes.forEach(([t1, t2], i) => {
      const bx = 110 + i * 435, by = 718;
      g += `<rect x="${bx}" y="${by}" width="415" height="104" rx="14" fill="#2a2412" stroke="#8a6a12" stroke-width="2"/>`;
      g += T(t1, bx + 207, by + 40, { size: 25, weight: 800, fill: C.accent, anchor: 'middle' });
      g += T(t2, bx + 207, by + 78, { size: 21, weight: 600, anchor: 'middle' });
    });
    s += `<g opacity="${n(a * 100) / 100}" transform="translate(0,${n((1 - a) * 20)})">${g}</g>`;
    s += `<g opacity="${n(a * 100) / 100}">` + T('K = 20 kΩ', 1810, 706, { size: 17, weight: 600, fill: C.muted, anchor: 'end' }) + '</g>';
  }
  return s;
}
function partIcon(kind, x, y) {
  switch (kind) {
    case 'board': {
      let s = `<rect x="${x - 70}" y="${y - 48}" width="140" height="96" rx="8" fill="${C.board}" stroke="${C.boardEdge}" stroke-width="2"/>`;
      s += `<line x1="${x - 60}" y1="${y - 38}" x2="${x + 60}" y2="${y - 38}" stroke="${C.railRed}" stroke-width="2"/>`;
      s += `<line x1="${x - 60}" y1="${y + 38}" x2="${x + 60}" y2="${y + 38}" stroke="${C.railBlue}" stroke-width="2"/>`;
      s += `<rect x="${x - 64}" y="${y - 3}" width="128" height="6" fill="${C.gap}"/>`;
      for (let i = 0; i < 12; i++) for (const yy of [-28, -20, -12, 12, 20, 28]) s += `<rect x="${x - 55 + i * 10}" y="${y + yy - 2}" width="4" height="4" fill="${C.hole}"/>`;
      return s;
    }
    case 'supply': return `<rect x="${x - 55}" y="${y - 45}" width="110" height="90" rx="10" fill="#2b3544" stroke="#5b6b82" stroke-width="2"/>`
      + `<text x="${x}" y="${y + 10}" font-size="30" font-weight="800" fill="#f3f6fa" text-anchor="middle">5 V</text>`
      + `<circle cx="${x - 25}" cy="${y + 30}" r="7" fill="#dc2626"/><circle cx="${x + 25}" cy="${y + 30}" r="7" fill="#111" stroke="#666"/>`;
    case 'chip': return chipAt([x - 36, x - 12, x + 12, x + 36], y - 34, y + 34, { fs: 13, numbers: false });
    case 'switch': return [-1, 0, 1].map(k => `<line x1="${x + k * 26}" y1="${y}" x2="${x + k * 26}" y2="${y + 34}" stroke="#b6bcc4" stroke-width="4"/>`).join('') + switchAt(x, y - 4, 1, 1.4);
    case 'pot': return potAt(x, y + 40, 2.5, true, 1.3);
    case 'res': return resistorAt(x - 75, y, x + 75, y, this_bands, { bl: 92, bh: 28, noTips: true });
    case 'led': return `<line x1="${x - 9}" y1="${y + 6}" x2="${x - 9}" y2="${y + 52}" stroke="#b6bcc4" stroke-width="4"/><line x1="${x + 9}" y1="${y + 6}" x2="${x + 9}" y2="${y + 38}" stroke="#b6bcc4" stroke-width="4"/>`
      + `<path d="M ${x - 22} ${y + 8} L ${x - 22} ${y - 22} A 22 22 0 0 1 ${x + 22} ${y - 22} L ${x + 22} ${y + 8} Z" fill="#d62f2f" stroke="#7a1414" stroke-width="2"/>`;
    case 'cap': return `<line x1="${x - 8}" y1="${y}" x2="${x - 8}" y2="${y + 50}" stroke="#b6bcc4" stroke-width="4"/><line x1="${x + 8}" y1="${y}" x2="${x + 8}" y2="${y + 50}" stroke="#b6bcc4" stroke-width="4"/>` + capAt(x, y - 10, x, y - 10, 26);
    case 'wires': return [C.wRed, C.wBlk, C.wYel, C.wGrn].map((c, i) => wireAt(x - 60, y - 30 + i * 20, x + 60, y - 30 + i * 20, c, 9)).join('');
    case 'meter': return `<rect x="${x - 40}" y="${y - 52}" width="80" height="104" rx="12" fill="#f2c318" stroke="#8a6d00" stroke-width="2"/><rect x="${x - 30}" y="${y - 42}" width="60" height="30" rx="4" fill="#bcd0b0"/><circle cx="${x}" cy="${y + 20}" r="16" fill="#3b4048"/>`;
  }
  return '';
}
let this_bands = R10K;
const PARTS = [
  ['board', 'Protoboard', '1', '400 pontos ou maior'],
  ['supply', 'Fonte regulada 5 V', '1', 'nunca bateria de 9 V direto'],
  ['chip', 'LM358 (DIP-8)', '1', 'comparador didático'],
  ['switch', 'Chave SPDT', '2', '3 terminais'],
  ['pot', 'Potenciômetro 10 kΩ', '1', 'ajuste do limiar'],
  ['res', 'Resistor 10 kΩ', '2', 'marrom · preto · laranja', R10K],
  ['res', 'Resistor 4,7 kΩ', '1', 'amarelo · violeta · vermelho', R4K7],
  ['res', 'Resistor 1 kΩ', '1', 'marrom · preto · vermelho', R1K],
  ['led', 'LED vermelho', '1', 'indica a saída'],
  ['cap', 'Capacitor 100 nF', '1', 'cerâmico, marcado “104”'],
  ['wires', 'Jumpers macho-macho', 'vários', 'use cores diferentes'],
  ['meter', 'Multímetro', '1', 'por grupo ou compartilhado'],
];
function partsScene(k, lt) {
  const b = BEATS[k];
  let s = '';
  const cw = 404, ch = 196, gx = 20, gy = 22, x0 = (W - (4 * cw + 3 * gx)) / 2, y0 = 150;
  PARTS.forEach(([kind, name, qty, detail, bands], i) => {
    const cxp = x0 + (i % 4) * (cw + gx), cyp = y0 + Math.floor(i / 4) * (ch + gy);
    const isRes = kind === 'res';
    const hl = b.hlRes && isRes;
    const op = b.hlRes && !isRes ? 0.32 : 1;
    let g = `<rect x="${cxp}" y="${cyp}" width="${cw}" height="${ch}" rx="16" fill="${C.panel}" stroke="${hl ? C.accent : C.panelLine}" stroke-width="${hl ? 3 : 1.5}"/>`;
    this_bands = bands || R10K;
    g += partIcon(kind, cxp + 100, cyp + ch / 2);
    g += T(name, cxp + 196, cyp + 60, { size: 23, weight: 800, maxW: cw - 206, lh: 28 });
    g += T('× ' + qty, cxp + 196, cyp + 128, { size: 22, weight: 800, fill: C.accent });
    g += T(detail, cxp + 196, cyp + 160, { size: 17, weight: 500, fill: hl ? C.text : C.muted, maxW: cw - 206 });
    s += `<g opacity="${op}">${g}</g>`;
  });
  return s;
}
const DIAG = [
  ['O LED nunca acende', ['Polaridade do LED (perna longa no resistor)', 'Pino 8 no +5 V e pino 4 no GND', 'Resistor de 1 kΩ e V_{ref}']],
  ['O LED fica sempre aceso', ['Meça V_{S} e V_{ref}', 'Limiar baixo demais?', 'Fios dos pinos 2 e 3 trocados?']],
  ['V_{S} não muda com as chaves', ['Terminal comum das chaves', 'Continuidade das trilhas', 'GND comum a todas as partes']],
  ['O LED pisca perto do limiar', ['V_{S} e V_{ref} estão muito próximas', 'Ajuste V_{ref} para o meio do intervalo', 'entre as tensões das classes 0 e 1']],
];
function diagScene(k) {
  const b = BEATS[k];
  let s = '';
  DIAG.forEach(([title, lines], i) => {
    const x = 120 + (i % 2) * 860, y = 150 + Math.floor(i / 2) * 330;
    const on = b.cards.includes(i);
    const done = Math.max(...b.cards) > i && !on;
    const op = on ? 1 : done ? 0.55 : 0.3;
    let g = `<rect x="${x}" y="${y}" width="820" height="300" rx="20" fill="${C.panel}" stroke="${on ? C.accent : C.panelLine}" stroke-width="${on ? 3 : 1.5}"/>`;
    g += `<path d="M ${x + 58} ${y + 34} L ${x + 88} ${y + 86} L ${x + 28} ${y + 86} Z" fill="${C.accent}" stroke="${C.accent}" stroke-width="6" stroke-linejoin="round"/>`;
    g += `<text x="${x + 58}" y="${y + 80}" font-size="30" font-weight="900" fill="${C.accentDark}" text-anchor="middle">!</text>`;
    g += T(title, x + 116, y + 76, { size: 34, weight: 800 });
    lines.forEach((ln, j) => {
      g += `<circle cx="${x + 64}" cy="${y + 146 + j * 50}" r="6" fill="${C.accent}"/>`;
      g += T(ln, x + 88, y + 154 + j * 50, { size: 26, weight: 500, fill: '#dde4ee' });
    });
    s += `<g opacity="${op}">${g}</g>`;
  });
  return s;
}
function endScene(k, lt) {
  const chain = ['Dados rotulados', 'Treino em R', 'w_{1}, w_{2}, b', 'R1, R2, R0, V_{ref}', 'LED: classificação física'];
  let s = '';
  const bw = 300, gap = 52, x0 = (W - (5 * bw + 4 * gap)) / 2, y = 330;
  chain.forEach((t, i) => {
    const a = easeOut((lt - 0.3 - i * 0.45) / 0.5);
    const x = x0 + i * (bw + gap);
    let g = `<rect x="${x}" y="${y - 60}" width="${bw}" height="120" rx="18" fill="${i === 4 ? '#3a1515' : '#1b2a40'}" stroke="${i === 4 ? '#ef4444' : '#3a5275'}" stroke-width="2"/>`;
    const r = rtext(t, x + bw / 2, 0, { size: 26, weight: 800, anchor: 'middle', maxW: bw - 30, lh: 32 });
    g += `<g transform="translate(0,${n(y + 10 - (r.h - 32) / 2)})">${r.svg}</g>`;
    if (i < 4) g += arrow(x + bw + 8, y, x + bw + gap - 8, y, C.accent);
    s += `<g opacity="${n(a * 100) / 100}">${g}</g>`;
  });
  const a2 = easeOut((lt - 2.8) / 0.8);
  s += `<g opacity="${n(a2 * 100) / 100}">`;
  s += T('Bom experimento!', 960, 560, { size: 72, weight: 900, anchor: 'middle', fill: C.accent });
  s += T('Desligue a fonte antes de mexer nas ligações · meça as tensões reais · anote tudo na folha de registro', 960, 640, { size: 24, weight: 500, fill: C.muted, anchor: 'middle' });
  s += `</g>`;
  return s;
}
function titleScene(k, lt) {
  const a = easeOut(lt / 1.0);
  let s = `<g opacity="${n(a * 100) / 100}">`;
  s += T('MATERIAL DIDÁTICO · CONSTRUINDO UMA REDE NEURAL FÍSICA', 110, 300, { size: 20, weight: 800, fill: C.accent, ls: 2.5 });
  s += rtext('Perceptron físico na protoboard', 110, 390, { size: 72, weight: 900, maxW: 820, lh: 84 }).svg;
  s += rtext('Montagem passo a passo da função AND com o LM358', 110, 590, { size: 32, weight: 500, fill: C.muted, maxW: 800, lh: 42 }).svg;
  s += T('8 passos · teste com multímetro · bônus: função OR', 110, 700, { size: 22, weight: 600, fill: '#cbd5e1' });
  s += `</g>`;
  // miniatura da montagem pronta
  const sc = 0.66, ox = 1000, oy = 250;
  const st = { power: true, knob: [1, 1], pot: 1.8, bits: [1, 1], vs: vsOf(1, 1), vref: 1.8, ledOn: 1 };
  const a2 = easeOut((lt - 0.4) / 1.0);
  s += `<g opacity="${n(a2 * 100) / 100}" transform="translate(${n(ox - BX * sc)},${n(oy - BY * sc + (1 - a2) * 30)}) scale(${sc})">${boardLayer(BEATS.length - 1, 99, st, true)}</g>`;
  return s;
}

// ------------------------------------------------------------ composição
const DEFS = `<defs>
<filter id="shadow" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity="0.45"/></filter>
<filter id="glow" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
  <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="d"/>
  <feGaussianBlur in="d" stdDeviation="5" result="b"/>
  <feFlood flood-color="${C.accent}" flood-opacity="1"/>
  <feComposite in2="b" operator="in" result="g"/>
  <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<radialGradient id="ledGlow"><stop offset="0" stop-color="#ff6b6b" stop-opacity="0.95"/><stop offset="0.3" stop-color="#ff2b2b" stop-opacity="0.5"/><stop offset="1" stop-color="#ff0000" stop-opacity="0"/></radialGradient>
<radialGradient id="ledOn" cx="0.4" cy="0.4"><stop offset="0" stop-color="#fff2f2"/><stop offset="0.35" stop-color="#ff7b7b"/><stop offset="1" stop-color="#ff2020"/></radialGradient>
<radialGradient id="ledOff" cx="0.4" cy="0.4"><stop offset="0" stop-color="#d86060"/><stop offset="0.5" stop-color="#a32424"/><stop offset="1" stop-color="#6e1111"/></radialGradient>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker>
</defs>`;

function sceneSVG(k, lt) {
  const b = BEATS[k];
  switch (b.scene) {
    case 'title': return titleScene(k, lt);
    case 'diagram': return diagramScene(k, lt);
    case 'parts': return partsScene(k, lt);
    case 'diag': return diagScene(k, lt);
    case 'end': return endScene(k, lt);
    case 'board': {
      const st = stateAt(k, lt);
      return boardLayer(k, lt, st) + panelLayer(k, lt, st);
    }
  }
  return '';
}
function titleBar(k) {
  const b = BEATS[k], step = STEPS[b.stepIdx];
  let s = `<rect x="0" y="0" width="${W}" height="96" fill="${C.bar}"/>`;
  if (b.scene !== 'title') {
    let x = 40;
    if (step.label) {
      const tw = mw(step.label, 17, 800) + 28;
      s += `<rect x="${x}" y="28" width="${n(tw)}" height="38" rx="19" fill="${C.accent}"/>`;
      s += `<text x="${n(x + tw / 2)}" y="53" font-size="17" font-weight="800" fill="${C.accentDark}" text-anchor="middle" letter-spacing="1">${esc(step.label)}</text>`;
      x += tw + 18;
    }
    s += T(step.title, x, 60, { size: 34, weight: 800 });
  }
  s += T('Perceptron físico · função AND', W - 40, 56, { size: 19, weight: 600, fill: C.muted, anchor: 'end' });
  const segs = STEPS.length, gap = 6, x0 = 40, tw = W - 80, sw = (tw - gap * (segs - 1)) / segs;
  for (let i = 0; i < segs; i++) {
    const col = i < b.stepIdx ? '#41526d' : i === b.stepIdx ? C.accent : '#1d293a';
    s += `<rect x="${n(x0 + i * (sw + gap))}" y="88" width="${n(sw)}" height="5" rx="2.5" fill="${col}"/>`;
  }
  return s;
}
function captionLayer(k, lt) {
  const b = BEATS[k];
  const a = easeOut(lt / 0.35);
  const size = 33, lh = 46;
  const lines = wrapRich(b.cap, size, 500, 1720);
  const y0 = 958 - (lines.length - 1) * lh / 2 + size * 0.35;
  let s = `<rect x="0" y="846" width="${W}" height="${H - 846}" fill="${C.bar}"/>`;
  s += `<rect x="0" y="846" width="${W}" height="2" fill="#1f2c40"/>`;
  s += `<g opacity="${n(a * 100) / 100}">`;
  lines.forEach((ln, i) => {
    s += `<text x="960" y="${n(y0 + i * lh)}" font-size="${size}" font-weight="500" fill="#f4f7fb" text-anchor="middle">${lineSpans(ln, size, C.accent)}</text>`;
  });
  return s + '</g>';
}
function beatAt(t) {
  let k = 0;
  while (k < BEATS.length - 1 && t >= BEATS[k + 1].start) k++;
  return k;
}
function frameSVG(t) {
  const k = beatAt(t), b = BEATS[k], lt = t - b.start;
  let body;
  const prev = k > 0 ? BEATS[k - 1] : null;
  if (prev && prev.scene !== b.scene && lt < XF) {
    const a = easeInOut(lt / XF);
    body = `<g opacity="${n((1 - a) * 100) / 100}">${sceneSVG(k - 1, prev.dur)}</g><g opacity="${n(a * 100) / 100}">${sceneSVG(k, lt)}</g>`;
  } else {
    body = sceneSVG(k, lt);
  }
  let fade = 0;
  if (t < 0.6) fade = 1 - t / 0.6;
  if (t > TL.total - 1.2) fade = clamp((t - (TL.total - 1.2)) / 1.0);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}`
    + `<rect width="${W}" height="${H}" fill="${C.bg}"/>${body}${titleBar(k)}${captionLayer(k, lt)}`
    + (fade > 0 ? `<rect width="${W}" height="${H}" fill="#000" opacity="${n(fade * 100) / 100}"/>` : '')
    + `</svg>`;
}

// Folha de consulta: montagem completa + lista de ligações (render.cjs --layout).
const LAYOUT_LIST = [
  ['LM358', 'col. 15–18, meia-lua à esquerda'],
  ['Pino 8 → +5 V', 'a15 → trilha +'],
  ['Pino 4 → GND', 'j18 → trilha −'],
  ['Pino 5 → GND', 'a18 → trilha −'],
  ['Pino 6 ↔ 7', 'c16 → c17'],
  ['C 100 nF', 'trilhas + e − (col. 14)'],
  ['Chave x_{1}', 'g1–g3 · j1 → + · j3 → −'],
  ['Chave x_{2}', 'g8–g10 · j8 → + · j10 → −'],
  ['R1 10 kΩ', 'f2 → f5'],
  ['R2 10 kΩ', 'i9 → i5'],
  ['R0 4,7 kΩ', 'j5 → trilha −'],
  ['V_{S} → pino 3', 'h5 → h17'],
  ['Pot. 10 kΩ', 'f11–f13 · j11 → + · j13 → −'],
  ['V_{ref} → pino 2', 'i12 → i16'],
  ['Saída (pino 1)', 'g15 → g21'],
  ['R 1 kΩ', 'h21 → h25'],
  ['LED', '+ g25 · − g26 · j26 → −'],
  ['Pontes', '+ col. 30 · − col. 29'],
];
window.renderLayout = function () {
  const st = { power: false, knob: [0, 0], pot: 1.8, bits: [0, 0], vs: 0, vref: 0, ledOn: 0 };
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
  s += boardLayer(BEATS.length - 1, 99, st, true);
  s += `<rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="18" fill="${C.panel}" stroke="${C.panelLine}" stroke-width="1.5"/>`;
  s += T('MAPA DE LIGAÇÕES', PX + 28, PY + 40, { size: 16, weight: 800, fill: C.accent, ls: 2 });
  LAYOUT_LIST.forEach(([a, b], i) => {
    const y = PY + 80 + i * 32.5;
    s += T(a, PX + 28, y, { size: 18, weight: 700 });
    s += T(b, PX + PW - 24, y, { size: 18, weight: 500, fill: '#cbd5e1', anchor: 'end' });
  });
  s += `<rect x="0" y="0" width="${W}" height="96" fill="${C.bar}"/>`;
  s += T('Perceptron físico · montagem completa (função AND)', 40, 60, { size: 34, weight: 800 });
  s += T('Fonte desligada até revisar tudo', W - 40, 56, { size: 19, weight: 600, fill: C.muted, anchor: 'end' });
  s += `<rect x="0" y="846" width="${W}" height="${H - 846}" fill="${C.bar}"/>`;
  s += T('Medições: V_{S} em g5 · V_{ref} no cursor (g12) · GND em qualquer furo da trilha −', 960, 935, { size: 30, weight: 600, anchor: 'middle' });
  s += T('Esperado com V_{ref} ≈ 1,8 V: 00 → 0 V · 01 e 10 → 1,21 V · 11 → 2,42 V (LED aceso só em 11)', 960, 990, { size: 26, weight: 500, fill: C.muted, anchor: 'middle' });
  s += `</svg>`;
  document.getElementById('root').innerHTML = s;
  LAST = '';
};

let LAST = '';
window.renderAt = function (t) {
  const svg = frameSVG(t);
  if (svg === LAST) return false;
  document.getElementById('root').innerHTML = svg;
  LAST = svg;
  return true;
};
window.TIMELINE = {
  total: TL.total,
  narrOffset: NARR_OFFSET,
  narrated: !!window.AUDIO_DURS,
  beats: BEATS.map(b => ({ start: b.start, dur: b.dur, step: STEPS[b.stepIdx].label, title: STEPS[b.stepIdx].title, cap: b.cap, fala: b.fala, item: b.item || '', scene: b.scene })),
};
window.READY = true;
