// Stack card: the daily-driver icons, three chip groups that mirror the site's
// skills section, and a quieter row for earlier languages and platforms.
import { STACK } from '../config.mjs';
import { doc, fit, icon, label, measure, r, text } from '../lib/svg.mjs';

const W = 1200;
const PAD = 36;
const ICON = 64;
const CHIP_H = 34;
const CHIP_FONT = 16;
const CHIP_PAD = 14;
const CHIP_GAP = 8;

/** Greedy wrap of chips into a column; returns markup and the height used. */
function chipColumn(items, x, y, width, theme) {
  const out = [];
  let cx = x;
  let cy = y;
  for (const item of items) {
    const w = measure(item, 'sans-600', CHIP_FONT) + CHIP_PAD * 2;
    if (w > width) throw new Error(`Chip "${item}" is wider than its column`);
    if (cx > x && cx + w > x + width) {
      cx = x;
      cy += CHIP_H + CHIP_GAP;
    }
    out.push(
      `<rect x="${r(cx)}" y="${r(cy)}" width="${r(w)}" height="${CHIP_H}" rx="9" fill="${theme.surfaceChip}" stroke="${theme.borderCard}"/>`,
      text(cx + CHIP_PAD, cy + 22.5, item, { face: 'sans-600', size: CHIP_FONT, fill: theme.inkSecondary }),
    );
    cx += w + CHIP_GAP;
  }
  return { markup: out.join(''), height: cy + CHIP_H - y };
}

export function renderStack(theme) {
  const body = [
    label(PAD, 56, 'Stack', theme),
    text(PAD + measure('STACK', 'mono-700', 16, 1.92) + 18, 56, STACK.caption, {
      face: 'sans-500',
      size: 19,
      fill: theme.inkMuted,
    }),
  ];

  // Primary icons, evenly distributed with a caption under each.
  const slot = (W - PAD * 2) / STACK.primary.length;
  STACK.primary.forEach(([name, caption], i) => {
    const cx = PAD + slot * i + slot / 2;
    const size = fit(caption, 'sans-600', 16, slot - 8);
    body.push(
      `<g class="pop" style="animation-delay:${r(i * 0.05)}s">`,
      icon(name, theme, cx - ICON / 2, 84, ICON),
      text(cx, 84 + ICON + 28, caption, { face: 'sans-600', size, fill: theme.inkSecondary, anchor: 'middle' }),
      '</g>',
    );
  });

  const dividerY = 206;
  body.push(`<path d="M${PAD} ${dividerY}H${W - PAD}" stroke="${theme.borderSubtle}"/>`);

  // Chip groups in three columns.
  const colGap = 28;
  const colW = (W - PAD * 2 - colGap * (STACK.groups.length - 1)) / STACK.groups.length;
  const groupTop = dividerY + 42;
  let tallest = 0;
  STACK.groups.forEach((group, i) => {
    const x = PAD + i * (colW + colGap);
    body.push(label(x, groupTop, group.title, theme, 14));
    const col = chipColumn(group.items, x, groupTop + 16, colW, theme);
    body.push(col.markup);
    tallest = Math.max(tallest, col.height);
  });

  // Earlier stack: smaller, dimmed icons on one line.
  const earlierY = groupTop + 16 + tallest + 36;
  const small = 40;
  const earlierLabelW = measure(STACK.earlier.title.toUpperCase(), 'mono-700', 14, 1.68);
  body.push(
    `<path d="M${PAD} ${earlierY - 18}H${W - PAD}" stroke="${theme.borderSubtle}"/>`,
    text(PAD, earlierY + 26, STACK.earlier.title.toUpperCase(), {
      face: 'mono-700',
      size: 14,
      fill: theme.inkDim,
      ls: 1.68,
    }),
    `<g opacity="0.8">`,
    ...STACK.earlier.icons.map((name, i) => icon(name, theme, PAD + earlierLabelW + 24 + i * (small + 12), earlierY, small)),
    '</g>',
  );
  const height = earlierY + small + 32;

  return doc({
    theme,
    width: W,
    height,
    title: 'Stack',
    desc:
      `Daily drivers: ${STACK.primary.map(([, c]) => c).join(', ')}. ` +
      STACK.groups.map((g) => `${g.title}: ${g.items.join(', ')}.`).join(' ') +
      ` ${STACK.earlier.title}: ${STACK.earlier.icons.join(', ')}.`,
    faces: ['sans-500', 'sans-600', 'mono-700'],
    css:
      '@keyframes pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
      '.pop{animation:pop .5s cubic-bezier(.2,.7,.2,1) both}',
    body: body.join(''),
  });
}
