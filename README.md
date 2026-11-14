# SD-SCPF Public Site

Public Security Department website for SCPF — roster, discharges, subdivisions, department records, administrative logs, medals / Hall of Fame, and past Chiefs.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Postgres via Cursor `publish-app` (`cursor-app.json` + `migrations/`)
- Local development uses PGlite (`.data/pglite`) when `DATABASE_URL` is unset
- Spreadsheet importers seed from workbooks in `data/spreadsheets/`

## Scripts

```bash
npm install
env -u DATABASE_URL npm run import:force   # seed local PGlite
env -u DATABASE_URL npm run dev            # http://localhost:3000
```

Production / publish-app build runs `next build`, then `migrate`, then `import` (skips if already seeded unless `--force`).

## Motto

> We die in the dark so they may live in the light.
