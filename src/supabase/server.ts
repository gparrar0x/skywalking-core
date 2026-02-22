/**
 * Supabase server client factory (SSR + cookies).
 *
 * Use in Server Components and API Routes.
 * Respects RLS policies based on the authenticated user session.
 *
 * Requires: next/headers (Next.js 15+)
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
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createClient<TDB = any>() {
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
