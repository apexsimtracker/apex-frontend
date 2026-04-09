import type { FieldValues } from "react-hook-form";

/** Virtual field for `setError("root", …)` / `formState.errors.root`. Omit `root` from `defaultValues`. */
export type WithRootError<T extends FieldValues> = T & {
  root?: string;
};
