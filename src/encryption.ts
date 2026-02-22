/**
 * AES-256-GCM symmetric encryption for sensitive string tokens.
 *
 * Format stored: `<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 *
 * Env: ENCRYPTION_KEY — 64 hex chars (32 bytes).
 * Generate: `openssl rand -hex 32`
 *
 * @example
 * ```ts
 * import { encryptToken, decryptToken } from '@skywalking/core/encryption'
 *
 * const encrypted = encryptToken(accessToken)
 * const original  = decryptToken(encrypted)
 * ```
 */

import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env['ENCRYPTION_KEY']
  if (!hex) throw new Error('ENCRYPTION_KEY env var is not set')
  if (hex.length !== 64) throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
  return Buffer.from(hex, 'hex')
}

export function encryptToken(token: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decryptToken(encryptedToken: string): string {
  const key = getKey()
  const parts = encryptedToken.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format — expected iv:authTag:ciphertext')
  }

  const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string]

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
