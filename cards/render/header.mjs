// Hero banner: identity on the left, and on the right an animated sketch of
// the pattern behind the headline case study — partner files through a bus to
// processors, with one message failing to a dead-letter queue and replaying.
import { PROFILE } from '../config.mjs';
import { doc, measure, r, text } from '../lib/svg.mjs';

const W = 1200;
const H = 400;
const CYCLE_SLOT = 3.2; // seconds each role holds the line
const TYPE_IN = 0.9;
const HOLD_UNTIL = 2.6;
const DELETE_BY = 3.0;

const pct = (seconds, total) => `${r((seconds / total) * 100)}%`;

function roleAnimations(roles, widths) {
  const total = roles.length * CYCLE_SLOT;
  const hidden = 'clip-path:inset(0 100% 0 0)';
  const shown = 'clip-path:inset(0 0 0 0)';
  const css = [];
  const cursor = [];
  roles.forEach((role, i) => {
    const steps = `animation-timing-function:steps(${role.length},end)`;
    css.push(
      `@keyframes r${i}{0%{${hidden};${steps}}${pct(TYPE_IN, total)}{${shown}}` +
        `${pct(HOLD_UNTIL, total)}{${shown};${steps}}${pct(DELETE_BY, total)},100%{${hidden}}}` +
        `.r${i}{animation:r${i} ${total}s infinite ${r(i * CYCLE_SLOT)}s both}`,
    );
    const t0 = i * CYCLE_SLOT;
    cursor.push(
      `${pct(t0, total)}{transform:translateX(0);${steps}}`,
      `${pct(t0 + TYPE_IN, total)}{transform:translateX(${r(widths[i])}px)}`,
      `${pct(t0 + HOLD_UNTIL, total)}{transform:translateX(${r(widths[i])}px);${steps}}`,
      `${pct(t0 + DELETE_BY, total)}{transform:translateX(0)}`,
    );
  });
  css.push(
    `@keyframes cur{${cursor.join('')}100%{transform:translateX(0)}}.cur{animation:cur ${total}s infinite}`,
    '@keyframes blink{0%,45%{opacity:1}50%,95%{opacity:0}}.blink{animation:blink 1s infinite}',
    // Without motion, show the first role only and drop the cursor.
    '@media (prefers-reduced-motion:reduce){.role:not(.r0),.cur,.pulse,.fault{display:none}}',
  );
  return css.join('');
}

function identity(theme) {
  const p = PROFILE;
  const nameSize = 80;
  const nameLs = -2.8;
  const nameWidth = measure(p.name, 'sans-800', nameSize, nameLs);
  const tagSize = 21;
  const chipWidth = measure(p.roleTag, 'sans-700', tagSize) + 32;
  const ampX = 72 + chipWidth + 16;
  const roleX = ampX + measure('& ', 'sans-600', 24);
  const roleWidths = p.roles.map((role) => measure(role, 'sans-600', 24));

  const body = [
    // Monogram and domain, as on the site's social card.
    `<rect x="72" y="60" width="56" height="56" rx="14" fill="url(#mono-fill)" stroke="${theme.cyanBorder}"/>`,
    text(100, 96, p.monogram, { face: 'mono-800', size: 22, fill: theme.cyan, anchor: 'middle' }),
    text(146, 95, p.domain, { face: 'mono-500', size: 19, fill: theme.inkMuted }),
    text(72, 200, p.name, { face: 'sans-800', size: nameSize, fill: theme.inkPrimary, ls: nameLs }),
    `<rect class="grow" x="72" y="218" width="${r(nameWidth)}" height="5" rx="2.5" fill="url(#rail)"/>`,
    `<rect x="72" y="252" width="${r(chipWidth)}" height="40" rx="10" fill="${theme.cyanFill}" stroke="${theme.cyanBorder}"/>`,
    text(88, 279, p.roleTag, { face: 'sans-700', size: tagSize, fill: theme.cyan }),
    text(ampX, 280, '&', { face: 'sans-600', size: 24, fill: theme.inkSecondary }),
    ...p.roles.map((role, i) =>
      text(roleX, 280, role, { face: 'sans-600', size: 24, fill: theme.inkSecondary, cls: `role r${i}` }),
    ),
    `<g class="cur"><rect class="blink" x="${r(roleX + 3)}" y="257" width="3" height="30" rx="1.5" fill="${theme.cyan}"/></g>`,
    text(72, 345, p.tagline, { face: 'sans-500', size: 21, fill: theme.inkMuted }),
  ].join('');

  if (roleX + Math.max(...roleWidths) > 720) {
    throw new Error('Header role line overflows into the diagram; shorten roleTag or roles');
  }
  if (72 + nameWidth > 720) throw new Error('Header name overflows into the diagram');
  return { body, css: roleAnimations(p.roles, roleWidths) };
}

