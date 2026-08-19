import type { FieldValues } from "react-hook-form";

/** Virtual field for `setError("root", …)` / `formState.errors.root`. Omit `root` from `defaultValues`. */
export type WithRootError<T extends FieldValues> = T & {
  root?: string;
};

/** Read a react-hook-form error's message, ignoring empty and non-string values. */
export function fieldErrorMessage(error: unknown): string | null {
  const message = (error as { message?: unknown } | undefined)?.message;
  return typeof message === "string" && message ? message : null;
}

/**
 * Message for an error attached to a field array itself (rather than one of its
 * rows). Once any `name.N.*` field is registered, the zod resolver files
 * array-level issues under `name.root`; an imperative `setError(name)` still
 * lands on `name.message`, so both are checked.
 */
export function fieldArrayErrorMessage(arrayError: unknown): string | null {
  if (!arrayError || typeof arrayError !== "object") return null;
  return (
    fieldErrorMessage((arrayError as { root?: unknown }).root) ??
    fieldErrorMessage(arrayError)
  );
}
