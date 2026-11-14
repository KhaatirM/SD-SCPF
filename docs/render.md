# Deploy SD-SCPF on Render (with PostgreSQL)

This app needs a **real Postgres database** on Render. Without `DATABASE_URL`, production used to fall back to in-process **PGlite**, which loads an entire Postgres engine into the web service RAM and exceeds the free tier **512MB** limit (“Ran out of memory”).

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

## Option A — Blueprint (recommended if starting fresh)

This repo includes [`render.yaml`](../render.yaml): a free web service + free Postgres with `DATABASE_URL` linked automatically.

1. Push this branch / merge the PR to GitHub.
2. In Render: **New** → **Blueprint**.
3. Connect the `KhaatirM/SD-SCPF` repo and apply the blueprint.
4. Wait for the first deploy. Build runs `npm run build`, which runs **migrate** then **import** then `next build` (import skips if already seeded).

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
2. Add:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Paste the Internal Database URL from step 2 |
| `NODE_ENV` | `production` (usually already set) |

3. **Save Changes**. Render will redeploy.

Tip: On the web service **Environment** page you can also use **Link Database** / “from database” so Render fills `DATABASE_URL` for you (same idea as `render.yaml`).

### 4. Build & start commands

Under **Settings** → **Build & Deploy**:

| Setting | Value |
|---------|--------|
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |

`npm run build` already runs:

1. `node scripts/migrate.mjs` — apply SQL in `migrations/`
2. `node scripts/import.mjs` — seed from `data/spreadsheets/` (no-op if already seeded)
3. `next build`

### 5. One-shot re-seed (optional)

If you need to force-reload spreadsheet data after deploy, open the web service **Shell** (or a one-off job) with `DATABASE_URL` set and run:

```bash
npm run import:force
```

## After deploy checklist

- [ ] Postgres service is **Available**
- [ ] Web service has `DATABASE_URL` set (Internal URL preferred)
- [ ] Latest deploy is **Live** (not OOM / crash loop)
- [ ] Site loads roster / records pages that hit the database
- [ ] Logs show `migrate: …` / `import: …` during build, not PGlite paths

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `DATABASE_URL is required in production` | Set `DATABASE_URL` on the web service and redeploy |
| `Ran out of memory (used over 512MB)` | Confirm `DATABASE_URL` is present at **runtime**; without it the old code used PGlite |
| SSL / connection errors to Postgres | Use Render’s Internal URL from the same region; this app enables TLS for non-localhost URLs |
| Import skipped | Normal after first seed; use `npm run import:force` to reimport |
| Free Postgres “suspended” | Free DBs sleep after idle; first request may be slow while it wakes |

## Local development (unchanged)

```bash
npm install
env -u DATABASE_URL npm run import:force   # seed local PGlite
env -u DATABASE_URL npm run dev
```
