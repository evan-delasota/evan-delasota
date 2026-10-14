import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchAccount,
  levelScale,
  mergeAccounts,
  normalizeAccount,
  summarize,
  yearWindow,
} from '../lib/activity.mjs';

const days = (counts, start = '2026-01-01') =>
  counts.map((count, i) => ({ date: new Date(Date.parse(`${start}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10), count }));

const account = (label, entries, extra = {}) => ({
  login: label.toLowerCase(),
  label,
  days: new Map(entries),
  commits: 0,
  pullRequests: 0,
  reviews: 0,
  issues: 0,
  restricted: 0,
  ...extra,
});

describe('yearWindow', () => {
  it('covers 365 days ending today and stays inside the one-year API limit', () => {
    const window = yearWindow(new Date('2026-10-14T19:30:00Z'));
    assert.equal(window.dates.length, 365);
    assert.equal(window.dates[0], '2025-10-15');
    assert.equal(window.dates.at(-1), '2026-10-14');
    assert.ok(Date.parse(window.to) - Date.parse(window.from) < 365 * 86_400_000);
  });
});

describe('mergeAccounts', () => {
  it('sums accounts per day and keeps per-account totals', () => {
    const work = account('Work', [['2026-01-01', 3], ['2026-01-02', 1]], { restricted: 4 });
    const personal = account('Personal', [['2026-01-02', 2], ['2025-12-31', 9]], { commits: 2 });
    const merged = mergeAccounts([work, personal], ['2026-01-01', '2026-01-02', '2026-01-03']);

    assert.deepEqual(merged.days.map((d) => d.count), [3, 3, 0]);
    assert.deepEqual(merged.perAccount.map((a) => a.total), [4, 2]);
    assert.equal(merged.total, 6, 'days outside the window are ignored');
    assert.equal(merged.restricted, 4);
    assert.equal(merged.commits, 2);
  });
});

describe('summarize', () => {
  it('finds the longest streak and its dates', () => {
    const stats = summarize(days([1, 0, 2, 3, 4, 0, 1]));
    assert.deepEqual(stats.longest, { length: 3, start: '2026-01-03', end: '2026-01-05' });
    assert.equal(stats.activeDays, 5);
    assert.deepEqual(stats.busiest, { date: '2026-01-05', count: 4 });
  });

  it('does not break the current streak on a quiet today', () => {
    const stats = summarize(days([0, 1, 1, 1, 0]));
    assert.deepEqual(stats.current, { length: 3, start: '2026-01-02' });
  });

  it('reports a broken streak as zero', () => {
    assert.equal(summarize(days([1, 1, 0, 0])).current.length, 0);
  });

  it('finds the busiest month and the weekly average', () => {
    const stats = summarize(days([1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 4, 4, 4], '2026-01-25'));
    assert.deepEqual(stats.busiestMonth, { month: '2026-02', count: 28 });
    assert.equal(stats.weeklyAverage, 17.5);
  });

  it('handles a year with no activity', () => {
    const stats = summarize(days([0, 0, 0]));
    assert.equal(stats.longest.length, 0);
    assert.equal(stats.current.length, 0);
    assert.equal(stats.busiest, null);
    assert.equal(stats.busiestMonth, null);
    assert.equal(stats.weeklyAverage, 0);
  });
});

describe('levelScale', () => {
  it('maps zero to level 0 and the busiest days to level 4', () => {
    const level = levelScale(days([0, 1, 2, 3, 4, 5, 6, 7, 8]));
    assert.equal(level(0), 0);
    assert.equal(level(1), 1);
    assert.equal(level(8), 4);
    assert.ok(level(4) >= 2 && level(4) <= 3);
  });

  it('is all zero when nothing happened', () => {
    assert.equal(levelScale(days([0, 0]))(5), 0);
  });
});

describe('fetchAccount', () => {
  const collection = {
    totalCommitContributions: 5,
    totalPullRequestContributions: 2,
    totalPullRequestReviewContributions: 3,
    totalIssueContributions: 0,
    restrictedContributionsCount: 40,
    contributionCalendar: {
      totalContributions: 50,
      weeks: [{ contributionDays: [{ date: '2026-01-01', contributionCount: 7 }] }],
    },
  };
  const window = { from: '2025-01-02T00:00:00Z', to: '2026-01-01T12:00:00Z' };
  const respond = (body, status = 200) => async () => ({ ok: status === 200, status, json: async () => body });

  it('normalizes a successful response and sends the token', async () => {
    let sent;
    const fake = async (url, init) => {
      sent = init;
      return respond({ data: { user: { contributionsCollection: collection } } })();
    };
    const result = await fetchAccount({ login: 'someone', label: 'Work', token: 't0k' }, window, fake);
    assert.equal(sent.headers.Authorization, 'bearer t0k');
    assert.equal(result.days.get('2026-01-01'), 7);
    assert.equal(result.restricted, 40);
    assert.equal(result.reviews, 3);
  });

  it('fails loudly on HTTP errors, GraphQL errors and unknown users', async () => {
    const who = { login: 'someone', label: 'Work', token: 't' };
    await assert.rejects(fetchAccount(who, window, respond({}, 502)), /HTTP 502/);
    await assert.rejects(fetchAccount(who, window, respond({ errors: [{ message: 'Bad credentials' }] })), /Bad credentials/);
    await assert.rejects(fetchAccount(who, window, respond({ data: { user: null } })), /was not found/);
  });

  it('matches normalizeAccount for the same payload', () => {
    const direct = normalizeAccount({ login: 'someone', label: 'Work' }, collection);
    assert.equal(direct.commits, 5);
    assert.equal(direct.pullRequests, 2);
  });
});
