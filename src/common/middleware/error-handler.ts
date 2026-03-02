/**
 * Global Fastify error handler.
 * Maps AppError subclasses → proper HTTP responses with the
 * consistent error envelope.  Unknown errors get a generic 500.
 */
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/index.js";
import { errorResponse } from "../types/index.js";

export function globalErrorHandler(
  error: FastifyError | AppError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  // ── Known operational errors ───────────────────────
  if (error instanceof AppError) {
    reply.status(error.statusCode).send(
      errorResponse(
        error.code,
        error.message,
        "details" in error ? (error as any).details : undefined,
      ),
    );
    return;
  }

  // ── Fastify validation errors (Zod / Ajv) ─────────
  if ("validation" in error && "statusCode" in error && error.statusCode === 400) {
    reply
      .status(400)
      .send(errorResponse("VALIDATION_ERROR", error.message));
    return;
  }

  // ── Rate limit exceeded ────────────────────────────
  if ("statusCode" in error && error.statusCode === 429) {
    reply
      .status(429)
      .send(errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests, please try again later"));
    return;
  }

  // ── Unknown / unexpected errors ────────────────────
  _request.log.error(error, "Unhandled error");
  reply
    .status(500)
    .send(errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred"));
}
