/**
 * Supabase admin client (service role).
 *
 * Bypasses RLS — use ONLY in trusted server contexts.
 * Never expose to client-side code.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Safe uses:
 * - Webhook handlers
 * - Admin operations
 * - Cron jobs
 * - DB cleanup in tests
 *
 * @example
 * ```ts
 * import { createAdminClient } from '@skywalking/core/supabase/admin'
 *
 * const supabase = createAdminClient()
 * const { data } = await supabase.from('orders').select('*')
 * ```
 */

import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminClient<TDB = any>() {
  return createClient<TDB>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

/** Alias for createAdminClient */
export const createServiceRoleClient = createAdminClient
