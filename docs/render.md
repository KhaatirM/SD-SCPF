# Deploy SD-SCPF on Render (with PostgreSQL)

This app needs a **real Postgres database** on Render. Without `DATABASE_URL`, production refuses to start (PGlite is local-only and OOMs on the free **512MB** web plan).

Even **with** `DATABASE_URL`, Next.js 16 on a 512MB dyno can still OOM if the build loads spreadsheet imports or the runtime loads unbounded page data. This guide covers both: wire Postgres, then apply the memory hardening.

## What is `DATABASE_URL`?

`DATABASE_URL` is an environment variable: a connection string that tells the app how to reach Postgres. It looks like:

```text
postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

- **Local/dev:** leave it unset → the app uses lightweight file-backed **PGlite** under `.data/pglite`.
- **Production (Render):** must be set → the app uses the `pg` client against Render Postgres. If it is missing, the app **fails fast** with a clear error instead of silently starting PGlite.

## Why PGlite OOMs on Render free tier

PGlite runs Postgres **inside the Node process**. The free web plan caps memory at ~512MB. Next.js + PGlite + spreadsheet data routinely goes over that. Render then kills the service (`Ran out of memory (used over 512MB)`).

Hosted Postgres runs in a **separate** service. The web app only keeps a small connection pool (~few MB), which fits on free tier.

## Confirm env first (if still crashing)

On the **SD-SCPF** web service → **Environment**, confirm (yes/no only — do not paste secrets):

| Key | Expected |
|-----|----------|
| `DATABASE_URL` | Present (Internal Database URL preferred) |
| `NODE_OPTIONS` | `--max-old-space-size=384` (after this PR / blueprint) |
| `NODE_ENV` | `production` |
| `PORT` | Set by Render (do not override unless you know why) |

After deploy, open `/api/health` — it returns `{ "ok": true, "databaseUrlSet": true/false }` (boolean only). Startup logs also print `DATABASE_URL=set|missing`.

## Option A — Blueprint (recommended if starting fresh)

This repo includes [`render.yaml`](../render.yaml): a free web service + free Postgres with `DATABASE_URL` linked automatically, plus `NODE_OPTIONS=--max-old-space-size=384`.

1. Push this branch / merge the PR to GitHub.
2. In Render: **New** → **Blueprint**.
3. Connect the `KhaatirM/SD-SCPF` repo and apply the blueprint.
4. Wait for the first deploy. Build runs **migrate** then `next build` only (no spreadsheet import).
5. After Live, open **Shell** and run `npm run import` once to seed data.

## Option B — Wire Postgres into an existing web service

### 1. Create PostgreSQL

1. Open [Render Dashboard](https://dashboard.render.com/).
2. **New** → **PostgreSQL**.
3. Name: e.g. `sd-scpf-db`. Region: same as the web service. Plan: **Free** (or paid if you need always-on).
4. Create the database. Wait until status is **Available**.

### 2. Copy the connection string

On the Postgres service page:

1. Open **Info** / **Connections**.
2. Copy **Internal Database URL** if the web service is on Render (preferred — private network, no egress).
3. Or copy **External Database URL** if you need to connect from your laptop.

That value is what becomes `DATABASE_URL`.

### 3. Set env on the web service (`SD-SCPF`)

1. Open the **SD-SCPF** web service → **Environment**.
2. Add / confirm:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Paste the Internal Database URL from step 2 |
| `NODE_ENV` | `production` (usually already set) |
| `NODE_OPTIONS` | `--max-old-space-size=384` |

3. **Save Changes**. Render will redeploy.

Tip: On the web service **Environment** page you can also use **Link Database** / “from database” so Render fills `DATABASE_URL` for you (same idea as `render.yaml`).

### 4. Build & start commands

Under **Settings** → **Build & Deploy**:

| Setting | Value |
|---------|--------|
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |

`npm run build` runs:

1. `node scripts/migrate.mjs` — apply SQL in `migrations/` (light)
2. `next build` — with `output: 'standalone'`

**Spreadsheet import is NOT part of build** (xlsx + multi-MB workbooks OOM the 512MB dyno). Seed separately.

### 5. One-shot seed / re-seed (required after first deploy)

With `DATABASE_URL` set, open the web service **Shell** and run:

```bash
npm run import          # no-op if already seeded
npm run import:force    # wipe + reload spreadsheets
```

Do this **after** the service is Live with Postgres — not during `npm run build`.

## Memory hardening (this PR)

| Change | Why |
|--------|-----|
| Build = migrate + `next build` only | Avoid loading ~4.6MB xlsx into RAM during deploy |
| `output: 'standalone'` | Smaller Node runtime footprint |
| `NODE_OPTIONS=--max-old-space-size=384` | Cap V8 heap under the 512MB instance limit |
| PGlite dynamic-import + `serverExternalPackages` | Production never loads embedded Postgres |
| List queries capped (default 200) | Avoid loading entire roster into memory per request |
| `/api/health` | Confirm `databaseUrlSet` without exposing secrets |

## After deploy checklist

- [ ] Postgres service is **Available**
- [ ] Web service has `DATABASE_URL` set (Internal URL preferred) — **yes/no only if reporting**
- [ ] `NODE_OPTIONS=--max-old-space-size=384` is set
- [ ] Latest deploy is **Live** (not OOM / crash loop)
- [ ] `/api/health` returns `"databaseUrlSet": true`
- [ ] Shell: `npm run import` completed once (if DB was empty)
- [ ] Site loads roster / records pages that hit the database

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `DATABASE_URL is required in production` | Set `DATABASE_URL` on the web service and redeploy |
| `Ran out of memory (used over 512MB)` with `DATABASE_URL` set | Confirm this PR is deployed; set `NODE_OPTIONS`; ensure build no longer runs `import`; check `/api/health` |
| “No open HTTP ports” interleaved with OOM | Classic mid-flight OOM kill — same memory fixes |
| SSL / connection errors to Postgres | Use Render’s Internal URL from the same region; this app enables TLS for non-localhost URLs |
| Empty roster after deploy | Run `npm run import` in Shell (import is off the build path) |
| Free Postgres “suspended” | Free DBs sleep after idle; first request may be slow while it wakes |

## Local development (unchanged)

```bash
npm install
env -u DATABASE_URL npm run import:force   # seed local PGlite
env -u DATABASE_URL npm run dev
```
