/**
 * Supabase browser client factory.
 *
 * Use in Client Components ('use client') only.
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from env.
 *
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@skywalking/core/supabase/client'
 *
 * const supabase = createClient()
 * const { data } = await supabase.from('table').select('*')
 * ```
 */

import { createBrowserClient } from '@supabase/ssr'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient<TDB = any>() {
  return createBrowserClient<TDB>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
  )
}
