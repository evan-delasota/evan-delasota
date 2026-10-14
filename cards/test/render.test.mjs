// Smoke tests over every card: each renders in both themes, is well-formed
// enough to parse, and keeps the properties the README depends on.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ACCOUNTS, LINKS } from '../config.mjs';
import { mergeAccounts, sampleAccounts, yearWindow } from '../lib/activity.mjs';
import { fit, measure } from '../lib/svg.mjs';
import { THEMES } from '../lib/theme.mjs';
import { renderActivity } from '../render/activity.mjs';
import { renderButtons } from '../render/buttons.mjs';
import { renderHeader } from '../render/header.mjs';
import { renderImpact } from '../render/impact.mjs';
import { renderStack } from '../render/stack.mjs';

const window = yearWindow(new Date('2026-10-14T12:00:00Z'));
const merged = mergeAccounts(sampleAccounts(ACCOUNTS, window.dates), window.dates);

const cards = (theme) => ({
  header: renderHeader(theme),
  impact: renderImpact(theme),
  stack: renderStack(theme),
  activity: renderActivity(theme, merged, { updated: window.dates.at(-1) }),
  ...renderButtons(theme),
});

describe('cards', () => {
  for (const theme of Object.values(THEMES)) {
    for (const [name, svg] of Object.entries(cards(theme))) {
      it(`${name} (${theme.name}) is a self-contained, accessible SVG`, () => {
        assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
        assert.match(svg, /<title id="t">[^<]+<\/title>/);
        assert.doesNotMatch(svg, /(?:href|src)="https?:/, 'GitHub blocks external resources inside images');
        assert.doesNotMatch(svg, /undefined|NaN/);
        assert.ok(Buffer.byteLength(svg) < 200 * 1024, 'keep cards light for the profile page');
        const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
        assert.equal(new Set(ids).size, ids.length, 'ids must be unique once icons are inlined');
      });
    }
  }

  it('renders a button for every configured link', () => {
    assert.deepEqual(Object.keys(renderButtons(THEMES.dark)), LINKS.map((l) => l.id));
  });

  it('never stamps live data as a sample, and always stamps sample data', () => {
    const live = renderActivity(THEMES.dark, merged, { updated: '2026-10-14' });
    const sample = renderActivity(THEMES.dark, merged, { updated: '2026-10-14', sample: true });
    assert.doesNotMatch(live, /SAMPLE DATA/);
    assert.match(sample, /SAMPLE DATA/);
    assert.match(live, /Updated Oct 14, 2026/);
  });
});

describe('text fitting', () => {
  it('measures monospace text by character count', () => {
    assert.equal(measure('0000', 'mono-700', 10), 24);
  });

  it('shrinks within limits and refuses to overflow', () => {
    assert.equal(fit('short', 'sans-500', 20, 500), 20);
    assert.ok(fit('a little long', 'sans-500', 20, measure('a little long', 'sans-500', 20) * 0.9) < 20);
    assert.throws(() => fit('far far far too long for this box', 'sans-500', 20, 40), /only 40px available/);
  });
});
