import { z } from "zod";
import { emailSchema, passwordSchema } from "@/lib/validation/auth";

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const signupFormSchema = z.object({
  name: z.string().trim(),
  email: emailSchema,
  password: passwordSchema,
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;

export const verifyEmailCodeSchema = z.object({
  code: z.string().trim().min(1, "Enter the verification code."),
});

export type VerifyEmailCodeValues = z.infer<typeof verifyEmailCodeSchema>;

/** Forgot password — step 1 */
export const forgotEmailFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email.")
    .pipe(z.email("Please enter a valid email address.")),
});

export type ForgotEmailFormValues = z.infer<typeof forgotEmailFormSchema>;

/** Forgot password — step 2 */
export const forgotCodeFormSchema = z.object({
  code: z.string().trim().min(6, "Enter the 6‑digit code from your email."),
});

export type ForgotCodeFormValues = z.infer<typeof forgotCodeFormSchema>;

/** Forgot password — step 3 */
export const forgotResetFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ForgotResetFormValues = z.infer<typeof forgotResetFormSchema>;
