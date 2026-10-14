// Obsidian Signal design tokens, copied from evandelasota.com
// (assets/css/style.css in evan-delasota/evan-delasota.github.io) so the
// profile cards and the site read as one system. Change them there first.

export const THEMES = {
  dark: {
    name: 'dark',
    surfaceBase: '#07090e',
    surfaceRaised: '#0b0f19',
    surfacePanel: '#111827',
    surfaceCard: '#0f1522',
    surfaceChip: 'rgba(255, 255, 255, 0.04)',
    inkPrimary: '#f8fafc',
    inkSecondary: '#cbd5e1',
    inkMuted: '#94a3b8',
    inkDim: '#64748b',
    inkOnInverse: '#07090e',
    surfaceInverse: '#f8fafc',
    cyan: '#38bdf8',
    indigo: '#6366f1',
    violet: '#a855f7',
    success: '#10b981',
    danger: '#f87171',
    cyanFill: 'rgba(56, 189, 248, 0.1)',
    cyanBorder: 'rgba(56, 189, 248, 0.28)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderCard: 'rgba(255, 255, 255, 0.1)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    glowA: 'rgba(56, 189, 248, 0.20)',
    glowB: 'rgba(99, 102, 241, 0.18)',
    gridDot: 'rgba(148, 163, 184, 0.22)',
    // Contribution levels 0-4: empty cell, then the cyan ramp.
    heat: ['rgba(255, 255, 255, 0.05)', '#0c4a6e', '#0369a1', '#0ea5e9', '#7dd3fc'],
    iconVariant: 'Dark',
  },
  light: {
    name: 'light',
    surfaceBase: '#f7f8fa',
    surfaceRaised: '#ffffff',
    surfacePanel: '#eef1f6',
    surfaceCard: '#ffffff',
    surfaceChip: 'rgba(15, 23, 42, 0.05)',
    inkPrimary: '#0b0f19',
    inkSecondary: '#334155',
    inkMuted: '#4a5a70',
    inkDim: '#5b6b80',
    inkOnInverse: '#ffffff',
    surfaceInverse: '#0b0f19',
    cyan: '#0369a1',
    indigo: '#4f46e5',
    violet: '#7c3aed',
    success: '#047857',
    danger: '#b91c1c',
    cyanFill: 'rgba(3, 105, 161, 0.08)',
    cyanBorder: 'rgba(3, 105, 161, 0.3)',
    borderSubtle: 'rgba(15, 23, 42, 0.1)',
    borderCard: 'rgba(15, 23, 42, 0.12)',
    borderStrong: 'rgba(15, 23, 42, 0.18)',
    glowA: 'rgba(3, 105, 161, 0.10)',
    glowB: 'rgba(79, 70, 229, 0.08)',
    gridDot: 'rgba(71, 85, 105, 0.22)',
    heat: ['rgba(15, 23, 42, 0.06)', '#bae6fd', '#7dd3fc', '#0ea5e9', '#0369a1'],
    iconVariant: 'Light',
  },
};

export const FONT_SANS =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const FONT_MONO =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
