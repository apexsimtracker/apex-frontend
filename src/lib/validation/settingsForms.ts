import { z } from "zod";
import { displayNameSchema, newPasswordSchema, PASSWORD_MIN, PASSWORD_MAX } from "@/lib/validation/auth";

export const settingsDisplayNameSchema = z.object({
  displayName: displayNameSchema,
});

export type SettingsDisplayNameValues = z.infer<typeof settingsDisplayNameSchema>;

export const settingsChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: newPasswordSchema,
  })
  .refine((data) => data.currentPassword.trim() !== data.newPassword.trim(), {
    message: "New password must be different from your current password.",
    path: ["newPassword"],
  });

export type SettingsChangePasswordValues = z.infer<typeof settingsChangePasswordSchema>;

export { PASSWORD_MIN, PASSWORD_MAX };

export function deleteAccountSchema(confirmPhrase: string) {
  return z.object({
    password: z.string().min(1, "Password is required."),
    confirmPhrase: z
      .string()
      .trim()
      .refine((s) => s === confirmPhrase, {
        message: `Type ${confirmPhrase} to confirm.`,
      }),
  });
}

export type DeleteAccountFormValues = z.infer<ReturnType<typeof deleteAccountSchema>>;
