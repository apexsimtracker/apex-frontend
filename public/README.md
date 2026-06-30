# Public assets

Files here are served at the site root (`/filename`).

| Asset         | Purpose                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------ |
| `logo.png`    | Favicon and OG image reference in `index.html`                                             |
| `robots.txt`  | Crawler rules                                                                              |
| `sitemap.xml` | Generated from `src/config/publicSeoRoutes.ts` via `pnpm seo:sitemap` (runs on `prebuild`) |
| `sims/*.svg`  | Sim logos (e.g. iRacing, F1) used by `SimLogo` / `lib/sim.ts`                              |

When adding assets, reference them as `/your-file.ext` in components or `index.html`.
