import { z } from "zod";

export const WAITLIST_NAME_MIN = 2;
export const WAITLIST_NAME_MAX = 120;
export const WAITLIST_COMPANY_MAX = 120;
export const WAITLIST_MESSAGE_MAX = 500;

export const upgradeWaitlistSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(WAITLIST_NAME_MIN, `Name must be at least ${WAITLIST_NAME_MIN} characters.`)
    .max(WAITLIST_NAME_MAX, "Name is too long."),
  contactEmail: z
    .string()
    .trim()
    .min(1, "Please enter a valid email address.")
    .pipe(z.email("Please enter a valid email address.")),
  company: z.string().max(WAITLIST_COMPANY_MAX, `Company must be at most ${WAITLIST_COMPANY_MAX} characters.`),
  message: z
    .string()
    .max(WAITLIST_MESSAGE_MAX, `Message must be at most ${WAITLIST_MESSAGE_MAX} characters.`),
});

export type UpgradeWaitlistFormValues = z.infer<typeof upgradeWaitlistSchema>;
