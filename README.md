# SD-SCPF Public Site

Public Security Department website for SCPF — roster, discharges, subdivisions, department records, administrative logs, medals / Hall of Fame, and past Chiefs.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Postgres via `DATABASE_URL` (`pg`) in production (Render, publish-app, etc.)
- Local development uses PGlite (`.data/pglite`) when `DATABASE_URL` is unset
- Production **requires** `DATABASE_URL` — it will not fall back to PGlite (that OOMs on Render’s 512MB free tier)
- Spreadsheet importers seed from workbooks in `data/spreadsheets/`

## Scripts

```bash
npm install
env -u DATABASE_URL npm run import:force   # seed local PGlite
env -u DATABASE_URL npm run dev            # http://localhost:3000
```

`npm run build` runs migrate → import → `next build`. With `DATABASE_URL` set (and `NODE_ENV=production` during npm’s build script), both scripts talk to real Postgres. Import skips if already seeded unless `--force`.

## Deploy on Render

See **[docs/render.md](docs/render.md)** for creating Render PostgreSQL, setting `DATABASE_URL`, and build/start commands. A Blueprint is in `render.yaml`.

## Motto

> We die in the dark so they may live in the light.
