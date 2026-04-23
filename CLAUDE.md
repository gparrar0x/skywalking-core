# @skywalking/core

> Shared TypeScript utilities consumed by Skywalking projects (micelio, natu, nexestate, acopia, etc.).
> **Impact radius: any change ripples to all consumers.** Version carefully.

## Modules

| Import path | Purpose |
| ----------- | ------- |
| `@skywalking/core/supabase/client` | Browser Supabase client (CSR) |
| `@skywalking/core/supabase/server` | Server Supabase client (SSR + cookies) |
| `@skywalking/core/supabase/admin` | Service-role admin client (bypasses RLS) |
| `@skywalking/core/auth/guards` | `requireAuth`, `verifyTenantOwnership`, etc. |
| `@skywalking/core/errors` | `AppError`, `NotFoundError`, `ValidationError` |
| `@skywalking/core/api-response` | `errorResponse`, `successResponse` |
| `@skywalking/core/encryption` | AES-256-GCM `encryptToken` / `decryptToken` |
| `@skywalking/core/logger` | `createLogger` (Pino, JSON/pretty) |
| `@skywalking/core/rate-limit` | `ratelimitStrict/Signup/Light` + helpers |
| `@skywalking/core/utils` | `cn()` (clsx + tailwind-merge) |

## Stack
- TypeScript (source-only, no build step — consumers compile via tsconfig paths).
- Peer deps: `@supabase/ssr` ≥0.7, `@supabase/supabase-js` ≥2.80, `next` ≥15.
- Runtime deps: `@upstash/ratelimit`, `@upstash/redis`, `clsx`, `pino`, `tailwind-merge`.
- Package manager: pnpm.

## Commands
```bash
pnpm typecheck           # tsc --noEmit
pnpm lint                # biome check src/
pnpm format              # biome format --write
```

## Distribution
Consumers install via GitHub:
```bash
pnpm add github:gparrar0x/skywalking-core
```
Or via workspace link: `"@skywalking/core": "workspace:*"`.

## Consumer Env Vars (inherited)
Depending on which module the project uses:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # admin client
ENCRYPTION_KEY=                  # 64 hex chars (openssl rand -hex 32)
UPSTASH_REDIS_REST_URL=          # rate-limit
UPSTASH_REDIS_REST_TOKEN=        # rate-limit
LOG_LEVEL=info                   # optional, default info
```

## Rules (changes in this repo)
- **Breaking changes = breaking for every consumer.** Never modify a public signature without:
  1. Auditing consumers (micelio, natu, nexestate, acopia, fuegoepuyen, etc.).
  2. Major bump + changelog entry.
  3. Coordinated migration path.
- Always preserve backward compat or keep a deprecation path of at least one version.
- Tests: run in consumers (this repo is source-only). When changing something critical, run tests of at least two consumers (micelio + natu).
- Do not include business logic — only reusable plumbing.

## GitHub
- Owner: `gparrar0x` (personal — legacy, consumers already reference that path).
- Push requires `gparrar0x` auth (known keychain issue, see memory `reference_hive_git_push`).

## Known consumers
micelio · natu · nexestate · acopia · fuegoepuyen (partial) · publica-related internals · others.
