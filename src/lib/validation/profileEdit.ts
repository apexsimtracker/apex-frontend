import { z } from "zod";
import { displayNameSchema } from "@/lib/validation/auth";

export const profileEditFormSchema = z.object({
  displayName: displayNameSchema,
  tagline: z.string().max(160, "Bio must be 160 characters or less."),
});

export type ProfileEditFormValues = z.infer<typeof profileEditFormSchema>;
