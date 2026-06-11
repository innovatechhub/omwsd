export function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const candidates = [
      record.message,
      record.error_description,
      record.details,
      record.hint,
      record.code,
      record.statusCode,
      record.status,
    ];

    const message = candidates.find(
      (value): value is string | number =>
        (typeof value === "string" && value.trim().length > 0) ||
        typeof value === "number",
    );

    if (message !== undefined) {
      return String(message);
    }
  }

  return fallback;
}
