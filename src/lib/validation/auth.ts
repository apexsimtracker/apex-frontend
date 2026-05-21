import { z } from "zod";

/** Align with Settings / server expectations */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;
export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 40;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .pipe(z.email("Please enter a valid email address."));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters.`);

/** New password in Settings / change-password flows (trimmed, length bounds) */
export const newPasswordSchema = z
  .string()
  .trim()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters.`);

export const displayNameSchema = z
  .string()
  .trim()
  .min(DISPLAY_NAME_MIN, `Display name must be between ${DISPLAY_NAME_MIN} and ${DISPLAY_NAME_MAX} characters.`)
  .max(DISPLAY_NAME_MAX, `Display name must be between ${DISPLAY_NAME_MIN} and ${DISPLAY_NAME_MAX} characters.`);

export const optionalNameSchema = z
  .string()
  .trim()
  .optional();
