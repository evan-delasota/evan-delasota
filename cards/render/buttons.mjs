// Link buttons for the row under the header. They are images, so the README
// wraps each in an <a>; the label is repeated in alt text for screen readers.
import { LINKS } from '../config.mjs';
import { measure, plain, r, text } from '../lib/svg.mjs';

// 24x24 glyphs, matching the inline icons on evandelasota.com.
const GLYPHS = {
  globe: (c) =>
    `<g fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></g>`,
  download: (c) =>
    `<g fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></g>`,
  mail: (c) =>
    `<g fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></g>`,
  linkedin: (c) =>
    `<path fill="${c}" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45c-.91 0-1.64.73-1.64 1.65 0 .91.73 1.64 1.64 1.64.91 0 1.65-.73 1.65-1.64 0-.92-.74-1.65-1.65-1.65z"/>`,
  github: (c) =>
    `<path fill="${c}" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>`,
};

const H = 44;

function button(link, theme) {
  const width = 46 + measure(link.label, 'sans-700', 16) + 18;
  const fill = link.primary ? theme.surfaceInverse : theme.surfacePanel;
  const ink = link.primary ? theme.inkOnInverse : theme.inkPrimary;
  const glyph = link.primary ? theme.inkOnInverse : theme.cyan;
  const body =
    `<rect x="0.5" y="0.5" width="${r(width - 1)}" height="${H - 1}" rx="10" fill="${fill}" stroke="${link.primary ? fill : theme.borderStrong}"/>` +
    `<g transform="translate(16 13) scale(0.75)">${GLYPHS[link.icon](glyph)}</g>` +
    text(44, 28, link.label, { face: 'sans-700', size: 16, fill: ink });
  return plain({ width, height: H, title: link.label, faces: ['sans-700'], body });
}

/** One SVG per link, keyed by link id. */
export function renderButtons(theme) {
  return Object.fromEntries(LINKS.map((link) => [link.id, button(link, theme)]));
}
