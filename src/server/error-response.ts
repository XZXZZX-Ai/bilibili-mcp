import { BilibiliAPIError } from "../utils/errors.js";
import { buildCredentialNextSteps } from "../utils/credential-guidance.js";

export function buildValidationErrorPayload(error: unknown): Record<string, unknown> {
  return {
    error: true,
    message: error instanceof Error ? error.message : "Invalid input",
    code: "VALIDATION_ERROR",
  };
}

export function buildGenericErrorPayload(error: unknown): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    error: true,
    message: error instanceof Error ? error.message : "Unknown error",
  };

  if (error instanceof BilibiliAPIError) {
    payload.code = error.code;
    if (error.code === "COOKIE_EXPIRED") {
      payload.next_steps = buildCredentialNextSteps();
    }
  }

  return payload;
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
