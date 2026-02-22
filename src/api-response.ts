/**
 * Uniform API response helpers.
 * Converts AppError hierarchy → structured JSON responses with correct HTTP status.
 */

import { AppError } from './errors.js'

export interface SuccessPayload<T> {
  data: T
}

export interface ErrorPayload {
  error: string
  code: string
}

/**
 * Wrap a successful value in a standard envelope.
 */
export function successResponse<T>(data: T, status = 200): Response {
  const body: SuccessPayload<T> = { data }
  return Response.json(body, { status })
}

/**
 * Convert any thrown value into a structured JSON error response.
 *
 * AppError subclasses → correct status + code.
 * Unknown errors     → 500 INTERNAL.
 */
export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    const body: ErrorPayload = { error: error.message, code: error.code }
    return Response.json(body, { status: error.statusCode })
  }

  const body: ErrorPayload = { error: 'Internal server error', code: 'INTERNAL' }
  return Response.json(body, { status: 500 })
}
