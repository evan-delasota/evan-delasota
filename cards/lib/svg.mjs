// Shared SVG building blocks: escaping, text measurement, embedded fonts,
// vendored icons, and the framed card document every renderer returns.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FONT_MONO, FONT_SANS } from './theme.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const METRICS = JSON.parse(readFileSync(`${ROOT}fonts/metrics.json`, 'utf8'));

// Face id -> [CSS class, font file stem, family stack, weight].
const FACES = {
  'sans-500': ['s5', 'jakarta-500', FONT_SANS, 500],
  'sans-600': ['s6', 'jakarta-600', FONT_SANS, 600],
  'sans-700': ['s7', 'jakarta-700', FONT_SANS, 700],
  'sans-800': ['s8', 'jakarta-800', FONT_SANS, 800],
  'mono-500': ['m5', 'jetbrains-mono-500', FONT_MONO, 500],
  'mono-700': ['m7', 'jetbrains-mono-700', FONT_MONO, 700],
  'mono-800': ['m8', 'jetbrains-mono-800', FONT_MONO, 800],
};

export const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** Rounds to two decimals so generated markup stays small and diff-stable. */
export const r = (n) => Math.round(n * 100) / 100;

function faceOf(face) {
  const entry = FACES[face];
  if (!entry) throw new Error(`Unknown font face "${face}"`);
  return entry;
}

/**
 * Advance width of `text` in viewBox units. Kerning is ignored, which
 * overestimates slightly; that is the safe direction for fitting text.
 */
export function measure(text, face, size, letterSpacing = 0) {
  const { unitsPerEm, advances, fallback } = METRICS[faceOf(face)[1]];
  let units = 0;
  for (const ch of text) units += advances[ch] ?? fallback;
  return (units / unitsPerEm) * size + letterSpacing * Math.max(0, [...text].length - 1);
}

/**
 * Largest size <= `size` at which `text` fits `maxWidth`, never below
 * `minScale * size`. Throws instead of silently overflowing, so copy that is
 * too long for its box fails the build rather than the rendered card.
 */
export function fit(text, face, size, maxWidth, minScale = 0.8) {
  const width = measure(text, face, size);
  if (width <= maxWidth) return size;
  const scaled = Math.floor((size * maxWidth) / width * 10) / 10;
  if (scaled < size * minScale) {
    throw new Error(`"${text}" needs ${Math.ceil(width)}px at ${size}px; only ${maxWidth}px available`);
  }
  return scaled;
}

/**
 * <text> element. `parts` may be a string or an array of [string, fill]
 * pairs, rendered as tspans so one line can carry an accent colour.
 */
export function text(x, y, parts, { face, size, fill, anchor, ls, cls = '', attrs = '' }) {
  const [faceClass] = faceOf(face);
  const runs = typeof parts === 'string' ? [[parts, null]] : parts;
  const body = runs
    .map(([str, runFill]) => (runFill ? `<tspan fill="${runFill}">${esc(str)}</tspan>` : esc(str)))
    .join('');
  const a = [
    `x="${r(x)}"`,
    `y="${r(y)}"`,
    `class="${[faceClass, cls].filter(Boolean).join(' ')}"`,
    `font-size="${size}"`,
    fill && `fill="${fill}"`,
    anchor && anchor !== 'start' && `text-anchor="${anchor}"`,
    ls && `letter-spacing="${ls}"`,
    attrs,
  ].filter(Boolean);
  return `<text ${a.join(' ')}>${body}</text>`;
}

function fontCss(faces) {
  return [...new Set(faces)]
    .map((face) => {
      const [cls, stem, stack, weight] = faceOf(face);
      const family = stack.split(',')[0].replaceAll("'", '');
      const data = readFileSync(`${ROOT}fonts/${stem}.woff2`).toString('base64');
      return (
        `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;` +
        `src:url(data:font/woff2;base64,${data}) format('woff2')}` +
        `.${cls}{font-family:${stack};font-weight:${weight}}`
      );
    })
    .join('');
}

