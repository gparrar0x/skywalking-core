/**
 * Structured JSON logger factory backed by Pino.
 *
 * Production: JSON output (machine-readable).
 * Development: pino-pretty (human-readable) when NODE_ENV=development.
 *
 * Env: LOG_LEVEL (default: 'info'), NODE_ENV
 *
 * @example
 * ```ts
 * import { createLogger } from '@skywalking/core/logger'
 *
 * const log = createLogger('api:orders')
 * log.info({ orderId: '123' }, 'order created')
 * log.error({ err }, 'payment failed')
 * ```
 */

import pino from 'pino'

export type Logger = pino.Logger

export function createLogger(name: string): Logger {
  const isDev = process.env['NODE_ENV'] === 'development'

  return pino({
    name,
    level: process.env['LOG_LEVEL'] ?? 'info',
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' },
          },
        }
      : {}),
  })
}
