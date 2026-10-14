// Contribution data for the activity card: fetch each account from the
// GitHub GraphQL API, merge them day by day, and derive the summary numbers.
// Everything except fetchAccount is pure, so it is unit tested directly.

const DAY_MS = 86_400_000;

const QUERY = `query ($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

export const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * The last 365 days ending today (UTC). The API rejects ranges longer than
 * a year, so the grid starts mid-week rather than on the Sunday before.
 */
export function yearWindow(now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = today - 364 * DAY_MS;
  return {
    from: new Date(start).toISOString(),
    to: now.toISOString(),
    dates: Array.from({ length: 365 }, (_, i) => isoDate(start + i * DAY_MS)),
  };
}

export async function fetchAccount({ login, label, token }, window, fetchImpl = fetch) {
  const response = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'evan-delasota-profile-cards',
    },
    body: JSON.stringify({ query: QUERY, variables: { login, from: window.from, to: window.to } }),
  });
  if (!response.ok) {
    throw new Error(`GraphQL request for ${login} failed: HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(`GraphQL errors for ${login}: ${payload.errors.map((e) => e.message).join('; ')}`);
  }
  const collection = payload.data?.user?.contributionsCollection;
  if (!collection) throw new Error(`GitHub user "${login}" was not found`);
  return normalizeAccount({ login, label }, collection);
}

export function normalizeAccount({ login, label }, collection) {
  const days = new Map();
  for (const week of collection.contributionCalendar.weeks) {
    for (const day of week.contributionDays) days.set(day.date, day.contributionCount);
  }
  return {
    login,
    label,
    days,
    commits: collection.totalCommitContributions,
    pullRequests: collection.totalPullRequestContributions,
    reviews: collection.totalPullRequestReviewContributions,
    issues: collection.totalIssueContributions,
    // Contributions the token cannot see the detail of: private repositories
    // on an account that shows private contributions on its profile.
    restricted: collection.restrictedContributionsCount,
  };
}

/** Sums every account onto one continuous run of dates. */
export function mergeAccounts(accounts, dates) {
  const days = dates.map((date) => {
    const byAccount = accounts.map((account) => account.days.get(date) ?? 0);
    return { date, count: byAccount.reduce((a, b) => a + b, 0), byAccount };
  });
  const perAccount = accounts.map((account, i) => ({
    login: account.login,
    label: account.label,
    total: days.reduce((sum, day) => sum + day.byAccount[i], 0),
  }));
  const sum = (key) => accounts.reduce((total, account) => total + account[key], 0);
  return {
    days,
    perAccount,
    total: perAccount.reduce((a, b) => a + b.total, 0),
    commits: sum('commits'),
    pullRequests: sum('pullRequests'),
    reviews: sum('reviews'),
    restricted: sum('restricted'),
  };
}

/**
 * Streaks, active days, the busiest day and month, and the weekly average.
 * A zero for today does not break the current streak; today is not over yet.
 */
export function summarize(days) {
  let longest = { length: 0, start: null, end: null };
  let run = 0;
  let runStart = null;
  for (const day of days) {
    if (day.count > 0) {
      if (run === 0) runStart = day.date;
      run += 1;
      if (run > longest.length) longest = { length: run, start: runStart, end: day.date };
    } else {
      run = 0;
    }
  }

  let end = days.length - 1;
  if (end >= 0 && days[end].count === 0) end -= 1;
  let currentLength = 0;
  while (end - currentLength >= 0 && days[end - currentLength].count > 0) currentLength += 1;
  const current = {
    length: currentLength,
    start: currentLength ? days[end - currentLength + 1].date : null,
  };

  const busiest = days.reduce((best, day) => (day.count > (best?.count ?? 0) ? day : best), null);

  const months = new Map();
  for (const day of days) {
    const month = day.date.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + day.count);
  }
  const [busiestMonth, busiestMonthCount] = [...months].reduce((best, entry) => (entry[1] > best[1] ? entry : best), [null, 0]);
  const total = days.reduce((sum, day) => sum + day.count, 0);

  return {
    longest,
    current,
    activeDays: days.filter((day) => day.count > 0).length,
    busiest: busiest ? { date: busiest.date, count: busiest.count } : null,
    busiestMonth: busiestMonth ? { month: busiestMonth, count: busiestMonthCount } : null,
    weeklyAverage: days.length ? total / (days.length / 7) : 0,
  };
}

/** Quartile thresholds over non-zero days, mapping a count to level 0-4. */
export function levelScale(days) {
  const counts = days.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  if (!counts.length) return () => 0;
  const at = (q) => counts[Math.min(counts.length - 1, Math.floor(q * counts.length))];
  const [q1, q2, q3] = [at(0.25), at(0.5), at(0.75)];
  return (count) => {
    if (count <= 0) return 0;
    if (count <= q1) return 1;
    if (count <= q2) return 2;
    if (count <= q3) return 3;
    return 4;
  };
}

/**
 * Deterministic stand-in data for local previews (--sample). The card is
 * stamped SAMPLE DATA, and CI never passes the flag, so it cannot publish.
 */
export function sampleAccounts(accounts, dates) {
  let seed = 20260101;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return accounts.map(({ login, label }, index) => {
    const work = index === 0;
    const days = new Map();
    for (const date of dates) {
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
      const weekend = weekday === 0 || weekday === 6;
      const odds = work ? (weekend ? 0.08 : 0.82) : weekend ? 0.35 : 0.12;
      days.set(date, random() < odds ? 1 + Math.floor(random() * (work ? 9 : 4)) : 0);
    }
    const total = [...days.values()].reduce((a, b) => a + b, 0);
    return {
      login,
      label,
      days,
      commits: work ? 0 : Math.round(total * 0.8),
      pullRequests: work ? 0 : Math.round(total * 0.1),
      reviews: 0,
      issues: 0,
      restricted: work ? total : 0,
    };
  });
}
