/** Hizmet kartları ve portföy için dekoratif teknik SVG illüstrasyonlar (WebGL gerektirmez). */
const G = '#113F28';
const C = '#4CB8C4';
const B = '#5D4037';
const O = '#E39A4A';
const L = '#cfd8d3';

const wrap = (body, vb = '0 0 160 96') =>
  `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="w-full h-full">${body}</svg>`;

const gridBg = (step = 16) => {
  let s = '';
  for (let x = 0; x <= 160; x += step) s += `<line x1="${x}" y1="0" x2="${x}" y2="96" stroke="${L}" stroke-width="0.5"/>`;
  for (let y = 0; y <= 96; y += step) s += `<line x1="0" y1="${y}" x2="160" y2="${y}" stroke="${L}" stroke-width="0.5"/>`;
  return s;
};

export const illustrations = {
  stakeout: wrap(`${gridBg()}
    <rect x="52" y="26" width="56" height="40" fill="none" stroke="${G}" stroke-width="1.2" stroke-dasharray="3 3"/>
    <g stroke="${O}" stroke-width="1" class="anim-dash-hover anim-dash">
      <path d="M18 82 L52 26 M18 82 L108 26 M18 82 L108 66 M18 82 L52 66" fill="none"/>
    </g>
    <path d="M14 86 l4 -10 l4 10 z" fill="${B}"/>
    ${[[52, 26], [108, 26], [108, 66], [52, 66]].map(([x, y]) => `<g><circle cx="${x}" cy="${y}" r="5" fill="none" stroke="${C}" class="anim-pulse"/><circle cx="${x}" cy="${y}" r="2.2" fill="${G}"/></g>`).join('')}
    <text x="112" y="22" font-size="7" font-family="monospace" fill="${G}">B2</text>`),

  map: wrap(`${gridBg(20)}
    ${[0, 1, 2, 3, 4].map((k) => `<path d="M-5 ${78 - k * 13} C 40 ${64 - k * 12}, 70 ${90 - k * 15}, 165 ${58 - k * 10}" fill="none" stroke="${k % 2 ? L : G}" stroke-width="${k % 2 ? 0.8 : 1.1}" class="anim-dash-hover"/>`).join('')}
    <rect x="98" y="30" width="22" height="16" fill="#fff" stroke="${B}" stroke-width="1"/>
    <path d="M20 90 L48 52 L70 48" fill="none" stroke="${B}" stroke-width="2.4" opacity="0.5"/>
    <circle cx="130" cy="70" r="4" fill="${G}" opacity="0.7"/><circle cx="138" cy="60" r="3" fill="${G}" opacity="0.6"/>
    <text x="8" y="12" font-size="7" font-family="monospace" fill="${G}">+35.00</text>`),

  parcel: wrap(`${gridBg()}
    <path d="M34 70 L102 74 L118 30 L80 16 L30 26 Z" fill="${C}" fill-opacity="0.12" stroke="${G}" stroke-width="1.4" class="anim-dash-hover anim-dash"/>
    <path d="M102 74 L150 78 L154 36 L118 30" fill="none" stroke="${L}" stroke-width="1"/>
    ${[[34, 70], [102, 74], [118, 30], [80, 16], [30, 26]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff" stroke="${G}" stroke-width="1.2"/><text x="${x + 4}" y="${y - 4}" font-size="6.5" font-family="monospace" fill="${B}">K${i + 1}</text>`).join('')}`),

  cutfill: wrap(`
    <path d="M0 40 C 30 30, 50 28, 80 46 S 130 70, 160 62 L160 52 L0 52 Z" fill="${O}" fill-opacity="0.18"/>
    <path d="M0 52 L160 52 L160 62 C 130 70, 110 56, 80 46 L 80 52 Z" fill="${C}" fill-opacity="0.22"/>
    <path d="M0 40 C 30 30, 50 28, 80 46 S 130 70, 160 62" fill="none" stroke="${B}" stroke-width="1.6"/>
    <line x1="0" y1="52" x2="160" y2="52" stroke="${G}" stroke-width="1.2" stroke-dasharray="5 3"/>
    <text x="16" y="47" font-size="7" font-family="monospace" fill="#a1462f">KAZI</text>
    <text x="118" y="61" font-size="7" font-family="monospace" fill="#2f6d9f">DOLGU</text>
    <text x="104" y="49" font-size="6" font-family="monospace" fill="${G}">±0.00</text>
    ${[20, 50, 80, 110, 140].map((x) => `<line x1="${x}" y1="74" x2="${x}" y2="82" stroke="${L}"/>`).join('')}
    <line x1="0" y1="78" x2="160" y2="78" stroke="${L}"/>`),

  construction: wrap(`${gridBg()}
    <g stroke="${C}" stroke-width="0.8" stroke-dasharray="4 3">
      ${[40, 80, 120].map((x) => `<line x1="${x}" y1="6" x2="${x}" y2="90"/>`).join('')}
      ${[28, 68].map((y) => `<line x1="10" y1="${y}" x2="150" y2="${y}"/>`).join('')}
    </g>
    ${[40, 80, 120].flatMap((x) => [28, 68].map((y) => `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="${G}"/>`)).join('')}
    ${['A', 'B', 'C'].map((t, i) => `<circle cx="${40 + i * 40}" cy="8" r="5" fill="#fff" stroke="${G}"/><text x="${40 + i * 40}" y="10.5" font-size="6.5" text-anchor="middle" font-family="monospace" fill="${G}">${t}</text>`).join('')}
    <text x="126" y="88" font-size="6.5" font-family="monospace" fill="${B}">+3.00</text>`),

  gnss: wrap(`
    <path d="M10 86 Q 80 74 150 86" fill="none" stroke="${L}" stroke-width="1"/>
    <line x1="80" y1="86" x2="80" y2="46" stroke="${B}" stroke-width="2"/>
    <ellipse cx="80" cy="44" rx="9" ry="3.5" fill="${G}"/>
    <path d="M73 44 a7 6 0 0 1 14 0" fill="#fff" stroke="${G}"/>
    <circle cx="80" cy="44" r="10" fill="none" stroke="${C}" class="anim-pulse"/>
    ${[[24, 14], [78, 6], [136, 16]].map(([x, y]) => `<g class="anim-float"><rect x="${x - 4}" y="${y - 3}" width="8" height="6" fill="${G}"/><rect x="${x - 13}" y="${y - 1.5}" width="7" height="3" fill="${C}"/><rect x="${x + 6}" y="${y - 1.5}" width="7" height="3" fill="${C}"/></g><line x1="${x}" y1="${y + 4}" x2="80" y2="40" stroke="${C}" stroke-width="0.7" stroke-dasharray="2 2"/>`).join('')}`),

  siteplan: wrap(`${gridBg()}
    <path d="M18 80 L142 84 L148 16 L22 12 Z" fill="none" stroke="${G}" stroke-width="1.2"/>
    <rect x="54" y="32" width="44" height="32" fill="${G}" fill-opacity="0.12" stroke="${G}" stroke-width="1.2"/>
    <g stroke="${O}" stroke-width="0.8"><line x1="22" y1="48" x2="54" y2="48"/><line x1="98" y1="48" x2="146" y2="48"/><line x1="76" y1="13" x2="76" y2="32"/></g>
    <text x="30" y="45" font-size="6" font-family="monospace" fill="${B}">a</text><text x="118" y="45" font-size="6" font-family="monospace" fill="${B}">b</text>
    <path d="M140 74 l0 -10 l-3 4 m3 -4 l3 4" fill="none" stroke="${G}"/><text x="137.5" y="80" font-size="6" fill="${G}">K</text>`),

  permit: wrap(`
    <rect x="44" y="10" width="62" height="78" fill="#fff" stroke="${G}" stroke-width="1.2"/>
    <rect x="52" y="20" width="46" height="26" fill="none" stroke="${L}"/>
    <path d="M56 42 L66 30 L74 38 L82 26 L94 42" fill="none" stroke="${C}" stroke-width="1.2"/>
    ${[54, 62, 70].map((y) => `<line x1="52" y1="${y}" x2="98" y2="${y}" stroke="${L}" stroke-width="1.4"/>`).join('')}
    <circle cx="110" cy="74" r="13" fill="#fff" stroke="${G}" stroke-width="1.2"/>
    <path d="M104 74 l4 4 l8 -9" fill="none" stroke="${G}" stroke-width="1.8" class="anim-dash-hover"/>`),

  consult: wrap(`
    <circle cx="44" cy="40" r="12" fill="none" stroke="${G}" stroke-width="1.2"/>
    <circle cx="116" cy="40" r="12" fill="none" stroke="${G}" stroke-width="1.2"/>
    <path d="M26 80 q18 -22 36 0 M98 80 q18 -22 36 0" fill="none" stroke="${G}" stroke-width="1.2"/>
    <path d="M60 30 h40 a4 4 0 0 1 4 4 v12 a4 4 0 0 1 -4 4 h-18 l-6 6 v-6 h-16 a4 4 0 0 1 -4 -4 v-12 a4 4 0 0 1 4 -4 z" fill="${C}" fill-opacity="0.15" stroke="${C}"/>
    <g fill="${G}"><circle cx="70" cy="40" r="1.8"/><circle cx="80" cy="40" r="1.8"/><circle cx="90" cy="40" r="1.8"/></g>`),
};

/** Portföy önce/sonra görselleri (temsili) */
export const projectArt = {
  terrain: wrap(`
    <rect width="160" height="96" fill="#5d7438"/>
    <path d="M0 60 C 40 40, 70 70, 160 44 L160 96 L0 96 Z" fill="#4f6b35"/>
    <path d="M0 80 C 50 70, 90 90, 160 74 L160 96 L0 96 Z" fill="#8a6f52" opacity="0.7"/>
    <circle cx="30" cy="30" r="9" fill="#2f4a26"/><circle cx="46" cy="24" r="7" fill="#2f4a26"/><circle cx="120" cy="22" r="8" fill="#2f4a26"/>
    <path d="M70 0 L76 96" stroke="#b9a582" stroke-width="5" opacity="0.8"/>`),
  drawing: wrap(`
    <rect width="160" height="96" fill="#f7f8f5"/>${gridBg()}
    <path d="M34 70 L102 74 L118 30 L80 16 L30 26 Z" fill="none" stroke="${G}" stroke-width="1.4"/>
    <rect x="58" y="34" width="34" height="24" fill="none" stroke="${O}" stroke-width="1.2"/>
    <path d="M70 0 L76 96" stroke="${B}" stroke-width="0.8" stroke-dasharray="4 2"/>
    ${[[34, 70], [102, 74], [118, 30], [80, 16], [30, 26]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2" fill="${G}"/><text x="${x + 3}" y="${y - 3}" font-size="6" font-family="monospace" fill="${G}">K${i + 1}</text>`).join('')}`),
  contours: wrap(`
    <rect width="160" height="96" fill="#f7f8f5"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((k) => `<path d="M-5 ${88 - k * 12} C 40 ${74 - k * 11}, 80 ${96 - k * 14}, 165 ${66 - k * 9}" fill="none" stroke="${G}" stroke-width="${k % 5 === 0 ? 1.3 : 0.6}"/>`).join('')}
    <text x="6" y="90" font-size="6" font-family="monospace" fill="${B}">30</text><text x="6" y="30" font-size="6" font-family="monospace" fill="${B}">55</text>`),
};
