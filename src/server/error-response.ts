import { buildStructuredErrorPayload } from "../utils/error-guidance.js";
import { ValidationError } from "../utils/errors.js";

export function buildValidationErrorPayload(
  error: unknown,
): Record<string, unknown> {
  const validationError =
    error instanceof ValidationError
      ? error
      : new ValidationError(
          error instanceof Error ? error.message : "Invalid input",
        );

  return buildStructuredErrorPayload(
    validationError,
  ) as unknown as Record<string, unknown>;
}

export function buildGenericErrorPayload(
  error: unknown,
): Record<string, unknown> {
  return buildStructuredErrorPayload(error) as unknown as Record<string, unknown>;
}

export function toTextContent(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function toErrorTextContent(payload: unknown) {
  return {
    ...toTextContent(payload),
    isError: true,
  };
}
