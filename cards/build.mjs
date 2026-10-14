// Builds every profile card into --out (default: dist/), dark and light.
//
//   node cards/build.mjs            live data; needs GITHUB_TOKEN (or per-account tokens)
//   node cards/build.mjs --sample   deterministic sample data, stamped SAMPLE DATA
//
// CI publishes dist/ to the `output` branch, which the README links to.
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { ACCOUNTS } from './config.mjs';
import { fetchAccount, mergeAccounts, sampleAccounts, summarize, yearWindow } from './lib/activity.mjs';
import { THEMES } from './lib/theme.mjs';
import { renderActivity } from './render/activity.mjs';
import { renderButtons } from './render/buttons.mjs';
import { renderHeader } from './render/header.mjs';
import { renderImpact } from './render/impact.mjs';
import { renderStack } from './render/stack.mjs';

const { values: args } = parseArgs({
  options: {
    out: { type: 'string', default: 'dist' },
    sample: { type: 'boolean', default: false },
  },
});

const window = yearWindow();

async function loadAccounts() {
  if (args.sample) return sampleAccounts(ACCOUNTS, window.dates);
  return Promise.all(
    ACCOUNTS.map((account) => {
      const token = process.env[account.tokenEnv] || process.env.GITHUB_TOKEN;
      if (!token) {
        throw new Error(`No token for ${account.login}: set ${account.tokenEnv} or GITHUB_TOKEN, or pass --sample`);
      }
      return fetchAccount({ ...account, token }, window);
    }),
  );
}

const merged = mergeAccounts(await loadAccounts(), window.dates);
const updated = window.dates.at(-1);

mkdirSync(args.out, { recursive: true });
const written = [];
const write = (name, svg) => {
  writeFileSync(join(args.out, name), svg);
  written.push(`${name} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)`);
};

for (const theme of Object.values(THEMES)) {
  write(`header-${theme.name}.svg`, renderHeader(theme));
  write(`impact-${theme.name}.svg`, renderImpact(theme));
  write(`stack-${theme.name}.svg`, renderStack(theme));
  write(`activity-${theme.name}.svg`, renderActivity(theme, merged, { updated, sample: args.sample }));
  for (const [id, svg] of Object.entries(renderButtons(theme))) write(`btn-${id}-${theme.name}.svg`, svg);
}

const stats = summarize(merged.days);
const snapshot = {
  generatedAt: new Date().toISOString(),
  sample: args.sample,
  window: { from: window.dates[0], to: updated },
  total: merged.total,
  accounts: merged.perAccount,
  visible: { commits: merged.commits, pullRequests: merged.pullRequests, reviews: merged.reviews },
  restricted: merged.restricted,
  streaks: { longest: stats.longest, current: stats.current },
  activeDays: stats.activeDays,
  busiest: stats.busiest,
};
writeFileSync(join(args.out, 'activity.json'), `${JSON.stringify(snapshot, null, 2)}\n`);

const report = [
  `### Profile cards${args.sample ? ' (sample data)' : ''}`,
  '',
  `- Window: ${snapshot.window.from} to ${snapshot.window.to}`,
  ...merged.perAccount.map((a) => `- ${a.label} (\`${a.login}\`): ${a.total.toLocaleString('en-US')} contributions`),
  `- Combined: ${merged.total.toLocaleString('en-US')} · private (counts only): ${merged.restricted.toLocaleString('en-US')}`,
  `- Streaks: longest ${stats.longest.length} days, current ${stats.current.length} days · active days ${stats.activeDays}`,
  `- Files: ${written.length}`,
  '',
].join('\n');
console.log(report);
console.log(written.map((w) => `  ${w}`).join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