const iconCache = new Map();

/**
 * Inlines a vendored skill-icons SVG (256x256 source) at x, y, size.
 * Prefers the theme-specific variant and namespaces its ids so several
 * icons with identical gradient ids can share one document.
 */
export function icon(name, theme, x, y, size) {
  const candidates = [`${name}-${theme.iconVariant}`, name];
  let source;
  let file;
  for (const candidate of candidates) {
    try {
      source = iconCache.get(candidate) ?? readFileSync(`${ROOT}icons/${candidate}.svg`, 'utf8');
      file = candidate;
      iconCache.set(candidate, source);
      break;
    } catch {
      // try the next candidate
    }
  }
  if (!source) throw new Error(`Icon "${name}" is not vendored in cards/icons`);

  const prefix = `i-${file.toLowerCase()}-`;
  const inner = source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/id="([^"]+)"/g, `id="${prefix}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}$1"`);
  return `<svg x="${r(x)}" y="${r(y)}" width="${size}" height="${size}" viewBox="0 0 256 256">${inner}</svg>`;
}

/** Signal rail gradient (cyan -> indigo -> violet), as on the site. */
export function railGradient(id, theme, { x1 = '0', x2 = '1' } = {}) {
  return (
    `<linearGradient id="${id}" x1="${x1}" x2="${x2}" y1="0" y2="0">` +
    `<stop offset="0" stop-color="${theme.cyan}"/>` +
    `<stop offset="0.5" stop-color="${theme.indigo}"/>` +
    `<stop offset="1" stop-color="${theme.violet}"/>` +
    `</linearGradient>`
  );
}

/** Section label: mono uppercase caption in the accent colour. */
export function label(x, y, str, theme, size = 16) {
  return text(x, y, str.toUpperCase(), { face: 'mono-700', size, fill: theme.cyan, ls: r(size * 0.12) });
}

/** Bare document with embedded fonts and no card frame (link buttons). */
export function plain({ width, height, title, faces, body }) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${r(width)}" height="${height}" viewBox="0 0 ${r(width)} ${height}" role="img" aria-labelledby="t">` +
    `<title id="t">${esc(title)}</title><defs><style>${fontCss(faces)}</style></defs>${body}</svg>`
  );
}

/**
 * Wraps a card body in the shared frame: rounded ground, ambient glows,
 * the signal rail on the top edge and a hairline border. Every card is one
 * standalone SVG with its fonts embedded, because GitHub renders README
 * images in a sandbox that cannot fetch anything else.
 */
export function doc({ theme, width, height, title, desc, faces, body, css = '', defs = '', glow = true, rail = true }) {
  const radius = 20;
  const glows = glow
    ? `<circle cx="${width - 120}" cy="-40" r="${height * 0.9}" fill="url(#glow-a)"/>` +
      `<circle cx="80" cy="${height + 60}" r="${height * 0.9}" fill="url(#glow-b)"/>`
    : '';
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t d">`,
    `<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>`,
    '<defs>',
    `<style>${fontCss(faces)}${css}` +
      '@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>',
    `<clipPath id="frame"><rect width="${width}" height="${height}" rx="${radius}"/></clipPath>`,
    `<radialGradient id="glow-a"><stop offset="0" stop-color="${theme.glowA}"/><stop offset="1" stop-color="${theme.glowA}" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="glow-b"><stop offset="0" stop-color="${theme.glowB}"/><stop offset="1" stop-color="${theme.glowB}" stop-opacity="0"/></radialGradient>`,
    railGradient('rail', theme),
    defs,
    '</defs>',
    '<g clip-path="url(#frame)">',
    `<rect width="${width}" height="${height}" fill="${theme.surfaceBase}"/>`,
    glows,
    body,
    rail ? `<rect width="${width}" height="4" fill="url(#rail)"/>` : '',
    '</g>',
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius - 0.5}" fill="none" stroke="${theme.borderCard}"/>`,
    '</svg>',
  ].join('');
}
