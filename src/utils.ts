/**
 * Tailwind class merger utility.
 *
 * Combines clsx (conditional classes) + tailwind-merge (conflict resolution).
 *
 * @example
 * ```ts
 * import { cn } from '@skywalking/core/utils'
 *
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'px-6')
 * // → 'py-2 bg-blue-500 px-6' (px-4 removed by tailwind-merge)
 * ```
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
