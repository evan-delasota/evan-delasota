// Everything the cards say lives here; the renderers only lay it out.
// Figures mirror the case studies on https://www.evandelasota.com — keep the
// two in step, and never publish a number here that the site does not back.

export const PROFILE = {
  name: 'Evan Delasota',
  monogram: 'ED',
  domain: 'evandelasota.com',
  roleTag: 'Software Engineering Manager',
  // Cycled after "&" in the header, in the order the site's hero uses.
  roles: ['Full-Stack Architect', 'Cloud Engineer', 'DevOps Engineer', 'Father', 'Husband'],
  tagline: 'Event-driven .NET and Azure systems that fail safely.',
};

export const IMPACT = {
  caption: 'Production outcomes from systems I architected and led',
  metrics: [
    { value: '99.997', unit: '%', label: 'Ingestion success', detail: '~3.15M partner files a year', lead: true },
    { value: '12', unit: '', label: 'Domains rebuilt', detail: 'In-house, off a vendor platform' },
    { value: '37', unit: '', label: 'Components migrated', detail: 'Across Azure in ~6 weeks' },
    { value: '~$21', unit: '/mo', label: 'Monthly run cost', detail: 'For 7.8M requests a month' },
  ],
};

export const STACK = {
  caption: 'Daily drivers, and the platform and practices around them',
  // Icon names are file stems in cards/icons (theme suffix added as needed).
  primary: [
    ['CS', 'C#'],
    ['DotNet', '.NET'],
    ['React', 'React'],
    ['TypeScript', 'TypeScript'],
    ['Azure', 'Azure'],
    ['MySQL', 'MySQL'],
    ['Redis', 'Redis'],
    ['Docker', 'Docker'],
    ['GithubActions', 'Actions'],
    ['Workers', 'CF Workers'],
  ],
  groups: [
    {
      title: 'Azure platform',
      items: ['Container Apps', 'Service Bus', 'Functions', 'Key Vault', 'Entra ID', 'App Insights', 'Blob Storage'],
    },
    {
      title: 'Architecture',
      items: ['Event-driven', 'Dead-letter replay', 'Circuit breakers', 'Idempotency', 'Blue-green', 'Hub-and-spoke'],
    },
    {
      title: 'Quality & security',
      items: ['xUnit', 'Playwright', 'Vitest', 'EF Core', 'RBAC', 'Managed identity', 'Audit logging'],
    },
  ],
  earlier: {
    title: 'Also shipped with',
    icons: ['Java', 'Spring', 'Python', 'CPP', 'Angular', 'ExpressJS', 'MongoDB', 'Kubernetes', 'AWS', 'Linux'],
  },
};

// The work account comes first: it carries most of the activity, and the
// sample data generator treats index 0 as the weekday-heavy account.
// tokenEnv names an optional secret holding a token for that account; without
// one the run falls back to GITHUB_TOKEN and sees private work as counts only.
export const ACCOUNTS = [
  { login: 'evan-delasota-ubi', label: 'Work', tokenEnv: 'WORK_STATS_TOKEN' },
  { login: 'evan-delasota', label: 'Personal', tokenEnv: 'PERSONAL_STATS_TOKEN' },
];

export const LINKS = [
  { id: 'website', label: 'evandelasota.com', icon: 'globe', primary: true },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { id: 'resume', label: 'Resume (PDF)', icon: 'download' },
  { id: 'email', label: 'Email', icon: 'mail' },
  { id: 'work-github', label: 'Work GitHub', icon: 'github' },
];
