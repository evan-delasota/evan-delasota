// Impact card: the four headline outcomes from the site, as metric tiles.
import { IMPACT } from '../config.mjs';
import { doc, fit, label, measure, r, text } from '../lib/svg.mjs';

const W = 1200;
const H = 296;
const PAD = 36;
const GAP = 16;
const TILE_Y = 84;
const TILE_H = 176;

export function renderImpact(theme) {
  const n = IMPACT.metrics.length;
  const tileW = (W - PAD * 2 - GAP * (n - 1)) / n;
  const inner = tileW - 48;
  const body = [
    label(PAD, 56, 'Impact', theme),
    text(PAD + measure('IMPACT', 'mono-700', 16, 1.92) + 18, 56, IMPACT.caption, {
      face: 'sans-500',
      size: 19,
      fill: theme.inkMuted,
    }),
  ];

  IMPACT.metrics.forEach((m, i) => {
    const x = PAD + i * (tileW + GAP);
    const valueSize = fit(m.value + m.unit, 'mono-800', 48, inner);
    const labelSize = fit(m.label, 'sans-700', 21, inner);
    const detailSize = fit(m.detail, 'sans-500', 17, inner);
    body.push(
      `<g class="tile" style="animation-delay:${r(0.1 + i * 0.08)}s">`,
      `<rect x="${r(x)}" y="${TILE_Y}" width="${r(tileW)}" height="${TILE_H}" rx="16" ` +
        `fill="${m.lead ? 'url(#lead-fill)' : theme.surfaceCard}" stroke="${m.lead ? theme.cyanBorder : theme.borderCard}"/>`,
      m.lead ? `<rect x="${r(x + 24)}" y="${TILE_Y}" width="${r(tileW - 48)}" height="3" rx="1.5" fill="url(#rail)"/>` : '',
      text(x + 24, TILE_Y + 74, [[m.value, null], [m.unit, theme.cyan]], {
        face: 'mono-800',
        size: valueSize,
        fill: theme.inkPrimary,
      }),
      text(x + 24, TILE_Y + 118, m.label, { face: 'sans-700', size: labelSize, fill: theme.inkPrimary }),
      text(x + 24, TILE_Y + 146, m.detail, { face: 'sans-500', size: detailSize, fill: theme.inkMuted }),
      '</g>',
    );
  });

  return doc({
    theme,
    width: W,
    height: H,
    title: 'Impact',
    desc: IMPACT.metrics.map((m) => `${m.value}${m.unit} ${m.label.toLowerCase()} (${m.detail})`).join('; '),
    faces: ['sans-500', 'sans-700', 'mono-700', 'mono-800'],
    defs: `<linearGradient id="lead-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.cyan}" stop-opacity="0.12"/><stop offset="1" stop-color="${theme.indigo}" stop-opacity="0.06"/></linearGradient>`,
    css:
      '@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
      '.tile{animation:rise .6s cubic-bezier(.2,.7,.2,1) both}',
    body: body.join(''),
  });
}
