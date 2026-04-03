/**
 * Supabase server client factories (SSR + cookies).
 *
 * createClient()                — Server Components (uses next/headers cookies()).
 * createClientFromRequest(req)  — Route Handlers (parses Cookie header directly).
 *
 * Both respect RLS policies based on the authenticated user session.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * @example Server Component
 * ```tsx
 * import { createClient } from '@skywalking/core/supabase/server'
 *
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('table').select('*')
 * }
 * ```
 *
 * @example Route Handler
 * ```ts
 * import { createClientFromRequest } from '@skywalking/core/supabase/server'
 *
 * export async function GET(request: Request) {
 *   const supabase = createClientFromRequest(request)
 *   const { data } = await supabase.from('table').select('*')
 * }
 * ```
 */

import { createServerClient } from '@supabase/ssr'

function parseCookieHeader(header: string): { name: string; value: string }[] {
  if (!header) return []
  return header.split(';').map((pair) => {
    const idx = pair.indexOf('=')
    if (idx === -1) return { name: pair.trim(), value: '' }
    return { name: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() }
  })
}

/**
 * Server Component client — uses next/headers cookies().
 * Do NOT use in Route Handlers on Vercel (may hang due to AsyncLocalStorage).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createClient<TDB = any>() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient<TDB>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a Server Component — ignored when middleware handles session refresh.
          }
        },
      },
    },
  )
}

/**
 * Route Handler client — parses cookies from the Request object directly.
 * Bypasses next/headers, safe for Vercel serverless functions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClientFromRequest<TDB = any>(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const parsed = parseCookieHeader(cookieHeader)

  return createServerClient<TDB>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return parsed
        },
        setAll() {
          // No-op in Route Handlers — session refresh handled by middleware.
        },
      },
    },
  )
}
