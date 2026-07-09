import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, HelpCircle, Loader2, Mail } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { SUPPORT_EMAIL } from "@/lib/appConfig";
import { submitContact, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  v2InputClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/lib/validation/contact";

const CONTACT_V2_PATH = "/v2/contact";

const defaultValues: ContactFormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const infoCardClassName =
  "rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-5";

const formLabelClassName =
  "font-v2-body text-[10px] uppercase text-v2-on-surface-variant";

function IconChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex size-10 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary",
        className,
      )}
      aria-hidden
    >
      {children}
    </div>
  );
}

export default function ContactV2() {
  const [sentBanner, setSentBanner] = useState(false);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
  });

  const title = `Contact us | ${COMPANY_NAME}`;
  const description = `Reach ${COMPANY_NAME} support — questions, feedback, and account help.`;

  const mutation = useMutation({
    mutationFn: submitContact,
    onMutate: () => {
      setSentBanner(false);
    },
    onSuccess: () => {
      toast.success("Message sent", {
        description:
          "Your message is on its way. Our team will email you soon — usually within a few business days.",
      });
      setSentBanner(true);
      form.reset(defaultValues);
    },
    onError: (err: unknown) => {
      let description =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      if (err instanceof ApiError && err.status === 503) {
        description = `${description} You can also reach us at ${SUPPORT_EMAIL}.`;
      }
      toast.error("Could not send message", { description });
    },
  });

  function onSubmit(values: ContactFormValues) {
    mutation.mutate({
      name: values.name,
      email: values.email,
      subject: values.subject.trim() || undefined,
      message: values.message,
    });
  }

  const pending = mutation.isPending;

  return (
    <>
      <PageMeta
        title={title}
        description={description}
        path={CONTACT_V2_PATH}
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col space-y-8 px-6 py-8">
        <header>
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Contact us
          </h1>
          <p className="mt-1 max-w-2xl font-v2-body text-sm text-v2-on-surface-variant">
            Questions about your account, Apex Pro, or the product? Send a
            message and we&apos;ll reply by email. We typically respond within a
            few business days.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-5 lg:items-start">
          <aside className="space-y-4 lg:col-span-2">
            <div className={infoCardClassName}>
              <IconChip>
                <Mail className="size-5" />
              </IconChip>
              <h2 className="font-v2-headline text-sm font-semibold text-v2-on-surface">
                Email us
              </h2>
              <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
                Prefer email directly? Reach us at{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-v2-primary underline underline-offset-2 transition-colors hover:text-v2-primary/80"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </div>

            <div className={infoCardClassName}>
              <IconChip>
                <Clock className="size-5" />
              </IconChip>
              <h2 className="font-v2-headline text-sm font-semibold text-v2-on-surface">
                Typical response
              </h2>
              <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
                Within a few business days. We&apos;ll follow up by email once
                your message is reviewed.
              </p>
            </div>

            <div className={infoCardClassName}>
              <IconChip>
                <HelpCircle className="size-5" />
              </IconChip>
              <h2 className="font-v2-headline text-sm font-semibold text-v2-on-surface">
                Check the FAQ
              </h2>
              <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
                Plans, sessions, Apex Pro, and more — many common questions are
                already answered.
              </p>
              <p className="mt-3 font-v2-body text-sm text-v2-on-surface-variant">
                <Link
                  to="/faq"
                  className="text-v2-primary transition-colors hover:text-v2-primary/80"
                >
                  FAQ
                </Link>
                <span
                  className="mx-1.5 text-v2-on-surface-variant/50"
                  aria-hidden
                >
                  ·
                </span>
                <Link
                  to="/v2/about"
                  className="text-v2-primary transition-colors hover:text-v2-primary/80"
                >
                  About us
                </Link>
              </p>
            </div>
          </aside>

          <div className="rounded-v2-lg bg-v2-surface-container-low p-6 sm:p-7 lg:col-span-3">
            {sentBanner && (
              <div
                className="mb-6 flex flex-col gap-3 rounded-v2-lg border border-v2-success/30 bg-v2-success/10 p-5 sm:flex-row sm:items-start sm:justify-between"
                role="status"
              >
                <div className="flex gap-3">
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-v2-success"
                    aria-hidden
                  />
                  <div>
                    <p className="font-v2-headline font-medium text-v2-success">
                      We received your message
                    </p>
                    <p className="mt-1 font-v2-body text-sm text-v2-on-surface-variant">
                      Support has been notified. Someone will follow up by email
                      shortly.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 self-end font-v2-body text-xs font-medium text-v2-on-surface-variant underline-offset-4 transition-colors hover:text-v2-on-surface hover:underline sm:self-start"
                  onClick={() => setSentBanner(false)}
                >
                  Dismiss
                </button>
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <label className={formLabelClassName}>Name</label>
                      <FormControl>
                        <Input
                          autoComplete="name"
                          maxLength={120}
                          disabled={pending}
                          placeholder="Your name"
                          className={v2InputClassName}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-v2-error" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <label className={formLabelClassName}>Email</label>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          disabled={pending}
                          placeholder="you@example.com"
                          className={v2InputClassName}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-v2-error" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <label className={formLabelClassName}>
                        Subject{" "}
                        <span className="normal-case text-v2-on-surface-variant/70">
                          (optional)
                        </span>
                      </label>
                      <FormControl>
                        <Input
                          type="text"
                          maxLength={200}
                          disabled={pending}
                          placeholder="Brief summary"
                          className={v2InputClassName}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-v2-error" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <label className={formLabelClassName}>Message</label>
                      <FormControl>
                        <Textarea
                          maxLength={5000}
                          rows={6}
                          disabled={pending}
                          placeholder="How can we help? (at least 20 characters)"
                          className={cn(
                            v2InputClassName,
                            "min-h-[120px] resize-none",
                          )}
                          {...field}
                        />
                      </FormControl>
                      <p className="font-v2-body text-xs text-v2-on-surface-variant">
                        Minimum 20 characters.
                      </p>
                      <FormMessage className="text-xs text-v2-error" />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={pending}
                    className={cn(
                      "w-full min-w-40 sm:w-auto",
                      v2PrimaryButtonClassName,
                    )}
                  >
                    {pending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Sending…
                      </>
                    ) : (
                      "Send message"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
