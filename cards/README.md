# Profile cards

The SVG cards on [github.com/evan-delasota](https://github.com/evan-delasota): header, link buttons, impact, stack, and combined engineering activity. Each renders in dark and light themes from the same Obsidian Signal tokens as [evandelasota.com](https://www.evandelasota.com).

## How it works

| Piece | Role |
| :-- | :-- |
| `config.mjs` | All copy and figures. The only file to edit for content changes. |
| `render/*.mjs` | One renderer per card. Layout only — no copy. |
| `lib/activity.mjs` | GraphQL fetch for each account, day-by-day merge, streak and level math. |
| `lib/svg.mjs` | Text measurement, embedded fonts, inlined icons, the shared card frame. |
| `build.mjs` | Writes every card to `dist/` plus an `activity.json` snapshot. |
| `.github/workflows/profile-cards.yml` | Tests and builds on every push; from `main`, force-pushes `dist/` to the `output` branch daily. |

Design decisions:

- **Zero dependencies.** Node 22 built-ins only, so there is nothing to install, audit, or patch.
- **Self-contained SVGs.** GitHub renders README images in a sandbox that cannot fetch fonts or images, so fonts (subset WOFF2) and icons are embedded in each file.
- **Generated files stay off `main`.** The README links to the `output` branch, which holds one commit and is replaced on each run.
- **Copy cannot overflow silently.** Text is measured against the embedded fonts at build time; anything too long for its box fails the build instead of the rendered card.
- **Sample data cannot ship.** `--sample` stamps the activity card SAMPLE DATA, and CI never passes it.

## Commands

```bash
npm test              # unit and smoke tests (node:test)
npm run preview       # build to dist/ with deterministic sample data
GITHUB_TOKEN=... npm run build   # build with live data
```

Open `dist/*.svg` in a browser to check a change before pushing.

## Activity data and tokens

The work account (`evan-delasota-ubi`) holds most activity in private repositories. With only the workflow's built-in `GITHUB_TOKEN`, the card can count that work **only if "Private contributions" is enabled** on the work profile (Settings → Public profile → Contributions & activity). GitHub then exposes anonymous daily counts; no repository or organization names are ever fetched or shown.

Optional repository secrets, used in place of `GITHUB_TOKEN` for one account:

| Secret | Adds | Scope |
| :-- | :-- | :-- |
| `WORK_STATS_TOKEN` | Commit / PR / review breakdown for private work | Classic PAT from the work account with `read:user` (SSO-authorized if the org requires it) |
| `PERSONAL_STATS_TOKEN` | Same, for private personal repositories | Classic PAT from the personal account with `read:user` |

Check company policy before storing a work-account token in a personal repository; the counts-only default needs no token at all.

## Assets and licenses

- `fonts/` — Plus Jakarta Sans and JetBrains Mono, both SIL Open Font License 1.1 (license texts alongside). Subset to Basic Latin plus a few punctuation marks with `pyftsubset`; `metrics.json` holds their advance widths for text measurement. Card copy avoids characters outside the subset (arrows, check marks); draw those as shapes.
- `icons/` — from [tandpfun/skill-icons](https://github.com/tandpfun/skill-icons), MIT (license alongside). Add an icon by copying its SVG here under the same file name.
