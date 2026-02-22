/**
 * Server-side authentication guards (Next.js 15 + Supabase SSR).
 *
 * All functions are server-only (Server Components, API Routes).
 * Performs auth check + tenant ownership verification with middleware header fast-path.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Performance:
 * - Reads x-tenant-id from middleware headers when available (avoids slug DB query)
 * - Multi-layer: middleware → server guard → RLS
 *
 * @example Server Component
 * ```tsx
 * import { verifyTenantOwnership } from '@skywalking/core/auth/guards'
 *
 * const { isOwner, user, tenant, error } = await verifyTenantOwnership('my-store')
 * if (!isOwner) return <Unauthorized />
 * ```
 *
 * @example API Route
 * ```tsx
 * import { requireTenantOwner } from '@skywalking/core/auth/guards'
 *
 * export async function POST(req: Request) {
 *   const { user, tenant } = await requireTenantOwner('my-store')
 *   // guaranteed owner
 * }
 * ```
 */

import type { User } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server.js'

// ============================================================================
// Types
// ============================================================================

export interface TenantRecord {
  id: number
  slug: string
  name: string
  owner_id: string
}

export interface TenantOwnershipResult {
  isOwner: boolean
  user: User | null
  tenant: TenantRecord | null
  error?: 'unauthenticated' | 'not_owner' | 'tenant_not_found' | 'server_error'
  message?: string
}

export interface RequireOwnerResult {
  user: User
  tenant: TenantRecord
}

// ============================================================================
// Core
// ============================================================================

/**
 * Verify if the current session user owns the given tenant.
 * Returns result object — does not throw or redirect.
 *
 * Fast-path: reads x-tenant-id header injected by middleware.
 */
export async function verifyTenantOwnership(tenantSlug: string): Promise<TenantOwnershipResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError ?? !user) {
      return { isOwner: false, user: null, tenant: null, error: 'unauthenticated', message: 'User is not authenticated' }
    }

    const headersList = await headers()
    const tenantIdFromHeader = headersList.get('x-tenant-id')

    let tenant: TenantRecord | null = null

    if (tenantIdFromHeader) {
      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('id, slug, name, owner_id')
        .eq('id', Number.parseInt(tenantIdFromHeader, 10))
        .single()

      if (fetchError ?? !data) {
        return { isOwner: false, user: user!, tenant: null, error: 'tenant_not_found', message: 'Tenant not found' }
      }
      tenant = data as TenantRecord
    } else {
      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('id, slug, name, owner_id')
        .eq('slug', tenantSlug)
        .single()

      if (fetchError ?? !data) {
        return { isOwner: false, user: user!, tenant: null, error: 'tenant_not_found', message: 'Tenant not found' }
      }
      tenant = data as TenantRecord
    }

    const isOwner = user!.id === tenant.owner_id

    if (!isOwner) {
      return { isOwner: false, user: user!, tenant, error: 'not_owner', message: 'User is not the tenant owner' }
    }

    return { isOwner: true, user: user!, tenant }
  } catch (err) {
    console.error('[auth/guards] verifyTenantOwnership error:', err)
    return { isOwner: false, user: null, tenant: null, error: 'server_error', message: 'Internal error during ownership verification' }
  }
}

/**
 * Requires tenant ownership — throws descriptive Error if not met.
 * Use in API routes or server actions.
 */
export async function requireTenantOwner(tenantSlug: string): Promise<RequireOwnerResult> {
  const result = await verifyTenantOwnership(tenantSlug)

  if (!result.isOwner || !result.user || !result.tenant) {
    const messages: Record<NonNullable<TenantOwnershipResult['error']>, string> = {
      unauthenticated: 'Authentication required. Please log in.',
      not_owner: 'Access denied. You are not the owner of this tenant.',
      tenant_not_found: 'Tenant not found.',
      server_error: 'Server error during authentication.',
    }
    throw new Error(result.error ? messages[result.error] : 'Unauthorized access')
  }

  return { user: result.user, tenant: result.tenant }
}

/**
 * Requires tenant ownership — redirects on failure.
 * Use in Server Components.
 */
export async function requireTenantOwnerOrRedirect(tenantSlug: string): Promise<RequireOwnerResult> {
  const result = await verifyTenantOwnership(tenantSlug)

  if (!result.isOwner || !result.user || !result.tenant) {
    if (result.error === 'unauthenticated') redirect(`/${tenantSlug}/login`)
    redirect(`/${tenantSlug}`)
  }

  // After redirect branches above TS still needs narrowing — re-assert
  const user = result.user as User
  const tenant = result.tenant as TenantRecord
  return { user, tenant }
}

// ============================================================================
// Generic auth helpers
// ============================================================================

/**
 * Returns current authenticated user or null.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

/**
 * Requires authentication — redirects to login on failure.
 *
 * @param loginPath - custom login path (default: '/login')
 */
export async function requireAuth(loginPath = '/login'): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect(loginPath)
  // redirect() never returns, but TS needs the assertion
  return user as User
}

/**
 * Requires authentication with redirect query param.
 */
export async function requireAuthWithRedirect(currentPath: string): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?redirect=${encodeURIComponent(currentPath)}`)
  return user as User
}

// ============================================================================
// Dev/monitoring helpers
// ============================================================================

/**
 * verifyTenantOwnership with wall-clock timing attached.
 */
export async function verifyTenantOwnershipWithMetrics(
  tenantSlug: string,
): Promise<TenantOwnershipResult & { duration_ms: number }> {
  const t0 = performance.now()
  const result = await verifyTenantOwnership(tenantSlug)
  const duration_ms = Math.round(performance.now() - t0)

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'ownership_check',
    service: 'auth_guard',
    tenant_slug: tenantSlug,
    is_owner: result.isOwner,
    duration_ms,
    error: result.error ?? null,
  }))

  return { ...result, duration_ms }
}
