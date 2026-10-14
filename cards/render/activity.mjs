// Activity card: one contribution heatmap and summary tiles for the personal
// and work accounts combined. Work repositories are private, so the card only
// ever shows counts — never a repository or organisation name.
import { levelScale, summarize } from '../lib/activity.mjs';
import { doc, fit, label, measure, r, text } from '../lib/svg.mjs';

const W = 1200;
const PAD = 36;
const GRID_X = 80;
const GRID_Y = 116;
const CELL = 16;
const WEEKS = 53;
const PITCH = (W - PAD - GRID_X) / WEEKS;
const TILE_GAP = 16;
const TILE_H = 108;

const fmt = (date, opts = { month: 'short', day: 'numeric' }) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
const num = (n) => n.toLocaleString('en-US');

/** First candidate that fits the width at full size; throws if none does. */
function pick(candidates, face, size, width) {
  const found = candidates.find((c) => measure(c, face, size) <= width);
  if (!found) throw new Error(`No activity subtitle fits ${width}px: ${JSON.stringify(candidates)}`);
  return found;
}

function heatmap(days, theme) {
  const level = levelScale(days);
  const offset = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const cells = [];
  const months = [];
  let lastMonthCol = -10;
  days.forEach((day, i) => {
    const col = Math.floor((i + offset) / 7);
    const row = (i + offset) % 7;
    cells.push(
      `<rect class="h c${col}" x="${r(GRID_X + col * PITCH)}" y="${r(GRID_Y + row * PITCH)}" width="${CELL}" height="${CELL}" rx="3.5" fill="${theme.heat[level(day.count)]}"/>`,
    );
    // Label each month at the first column that starts inside it, if there is
    // room. The partial month at the left edge goes unlabelled, as on GitHub.
    if (day.date.endsWith('-01')) {
      const labelCol = row === 0 ? col : col + 1;
      if (labelCol - lastMonthCol >= 3 && labelCol < WEEKS - 1) {
        months.push(text(GRID_X + labelCol * PITCH, GRID_Y - 12, fmt(day.date, { month: 'short' }), {
          face: 'mono-500',
          size: 14,
          fill: theme.inkMuted,
        }));
        lastMonthCol = labelCol;
      }
    }
  });
  const weekdays = [
    [1, 'Mon'],
    [3, 'Wed'],
    [5, 'Fri'],
  ].map(([row, name]) =>
    text(PAD, GRID_Y + row * PITCH + 13, name, { face: 'mono-500', size: 14, fill: theme.inkMuted }),
  );

  // Legend, right-aligned under the grid.
  const legendY = GRID_Y + 7 * PITCH + 14;
  const swatch = 13;
  const legendX = W - PAD - measure('More', 'mono-500', 14) - 10 - 5 * (swatch + 4);
  const legend = [
    text(legendX - 10, legendY + 11, 'Less', { face: 'mono-500', size: 14, fill: theme.inkMuted, anchor: 'end' }),
    ...theme.heat.map(
      (fill, i) => `<rect x="${r(legendX + i * (swatch + 4))}" y="${r(legendY)}" width="${swatch}" height="${swatch}" rx="3" fill="${fill}"/>`,
    ),
    text(legendX + 5 * (swatch + 4) + 6, legendY + 11, 'More', { face: 'mono-500', size: 14, fill: theme.inkMuted }),
  ];

  const columnDelays = Array.from({ length: WEEKS }, (_, c) => `.c${c}{animation-delay:${r(c * 0.016)}s}`).join('');
  return {
    markup: months.join('') + weekdays.join('') + cells.join('') + legend.join(''),
    css:
      '@keyframes cell{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}' +
      '.h{transform-box:fill-box;transform-origin:center;animation:cell .45s cubic-bezier(.2,.7,.2,1) both}' +
      columnDelays,
    bottom: legendY + swatch,
  };
}

function tile(x, y, w, caption, theme, content) {
  return [
    `<rect x="${r(x)}" y="${y}" width="${r(w)}" height="${TILE_H}" rx="14" fill="${theme.surfaceCard}" stroke="${theme.borderCard}"/>`,
    text(x + 20, y + 32, caption.toUpperCase(), { face: 'mono-700', size: 14, fill: theme.inkMuted, ls: 1.4 }),
    content,
  ].join('');
}

