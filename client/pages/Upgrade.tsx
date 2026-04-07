import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Check,
  Loader2,
  Zap,
  BarChart3,
  Trophy,
  Upload,
} from "lucide-react";
import {
  getUpgradeInfo,
  getProWaitlistStatus,
  submitProWaitlist,
  ApiError,
  type UpgradeInfo,
  type ProWaitlistStatus,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";

const UPGRADE_PATH = "/upgrade";
const upgradeTitle = `Apex Pro | ${COMPANY_NAME}`;
const upgradeDescription = `Upgrade to ${COMPANY_NAME} Pro: automatic telemetry, Apex Agent, analytics, and more at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

const PRO_FEATURES = [
  { icon: Upload, text: "Automatic telemetry uploads" },
  { icon: Zap, text: "Apex Agent access" },
  { icon: BarChart3, text: "Full analytics & comparisons" },
  { icon: Trophy, text: "Future Pro-only challenges" },
];

const FIELD =
  "border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-amber-500/40";

const NAME_MIN = 2;
const NAME_MAX = 120;
const COMPANY_MAX = 120;
const MESSAGE_MAX = 500;

function isValidEmail(s: string): boolean {
  const t = s.trim();
  if (t.length < 3 || t.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export default function Upgrade() {
  const { user, loading: authLoading } = useAuth();
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [waitlistStatus, setWaitlistStatus] = useState<ProWaitlistStatus | null>(null);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    contactEmail?: string;
    company?: string;
    message?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getUpgradeInfo()
      .then((data) => {
        setUpgradeInfo(data);
      })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setUpgradeInfo({
            effectivePlan: "FREE",
            canUpgrade: true,
            message: "Sign in to upgrade to Apex Pro.",
          });
        } else {
          setError(err instanceof Error ? err.message : "Failed to load upgrade info");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || !upgradeInfo?.canUpgrade) {
      setWaitlistStatus(null);
      return;
    }
    let cancelled = false;
    setWaitlistLoading(true);
    getProWaitlistStatus()
      .then((s) => {
        if (!cancelled) setWaitlistStatus(s);
      })
      .catch(() => {
        if (!cancelled) setWaitlistStatus(null);
      })
      .finally(() => {
        if (!cancelled) setWaitlistLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, upgradeInfo?.canUpgrade]);

  useEffect(() => {
    if (!waitlistStatus?.entry) return;
    setFullName(waitlistStatus.entry.fullName);
    setContactEmail(waitlistStatus.entry.contactEmail);
    setCompany(waitlistStatus.entry.company ?? "");
    setMessage(waitlistStatus.entry.message ?? "");
  }, [waitlistStatus?.entry]);

  useEffect(() => {
    if (!waitlistStatus || waitlistStatus.entry || !user?.email) return;
    setContactEmail((prev) => (prev.trim() ? prev : user.email));
  }, [waitlistStatus, user?.email]);

  const validate = useCallback(() => {
    const next: typeof fieldErrors = {};
    const name = fullName.trim();
    if (name.length < NAME_MIN) {
      next.fullName = `Name must be at least ${NAME_MIN} characters.`;
    } else if (name.length > NAME_MAX) {
      next.fullName = "Name is too long.";
    }
    const email = contactEmail.trim();
    if (!isValidEmail(email)) {
      next.contactEmail = "Please enter a valid email address.";
    }
    const co = company.trim();
    if (co.length > COMPANY_MAX) {
      next.company = `Company must be at most ${COMPANY_MAX} characters.`;
    }
    const msg = message.trim();
    if (msg.length > MESSAGE_MAX) {
      next.message = `Message must be at most ${MESSAGE_MAX} characters.`;
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }, [fullName, contactEmail, company, message]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await submitProWaitlist({
        fullName: fullName.trim(),
        contactEmail: contactEmail.trim(),
        ...(company.trim() && { company: company.trim() }),
        ...(message.trim() && { message: message.trim() }),
      });
      setWaitlistStatus({
        joined: true,
        entry: res.entry,
      });
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not join the waitlist.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta title={upgradeTitle} description={upgradeDescription} path={UPGRADE_PATH} />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
              <Sparkles className="h-7 w-7 text-amber-500" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Apex Pro</h1>
            <p className="mt-2 text-white/60">
              Unlock the full power of Apex with Pro features.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {PRO_FEATURES.map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-3 text-sm text-white/80"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  <feature.icon className="h-4 w-4 text-amber-500" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-500/10 p-4 text-center">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : upgradeInfo?.canUpgrade ? (
              <div className="space-y-6">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium text-amber-200/90">Billing coming soon</p>
                  <p className="mt-1 text-xs text-white/50">
                    Paid checkout is not available yet. Join the waitlist to be notified when
                    Apex Pro launches.
                  </p>
                </div>

                {authLoading || waitlistLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                  </div>
                ) : !user ? (
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-center">
                    <p className="text-sm text-white/70">
                      Sign in to join the Apex Pro waitlist and save your details.
                    </p>
                    <Button
                      asChild
                      className="mt-4 w-full bg-amber-500 text-black hover:bg-amber-400"
                    >
                      <Link to="/login">Sign in</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                    {waitlistStatus?.joined && (
                      <div
                        className="rounded-lg border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-300"
                        role="status"
                      >
                        You&apos;re on the waitlist
                        {waitlistStatus.entry?.createdAt
                          ? ` · joined ${new Date(
                              waitlistStatus.entry.createdAt
                            ).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}`
                          : ""}
                        . You can update your details below.
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="waitlist-name" className="text-white/70">
                        Full name
                      </Label>
                      <Input
                        id="waitlist-name"
                        name="fullName"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setFieldErrors((f) => ({ ...f, fullName: undefined }));
                        }}
                        disabled={submitting}
                        className={cn(FIELD)}
                        placeholder="Your name"
                      />
                      {fieldErrors.fullName && (
                        <p className="text-xs text-red-400">{fieldErrors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="waitlist-email" className="text-white/70">
                        Email
                      </Label>
                      <Input
                        id="waitlist-email"
                        name="contactEmail"
                        type="email"
                        autoComplete="email"
                        value={contactEmail}
                        onChange={(e) => {
                          setContactEmail(e.target.value);
                          setFieldErrors((f) => ({ ...f, contactEmail: undefined }));
                        }}
                        disabled={submitting}
                        className={cn(FIELD)}
                        placeholder="you@example.com"
                      />
                      {fieldErrors.contactEmail && (
                        <p className="text-xs text-red-400">{fieldErrors.contactEmail}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="waitlist-company" className="text-white/70">
                        Team / sim <span className="text-white/40">(optional)</span>
                      </Label>
                      <Input
                        id="waitlist-company"
                        name="company"
                        autoComplete="organization"
                        value={company}
                        onChange={(e) => {
                          setCompany(e.target.value);
                          setFieldErrors((f) => ({ ...f, company: undefined }));
                        }}
                        disabled={submitting}
                        className={cn(FIELD)}
                        placeholder="e.g. league or main sim"
                      />
                      {fieldErrors.company && (
                        <p className="text-xs text-red-400">{fieldErrors.company}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="waitlist-message" className="text-white/70">
                        Notes <span className="text-white/40">(optional)</span>
                      </Label>
                      <Textarea
                        id="waitlist-message"
                        name="message"
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          setFieldErrors((f) => ({ ...f, message: undefined }));
                        }}
                        disabled={submitting}
                        rows={3}
                        className={cn(FIELD, "min-h-[88px] resize-y")}
                        placeholder="Anything we should know?"
                      />
                      {fieldErrors.message && (
                        <p className="text-xs text-red-400">{fieldErrors.message}</p>
                      )}
                    </div>

                    {submitError && (
                      <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                        {submitError}
                      </div>
                    )}
                    {submitSuccess && (
                      <div className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
                        Saved. We&apos;ll email you when Pro billing goes live.
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : waitlistStatus?.joined ? (
                        "Update waitlist details"
                      ) : (
                        "Join the waitlist"
                      )}
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-4 w-4 text-black" />
                  </div>
                  <span className="text-sm font-medium text-green-400">
                    You're already on Apex Pro
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
