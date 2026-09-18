import type { HiddenContentType } from "@/lib/api/ugcModeration";

export const HIDDEN_CONTENT_FILTERS: Array<{
  value: HiddenContentType | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All" },
  { value: "SESSION", label: "Sessions" },
  { value: "SESSION_COMMENT", label: "Session comments" },
  { value: "DISCUSSION", label: "Discussions" },
  { value: "DISCUSSION_COMMENT", label: "Discussion comments" },
];
