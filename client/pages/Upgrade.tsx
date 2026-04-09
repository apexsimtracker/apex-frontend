import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import type { WithRootError } from "@/lib/formWithRootError";
import { cn } from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import {
  upgradeWaitlistSchema,
  type UpgradeWaitlistFormValues,
} from "@/lib/validation/upgradeWaitlist";

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

const waitlistDefaultValues: UpgradeWaitlistFormValues = {
  fullName: "",
  contactEmail: "",
  company: "",
  message: "",
};

export default function Upgrade() {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<WithRootError<UpgradeWaitlistFormValues>>({
    resolver: zodResolver(upgradeWaitlistSchema),
    defaultValues: waitlistDefaultValues,
  });

  const {
    data: upgradeInfo,
    isPending: loading,
    error: upgradeQueryError,
    isError: upgradeQueryFailed,
  } = useQuery({
    queryKey: ["upgrade", "info"],
    queryFn: async () => {
      try {
        return await getUpgradeInfo();
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          return {
            effectivePlan: "FREE",
            canUpgrade: true,
            message: "Sign in to upgrade to Apex Pro.",
          } satisfies UpgradeInfo;
        }
        throw err;
      }
    },
  });

  const error = upgradeQueryFailed
    ? upgradeQueryError instanceof Error
      ? upgradeQueryError.message
      : "Failed to load upgrade info"
    : null;

  const { data: waitlistStatus = null, isPending: waitlistLoading } = useQuery({
    queryKey: ["upgrade", "waitlist", user?.id ?? ""],
    queryFn: getProWaitlistStatus,
    enabled: Boolean(user) && Boolean(upgradeInfo?.canUpgrade),
  });

  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!waitlistStatus?.entry) return;
    form.reset({
      fullName: waitlistStatus.entry.fullName,
      contactEmail: waitlistStatus.entry.contactEmail,
      company: waitlistStatus.entry.company ?? "",
      message: waitlistStatus.entry.message ?? "",
    });
  }, [waitlistStatus?.entry, form]);

  useEffect(() => {
    if (!waitlistStatus || waitlistStatus.entry || !user?.email) return;
    const current = form.getValues("contactEmail");
    if (!current.trim()) {
      form.setValue("contactEmail", user.email);
    }
  }, [waitlistStatus, user?.email, form]);

  async function onSubmit(values: UpgradeWaitlistFormValues) {
    form.clearErrors("root");
    setSubmitSuccess(false);
    try {
      const res = await submitProWaitlist({
        fullName: values.fullName.trim(),
        contactEmail: values.contactEmail.trim(),
        ...(values.company.trim() && { company: values.company.trim() }),
        ...(values.message.trim() && { message: values.message.trim() }),
      });
      if (user?.id) {
        queryClient.setQueryData<ProWaitlistStatus>(["upgrade", "waitlist", user.id], {
          joined: true,
          entry: res.entry,
        });
      }
      setSubmitSuccess(true);
    } catch (err) {
      form.setError("root", {
        type: "server",
        message: err instanceof Error ? err.message : "Could not join the waitlist.",
      });
    }
  }

  const submitting = form.formState.isSubmitting;

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
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/70">Full name</FormLabel>
                            <FormControl>
                              <Input
                                autoComplete="name"
                                disabled={submitting}
                                className={cn(FIELD)}
                                placeholder="Your name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/70">Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                autoComplete="email"
                                disabled={submitting}
                                className={cn(FIELD)}
                                placeholder="you@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/70">
                              Team / sim <span className="text-white/40">(optional)</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                autoComplete="organization"
                                disabled={submitting}
                                className={cn(FIELD)}
                                placeholder="e.g. league or main sim"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/70">
                              Notes <span className="text-white/40">(optional)</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                disabled={submitting}
                                rows={3}
                                className={cn(FIELD, "min-h-[88px] resize-y")}
                                placeholder="Anything we should know?"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormRootMessage className="rounded-lg bg-red-500/10 px-3 py-2" />
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
                  </Form>
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