export function renderActivity(theme, merged, { updated, sample = false }) {
  const stats = summarize(merged.days);
  const grid = heatmap(merged.days, theme);
  const tileY = grid.bottom + 30;
  const tileW = (W - PAD * 2 - TILE_GAP * 4) / 5;
  const inner = tileW - 40;
  const valueY = tileY + 74;
  const subY = tileY + 96;
  const value = (x, parts) => {
    const str = typeof parts === 'string' ? parts : parts.map(([part]) => part).join('');
    return text(x + 20, valueY, parts, { face: 'mono-800', size: fit(str, 'mono-800', 32, inner), fill: theme.inkPrimary });
  };
  const sub = (x, candidates) =>
    text(x + 20, subY, pick(candidates, 'sans-500', 15, inner), { face: 'sans-500', size: 15, fill: theme.inkMuted });

  const [work, personal] = merged.perAccount;
  const workShare = merged.total ? Math.round((work.total / merged.total) * 100) : 0;
  const xs = Array.from({ length: 5 }, (_, i) => PAD + i * (tileW + TILE_GAP));

  const totalSub =
    merged.restricted > 0
      ? merged.restricted === merged.total
        ? ['All in private repos', 'All private']
        : [`${num(merged.restricted)} in private repos`, `${num(merged.restricted)} private`]
      : [
          `${num(merged.commits)} commits · ${num(merged.pullRequests)} PRs · ${num(merged.reviews)} reviews`,
          `${num(merged.commits)} commits · ${num(merged.reviews)} reviews`,
          `${num(merged.commits)} commits`,
        ];
  const longest = stats.longest.length
    ? [`${fmt(stats.longest.start)} – ${fmt(stats.longest.end)}`]
    : ['No streak yet'];
  const weekly = stats.weeklyAverage;
  const weeklyValue = weekly >= 10 || weekly === 0 ? String(Math.round(weekly)) : weekly.toFixed(1);
  const month = stats.busiestMonth;
  const busiestMonth = month
    ? [`Busiest: ${fmt(`${month.month}-01`, { month: 'short', year: 'numeric' })}`, `Busiest: ${fmt(`${month.month}-01`, { month: 'short' })}`]
    : ['No activity yet'];
  const peak = stats.busiest ? [`Peak: ${stats.busiest.count} on ${fmt(stats.busiest.date)}`, `Peak: ${stats.busiest.count}`] : ['—'];
  const days = (n) => [[num(n), null], [n === 1 ? ' day' : ' days', theme.cyan]];

  const barW = inner;
  const workW = (barW * workShare) / 100;
  // Labelled counts when they fit; bare counts otherwise (the caption and
  // bar colours already say which is which).
  const splitLine = [true, false]
    .map((labelled) => [
      [`${labelled ? `${work.label} ` : ''}${num(work.total)}`, theme.cyan],
      ['  ·  ', theme.inkDim],
      [`${labelled ? `${personal.label} ` : ''}${num(personal.total)}`, theme.violet],
    ])
    .find((parts) => measure(parts.map(([str]) => str).join(''), 'sans-600', 15) <= inner);
  if (!splitLine) throw new Error('Work and personal totals do not fit their tile');

  const tiles = [
    tile(xs[0], tileY, tileW, 'Contributions', theme, value(xs[0], num(merged.total)) + sub(xs[0], totalSub)),
    tile(
      xs[1],
      tileY,
      tileW,
      'Work · Personal',
      theme,
      `<rect x="${r(xs[1] + 20)}" y="${tileY + 52}" width="${r(barW)}" height="12" rx="6" fill="${theme.violet}"/>` +
        (workW > 0 ? `<rect x="${r(xs[1] + 20)}" y="${tileY + 52}" width="${r(workW)}" height="12" rx="6" fill="${theme.cyan}"/>` : '') +
        text(xs[1] + 20, subY, splitLine, { face: 'sans-600', size: 15, fill: theme.inkMuted }),
    ),
    tile(xs[2], tileY, tileW, 'Longest streak', theme, value(xs[2], days(stats.longest.length)) + sub(xs[2], longest)),
    tile(xs[3], tileY, tileW, 'Weekly average', theme, value(xs[3], [[weeklyValue, null], ['/wk', theme.cyan]]) + sub(xs[3], busiestMonth)),
    tile(
      xs[4],
      tileY,
      tileW,
      'Active days',
      theme,
      value(xs[4], [[num(stats.activeDays), null], [`/${merged.days.length}`, theme.cyan]]) + sub(xs[4], peak),
    ),
  ];

  const header = [
    label(PAD, 56, 'Engineering activity', theme),
    text(PAD + measure('ENGINEERING ACTIVITY', 'mono-700', 16, 1.92) + 18, 56, 'Personal + work accounts, last 12 months', {
      face: 'sans-500',
      size: 19,
      fill: theme.inkMuted,
    }),
    sample
      ? text(W - PAD, 56, 'SAMPLE DATA', { face: 'mono-700', size: 15, fill: theme.danger, anchor: 'end', ls: 1.5 })
      : text(W - PAD, 56, `Updated ${fmt(updated, { month: 'short', day: 'numeric', year: 'numeric' })}`, {
          face: 'mono-500',
          size: 15,
          fill: theme.inkDim,
          anchor: 'end',
        }),
  ];

  const height = tileY + TILE_H + 32;
  return doc({
    theme,
    width: W,
    height,
    title: 'Engineering activity, last 12 months',
    desc:
      `${num(merged.total)} contributions across ${merged.perAccount.map((a) => `${a.label.toLowerCase()} (${num(a.total)})`).join(' and ')} accounts. ` +
      `Longest streak ${stats.longest.length} days, about ${weeklyValue} a week, ` +
      `active on ${stats.activeDays} of ${merged.days.length} days.`,
    faces: ['sans-500', 'sans-600', 'mono-500', 'mono-700', 'mono-800'],
    css: grid.css,
    body: header.join('') + grid.markup + tiles.join(''),
  });
}
