# A Small Matter of Your Birthday

A private, single-recipient interactive birthday experience: a personalised
narrative flow that collects birthday and travel preferences, a parody "Lover
Agreement," a signature ceremony, and a sealed vacation invitation reveal.
Built from `docs/guideline.md`, the developer guideline that is this
project's single source of truth — when in doubt, that document wins.

Next.js App Router, strict TypeScript, Tailwind CSS v4, Motion for React,
Radix primitives, Neon Postgres via Drizzle ORM, AES-256-GCM at-rest
encryption for the one sealed response.

## Status

The full experience (arrival → theming → prologue → the birthday-wish trap →
preference capture → the sincere question → review → the Lover Agreement →
signature → encrypted sealing → the invitation reveal) is implemented and
has been verified end to end against a real Postgres database: unit tests,
component tests, and Playwright e2e journeys (including a forced network
failure and retry) all pass, and the app has been walked through manually in
a real browser at each stage.

What's intentionally **not** done, because only Isaac can supply it:

- The real `VACATION_DESTINATION`, `VACATION_START`, `VACATION_END` and
  `FINAL_PRIVATE_NOTE` — see [Required content](#required-content) below.
  `getEnv()` fails loudly and by design until these are set; nothing guessed
  or placeholder ever ships.
- A provisioned Neon database and Vercel project (section 29).
- Physical-device QA on a real Android phone and Isaac's real iPhone — the
  guideline is explicit that "emulation is necessary but not sufficient"
  (section 27.3); Playwright device emulation covers the rest.
- The full five-project Playwright device matrix (Chromium + WebKit across
  five profiles) has not been run in this sandbox — only Chromium is
  available here. The project config already defines all five; see
  [Testing](#testing).

## Getting started

```bash
pnpm install

# Generate a fresh RESPONSE_ENCRYPTION_KEY, HOST_SESSION_SECRET and a
# HOST_PASSWORD_HASH for the password you pass it (or a generated one if
# you don't pass one):
pnpm provision:host-secret "your-host-password"

# Copy .env.example to .env.local and fill in the values above plus a
# DATABASE_URL (a local Postgres is fine for development), PUBLIC_SITE_ORIGIN
# (http://localhost:3000 locally) and the four content variables — see
# .env.example for the exact shape each one needs.
cp .env.example .env.local

pnpm db:generate   # generates db/migrations/*.sql from db/schema.ts
pnpm db:migrate    # applies migrations to DATABASE_URL

pnpm provision:invite   # creates one invite row, prints the private /for/[token] URL

pnpm dev
```

Open the printed `/for/[token]` URL — never `/`, which has no public content
by design (section 21: "token secrecy remains the actual access control").

### A note on the Neon driver and local development

`db/client.ts` uses `@neondatabase/serverless`'s Pool driver, which speaks a
WebSocket proxy protocol that only genuine Neon endpoints understand — it
cannot reach a plain local Postgres directly. For local development against
a Postgres you run yourself (e.g. `docker run -p 5432:5432 postgres:16-alpine`),
either point `DATABASE_URL` at a real Neon branch (free tier is enough), or
temporarily swap the driver for `drizzle-orm/node-postgres` + `pg` the way
this was validated during development — never commit that swap.

### server-only and standalone scripts

Every server-side module (`lib/server/*`, `lib/config/env.ts`, `db/client.ts`)
is marked with the `server-only` package per the guideline. That package only
no-ops under Next's own `"react-server"` bundler condition; running a
standalone script through plain Node/tsx would otherwise throw immediately on
import. The provisioning scripts and `db:migrate` work around this with
`NODE_OPTIONS=--conditions=react-server` (already wired into their npm
scripts) — apply the same flag if you write a new one-off script that imports
these modules directly.

## Required content

Isaac must supply these before the link can ever be sent — see
`.env.example` for the exact format of each:

| Variable | Notes |
|---|---|
| `VACATION_DESTINATION` | Exact text shown in the reveal and the generated image. A literal `"A surprise"` (or similar) is fine if the destination itself is the surprise. |
| `VACATION_START` / `VACATION_END` | ISO 8601 with an explicit UTC offset. |
| `FINAL_PRIVATE_NOTE` | One reviewed sentence, 1–180 characters. Not generated at runtime. |
| `RECIPIENT_DEFAULT_NAME` | Optional; the runtime preferred-name answer is authoritative either way. |

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Standard Next.js commands. |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit`. |
| `pnpm test` / `pnpm test:watch` | Vitest unit + component tests. |
| `pnpm test:e2e` | Playwright — starts its own dev server unless `PLAYWRIGHT_BASE_URL` is set. |
| `pnpm db:generate` / `pnpm db:migrate` | Drizzle Kit migration generate / apply. |
| `pnpm provision:host-secret [password]` | Prints a fresh encryption key, session secret and host password hash. |
| `pnpm provision:invite` | Creates one invite row and prints its private URL. |

## Testing

- **Unit/component** (`tests/unit`, `tests/components`): reducer transition
  guards, Zod schema boundaries, the restricted agreement markdown parser,
  AES-GCM round-trip/tamper/AAD-mismatch failures, per-theme WCAG AA
  contrast, timezone-safe date formatting, and exact "preserve wording" copy
  snapshots.
- **E2E** (`tests/e2e`, Playwright): a full arrival-to-reveal journey
  (including the money-tile joke, a forced seal failure + Retry, and saving
  the generated image), a reduced-motion pass, and axe accessibility scans.
  `playwright.config.ts` defines all five required device projects (section
  27.3); only Chromium-based ones can run in this sandbox — install WebKit's
  system dependencies (`pnpm exec playwright install --with-deps`) wherever
  you run the full matrix.

## Deployment (section 29)

1. Create separate Preview and Production Vercel environments, each with its
   own Neon branch via the Vercel Marketplace integration (not legacy Vercel
   Postgres).
2. Set every variable in `.env.example` in Vercel project settings —
   Production and Preview separately. Generate the secrets with
   `pnpm provision:host-secret` locally; never commit them.
3. Run `pnpm db:migrate` against each environment's `DATABASE_URL` as a
   deploy step.
4. Attach a custom domain — never share a `*.vercel.app` preview URL as the
   real invitation link.
5. Run `pnpm provision:invite` against the production database to generate
   the one real recipient URL, and send it privately.

## Host view

`/host` is a read-only, password-protected view (scrypt-hashed password,
signed HttpOnly session cookie) showing every invite's status, decrypted
answers, reconstructed signature, and a link to its generated invitation
image. Log in by POSTing `{ "password": "..." }` to `/api/host/session`
(the login form does this for you).

## Project structure

```
app/                  Routes: /for/[token], /host, API routes, robots/manifest
components/           experience/ (shell, scene frame, all 14 scenes),
                       ambient/ (theme wash, artifacts, pointer motion),
                       controls/, agreement/, signature/, invitation/, icons/
content/               Approved copy, the canonical agreement, the joke copy map
lib/                   experience/ (reducer, guards, persistence), theme/,
                       motion/, validation/, server/ (crypto, invites,
                       host-auth), config/, reveal/, agreement/ (markdown parser)
db/                    Drizzle schema, migrations, client
scripts/               Admin provisioning (never web-exposed)
tests/                 unit/, components/, e2e/
docs/guideline.md      The developer guideline — the source of truth
```
