import { z } from "zod";

const TITLE_MIN = 3;
const TITLE_MAX = 120;
const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 5000;

export const newDiscussionFormSchema = z.object({
  category: z.enum(["setup", "guides", "general"], {
    message: "Please select a category.",
  }),
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters.`)
    .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or less.`),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .min(DESCRIPTION_MIN, `Description must be at least ${DESCRIPTION_MIN} characters.`)
    .max(DESCRIPTION_MAX, `Description must be ${DESCRIPTION_MAX} characters or less.`),
});

export type NewDiscussionFormValues = z.infer<typeof newDiscussionFormSchema>;
