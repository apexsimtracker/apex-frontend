/**
 * Static FAQ entries for the /faq page (search filters client-side).
 */

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-apex",
    question: "What is Apex?",
    answer:
      "Apex is a sim racing companion that helps you track sessions, review laps, compare performance on leaderboards, and engage with the community. Upload telemetry or log activities manually to build a clear history of your driving.",
  },
  {
    id: "upload-sessions",
    question: "How do I upload a session?",
    answer:
      "Sign in and use Upload from the navigation to add session files. Supported formats depend on your game and agent setup. You can also log a manual activity if you do not have a file to upload.",
  },
  {
    id: "apex-agent",
    question: "What is the Apex Agent?",
    answer:
      "The Apex Agent is an optional tool (available on Apex Pro) that can send sessions from your PC to your account automatically. Visit the Agent page after upgrading to install and configure it.",
  },
  {
    id: "account-email",
    question: "How do I change my email or password?",
    answer:
      "Open Settings from your profile menu. You can update your password in the security section. Email changes may require verification—follow the prompts sent to your inbox.",
  },
  {
    id: "leaderboards-challenges",
    question: "How do leaderboards and challenges work?",
    answer:
      "Leaderboards rank drivers based on criteria set for each season or event. Challenges let you join time-bound goals and compare results with others. Eligibility and scoring are shown on each challenge page.",
  },
  {
    id: "privacy-data",
    question: "Where is my data stored?",
    answer:
      "Your account and session data are handled according to our Privacy Policy. We use industry-standard practices to protect your information. Review the policy for details on retention, cookies, and analytics.",
  },
  {
    id: "delete-account",
    question: "Can I delete my account?",
    answer:
      "Yes. In Settings you can request account deletion. Some data may be retained for a short period where required by law or for abuse prevention, as described in our Privacy Policy.",
  },
  {
    id: "support-contact",
    question: "How do I get help?",
    answer:
      "Use the contact email in the site footer for support. Check this FAQ first—many common questions about uploads, Pro, and account settings are covered here.",
  },
];

export function filterFaqItems(items: FaqItem[], query: string): FaqItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
  );
}
