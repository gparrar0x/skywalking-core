# @skywalking/core

Shared TypeScript utilities for Skywalking projects.

## Modules

| Import | Description |
|---|---|
| `@skywalking/core/supabase/client` | Browser Supabase client (CSR) |
| `@skywalking/core/supabase/server` | Server Supabase client (SSR + cookies) |
| `@skywalking/core/supabase/admin` | Service-role admin client (bypasses RLS) |
| `@skywalking/core/auth/guards` | requireAuth, verifyTenantOwnership, etc. |
| `@skywalking/core/errors` | AppError, NotFoundError, ValidationError, … |
| `@skywalking/core/api-response` | errorResponse, successResponse |
| `@skywalking/core/encryption` | AES-256-GCM encryptToken / decryptToken |
| `@skywalking/core/logger` | createLogger (Pino, JSON/pretty) |
| `@skywalking/core/rate-limit` | ratelimitStrict/Signup/Light + helpers |
| `@skywalking/core/utils` | cn() (clsx + tailwind-merge) |

## Required env vars

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # admin client only
ENCRYPTION_KEY=                  # 64 hex chars (openssl rand -hex 32)
UPSTASH_REDIS_REST_URL=          # rate-limit module
UPSTASH_REDIS_REST_TOKEN=        # rate-limit module
LOG_LEVEL=info                   # optional, default: info
```

## Install (consuming project)

```bash
pnpm add github:gparrar0x/skywalking-core
```

Or via local workspace link:
```json
"@skywalking/core": "workspace:*"
```
