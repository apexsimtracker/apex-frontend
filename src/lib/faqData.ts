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
      "Yes. The free tier includes session logging (last 3 months of history), community, leaderboards, and challenges. Apex Pro is £5.99/month or £49.99/year and adds unlimited history, sector analytics, personal bests, agent auto-upload, telemetry, and more.",
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
      "Free accounts can access sessions from the last 3 months. Apex Pro includes unlimited session history.",
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
      "Apex Pro includes unlimited session history, sector breakdown and ideal lap, personal bests tracking, challenge leaderboard priority, a Pro badge on your profile, agent auto-upload, and full telemetry. £5.99/month or £49.99/year.",
  },
  {
    id: "session-insights",
    category: "Apex Pro",
    question: "What is Apex Analysis?",
    answer:
      "Apex Analysis is rule-based coaching on session detail and your home feed (sector pace, consistency, fuel, tyres, stint pace, and weekly trends). Full insights are included with Apex Pro; free accounts see the card with an upgrade prompt.",
  },
  {
    id: "what-are-challenges",
    category: "Apex Pro",
    question: "What are challenges?",
    answer:
      "Challenges are open to all users — join and participate on any plan. Apex Pro members get priority ranking on challenge leaderboards when lap times are close.",
  },
  {
    id: "cancel-apex-pro",
    category: "Apex Pro",
    question: "Can I cancel Apex Pro at any time?",
    answer:
      "Yes. You can cancel your Apex Pro subscription at any time. You'll retain access until the end of your current billing period.",
  },
  {
    id: "beta-free-trial",
    category: "Apex Pro",
    question: "What is the Apex beta free trial?",
    answer:
      "Invited beta users receive a 1-month free trial of full Apex Pro access when they sign up. You can subscribe to a paid Pro plan anytime from Pricing; starting a paid subscription ends the free trial and continues Pro under your normal billing.",
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
      "Yes. You can delete your account from the Settings page. You'll be asked to confirm with your current password. This is a soft delete: we sign you out everywhere and anonymise your email, name, bio, avatar, and password so you cannot sign in again. Uploaded session telemetry, community posts, billing cache, and similar records may remain in anonymised or disassociated form. Contact us if you need to request fuller erasure.",
  },
];

export function groupFaqByCategory(
  items: FaqItem[],
): { category: string; items: FaqItem[] }[] {
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
