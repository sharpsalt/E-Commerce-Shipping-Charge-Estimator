/**
 * Shared API response envelope types.
 * Every response uses a consistent shape for predictable client parsing.
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Helper to build a success envelope */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
): ApiSuccessResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

/** Helper to build an error envelope */
export function errorResponse(
  code: string,
  message: string,
  details?: unknown,
): ApiErrorResponse {
  return { success: false, error: { code, message, ...(details !== undefined ? { details } : {}) } };
}
