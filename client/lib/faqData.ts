/**
 * Static FAQ entries for the /faq page (search filters client-side).
 */

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

/** Section order on the FAQ page */
export const FAQ_CATEGORY_ORDER = [
  "General",
  "Sessions & Data",
  "Apex Pro",
  "Account",
] as const;

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-apex-sim-tracker",
    category: "General",
    question: "What is Apex Sim Tracker?",
    answer:
      "Apex Sim Tracker is a performance tracking platform built for sim racers. Log your sessions, analyse your stats, compete on leaderboards, and track your progress across multiple simulators — all in one place.",
  },
  {
    id: "which-simulators-supported",
    category: "General",
    question: "Which simulators are supported?",
    answer:
      "Apex currently supports iRacing and F1 25. More simulators are coming soon — stay tuned for updates.",
  },
  {
    id: "is-apex-free",
    category: "General",
    question: "Is Apex free to use?",
    answer:
      "Yes. Apex has a free tier with unlimited session logging and access to core features. Apex Pro (£4.99/month) unlocks additional features including telemetry, auto-uploads, the AI engineer, and access to challenges.",
  },
  {
    id: "how-log-session",
    category: "Sessions & Data",
    question: "How do I log a session?",
    answer:
      "You can log sessions manually by entering your data directly, or import session files from your simulator. Apex Pro users also get automatic session uploads, so your data syncs without any extra steps.",
  },
  {
    id: "session-history-limit",
    category: "Sessions & Data",
    question: "Is there a limit on how many sessions I can log?",
    answer:
      "No — there is no limit on session history for any user. Log as many sessions as you like on any plan.",
  },
  {
    id: "data-privacy",
    category: "Sessions & Data",
    question: "Is my data private?",
    answer:
      "Your personal session data and telemetry are private by default and only visible to you. You control what is shared publicly through your privacy settings.",
  },
  {
    id: "whats-in-apex-pro",
    category: "Apex Pro",
    question: "What's included in Apex Pro?",
    answer:
      "Apex Pro includes: full telemetry access (private to you), automatic session uploads, the AI engineer for personalised performance insights, and access to challenges and competitions. All for £4.99/month.",
  },
  {
    id: "what-is-ai-engineer",
    category: "Apex Pro",
    question: "What is the AI engineer?",
    answer:
      "The AI engineer analyses your session data and provides personalised coaching insights — highlighting where you're losing time, identifying patterns in your performance, and suggesting areas to focus on to improve your lap times.",
  },
  {
    id: "what-are-challenges",
    category: "Apex Pro",
    question: "What are challenges?",
    answer:
      "Challenges are time-based competitions where you go up against other Apex Pro users. Beat target lap times, climb the leaderboard, and prove your pace against the community.",
  },
  {
    id: "cancel-apex-pro",
    category: "Apex Pro",
    question: "Can I cancel Apex Pro at any time?",
    answer:
      "Yes. You can cancel your Apex Pro subscription at any time. You'll retain access until the end of your current billing period.",
  },
  {
    id: "change-password",
    category: "Account",
    question: "How do I change my password?",
    answer:
      "You can update your password at any time from the Settings page. Enter your current password and your new password to confirm the change.",
  },
  {
    id: "delete-account",
    category: "Account",
    question: "Can I delete my account?",
    answer:
      "Yes. You can delete your account from the Settings page. You'll be asked to confirm with your current password. In line with GDPR, your personal data will be permanently removed upon deletion.",
  },
];

export function groupFaqByCategory(items: FaqItem[]): { category: string; items: FaqItem[] }[] {
  const orderedCategories = new Set<string>(FAQ_CATEGORY_ORDER);
  const byCategory = new Map<string, FaqItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category);
    if (list) list.push(item);
    else byCategory.set(item.category, [item]);
  }
  const sections: { category: string; items: FaqItem[] }[] = [];
  for (const cat of FAQ_CATEGORY_ORDER) {
    const list = byCategory.get(cat);
    if (list?.length) sections.push({ category: cat, items: list });
  }
  for (const [cat, list] of byCategory) {
    if (!orderedCategories.has(cat) && list.length) {
      sections.push({ category: cat, items: list });
    }
  }
  return sections;
}

export function filterFaqItems(items: FaqItem[], query: string): FaqItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q),
  );
}
