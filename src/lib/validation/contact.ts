import { z } from "zod";
import { emailSchema } from "@/lib/validation/auth";

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  email: emailSchema,
  subject: z.string().max(200, "Subject is too long."),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters.")
    .max(5000, "Message is too long."),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