const LANES = [140, 210, 280];
const SRC_X = 800; // right edge of the partner nodes
const BUS_X = 915;
const BUS_W = 40;
const PROC_X = 1060;
const DLQ = { x: 968, y: 334, w: 86, h: 32 };
// The failed message rests inside the DLQ node, left of its label.
const FAULT_X = DLQ.x + 18;

function pipeline(theme) {
  const css = [];
  const g = [];

  // Fading dot grid behind the diagram.
  g.push(`<rect x="700" y="0" width="${W - 700}" height="${H}" fill="url(#dots)" mask="url(#dots-fade)"/>`);

  for (const label of [
    ['PARTNERS', 770],
    ['BUS', BUS_X + BUS_W / 2],
    ['PROCESSORS', PROC_X + 36],
  ]) {
    g.push(text(label[1], 92, label[0], { face: 'mono-700', size: 14, fill: theme.inkDim, anchor: 'middle', ls: 1.6 }));
  }

  // Connectors: dashed so the flow animation reads as movement.
  for (const y of LANES) {
    g.push(
      `<path class="flow" d="M${SRC_X} ${y}H${BUS_X}M${BUS_X + BUS_W} ${y}H${PROC_X}" stroke="${theme.borderStrong}" stroke-width="1.5" stroke-dasharray="4 6"/>`,
    );
  }
  g.push(
    `<path d="M${FAULT_X} ${LANES[2] + 6}V${DLQ.y}" stroke="${theme.danger}" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="3 5"/>`,
  );
  css.push('@keyframes flow{to{stroke-dashoffset:-20}}.flow{animation:flow 1.2s linear infinite}');

  // Message pulses. Normal traffic crosses each lane; drawn before the bus so
  // it passes behind it.
  const travel = PROC_X - SRC_X;
  const normal = [
    [0, 0],
    [0, 1.3],
    [1, 0.45],
    [1, 1.75],
    [2, 0.9],
  ];
  css.push(
    `@keyframes lane{0%{transform:translateX(0);opacity:0}6%{opacity:1}92%{opacity:1}100%{transform:translateX(${travel}px);opacity:0}}`,
    '.pulse{animation:lane 2.6s linear infinite both}',
  );
  normal.forEach(([lane, delay]) => {
    g.push(
      `<g transform="translate(${SRC_X} ${LANES[lane]})"><g class="pulse" style="animation-delay:${delay}s">` +
        `<circle r="10" fill="${theme.cyan}" opacity="0.18"/><circle r="4.5" fill="${theme.cyan}"/></g></g>`,
    );
  });

  // One message fails processing, waits in the dead-letter queue, and replays.
  const y3 = LANES[2];
  const toFault = FAULT_X - SRC_X;
  const drop = DLQ.y + DLQ.h / 2 - y3;
  css.push(
    '@keyframes fault{' +
      `0%{transform:translate(0,0);opacity:0}` +
      `4%{opacity:1}` +
      `22%{transform:translate(${toFault}px,0);fill:${theme.cyan}}` +
      `25%{transform:translate(${toFault}px,0);fill:${theme.danger}}` +
      `34%{transform:translate(${toFault}px,${drop}px);fill:${theme.danger}}` +
      `58%{transform:translate(${toFault}px,${drop}px);fill:${theme.danger}}` +
      `62%{transform:translate(${toFault}px,${drop}px);fill:${theme.cyan}}` +
      `72%{transform:translate(${toFault}px,0)}` +
      `84%{transform:translate(${travel}px,0);opacity:1}` +
      `88%,100%{transform:translate(${travel}px,0);opacity:0}}` +
      '.fault{animation:fault 7s linear infinite 3s both}' +
      `@keyframes dlq{0%,31%{stroke:${theme.borderStrong}}34%,58%{stroke:${theme.danger}}64%,100%{stroke:${theme.borderStrong}}}` +
      '.dlq{animation:dlq 7s linear infinite 3s both}',
  );

  // Nodes.
  for (const y of LANES) {
    g.push(
      `<rect x="740" y="${y - 18}" width="60" height="36" rx="9" fill="${theme.surfaceCard}" stroke="${theme.borderStrong}"/>`,
      `<path d="M754 ${y - 6}h22M754 ${y}h32M754 ${y + 6}h16" stroke="${theme.inkDim}" stroke-width="2.5" stroke-linecap="round"/>`,
      `<rect x="${PROC_X}" y="${y - 18}" width="72" height="36" rx="9" fill="${theme.surfaceCard}" stroke="${theme.borderStrong}"/>`,
      `<path d="M${PROC_X + 14} ${y - 4}h26M${PROC_X + 14} ${y + 4}h18" stroke="${theme.inkDim}" stroke-width="2.5" stroke-linecap="round"/>`,
      `<circle class="ok" cx="${PROC_X + 58}" cy="${y}" r="4.5" fill="${theme.success}"/>`,
    );
  }
  css.push('@keyframes ok{0%,100%{opacity:.45}50%{opacity:1}}.ok{animation:ok 2.6s ease-in-out infinite}');

  g.push(
    `<rect x="${BUS_X}" y="104" width="${BUS_W}" height="212" rx="12" fill="${theme.surfacePanel}" stroke="${theme.cyanBorder}"/>`,
  );
  for (let i = 0; i < 9; i += 1) {
    g.push(
      `<rect class="slot" style="animation-delay:${r(i * 0.18)}s" x="${BUS_X + 9}" y="${116 + i * 21}" width="${BUS_W - 18}" height="7" rx="3.5" fill="${theme.cyan}"/>`,
    );
  }
  css.push('@keyframes slot{0%,100%{opacity:.2}50%{opacity:.75}}.slot{animation:slot 1.8s ease-in-out infinite}');

  g.push(
    `<rect class="dlq" x="${DLQ.x}" y="${DLQ.y}" width="${DLQ.w}" height="${DLQ.h}" rx="8" fill="${theme.surfaceCard}" stroke="${theme.borderStrong}" stroke-width="1.5"/>`,
    text(DLQ.x + 34, DLQ.y + 21, 'DLQ', { face: 'mono-700', size: 14, fill: theme.danger, ls: 1 }),
    text(DLQ.x + DLQ.w + 12, DLQ.y + 21, 'replay', { face: 'mono-500', size: 14, fill: theme.inkDim }),
  );
  // Drawn last so the failed message sits on top of the DLQ node.
  g.push(
    `<g transform="translate(${SRC_X} ${y3})"><g class="fault" fill="${theme.cyan}">` +
      `<circle r="10" opacity="0.2"/><circle r="5"/></g></g>`,
  );

  return { body: g.join(''), css: css.join('') };
}

export function renderHeader(theme) {
  const id = identity(theme);
  const pipe = pipeline(theme);
  const defs =
    `<linearGradient id="mono-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.cyan}" stop-opacity="0.2"/><stop offset="1" stop-color="${theme.indigo}" stop-opacity="0.12"/></linearGradient>` +
    `<pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="${theme.gridDot}"/></pattern>` +
    '<radialGradient id="dots-fade-g" cx="0.55" cy="0.5" r="0.6"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    `<mask id="dots-fade"><rect x="700" width="${W - 700}" height="${H}" fill="url(#dots-fade-g)"/></mask>`;
  const css =
    id.css +
    pipe.css +
    '@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}' +
    '.grow{transform-box:fill-box;transform-origin:left;animation:grow .9s cubic-bezier(.2,.7,.2,1) .2s both}';

  return doc({
    theme,
    width: W,
    height: H,
    title: `${PROFILE.name} — ${PROFILE.roleTag} & ${PROFILE.roles[0]}`,
    desc: `${PROFILE.tagline} Animated sketch of an event-driven pipeline: partner files flow through a message bus to processors; a failed message moves to a dead-letter queue and is replayed.`,
    faces: ['sans-500', 'sans-600', 'sans-700', 'sans-800', 'mono-500', 'mono-700', 'mono-800'],
    defs,
    css,
    body: id.body + pipe.body,
  });
}
