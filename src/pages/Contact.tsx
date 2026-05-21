import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { BRAND_RED, SUPPORT_EMAIL } from "@/lib/appConfig";
import { submitContact, ApiError } from "@/lib/api";
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
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/lib/validation/contact";

const PATH = "/contact";

const defaultValues: ContactFormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function Contact() {
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
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
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
      <PageMeta title={title} description={description} path={PATH} />
      <div className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <header className="mb-8 text-center sm:mb-10">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
                Support
              </p>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Contact us</h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Questions about your account, Apex Pro, or the product? Send a message and we’ll reply by
                email. We typically respond within a few business days.
              </p>
            </header>

            <div className="rounded-xl border border-white/10 bg-card/50 p-5 sm:p-6">
              {sentBanner && (
                <div
                  className="mb-6 flex flex-col gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                  role="status"
                >
                  <div className="flex gap-3">
                    <CheckCircle2
                      className="mt-0.5 size-5 shrink-0 text-emerald-400"
                      aria-hidden
                    />
                    <div className="text-sm text-foreground">
                      <p className="font-medium">We received your message</p>
                      <p className="mt-1 text-muted-foreground">
                        Support has been notified. Someone will follow up by email shortly.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 self-end text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:self-start"
                    onClick={() => setSentBanner(false)}
                  >
                    Dismiss
                  </button>
                </div>
              )}
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-white/10 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <p>
                  Prefer email directly?{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-medium underline underline-offset-2 hover:opacity-90"
                    style={{ color: BRAND_RED }}
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="name"
                            maxLength={120}
                            disabled={pending}
                            placeholder="Your name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
                            disabled={pending}
                            placeholder="you@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Subject <span className="font-normal text-muted-foreground">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            maxLength={200}
                            disabled={pending}
                            placeholder="Brief summary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            maxLength={5000}
                            rows={6}
                            disabled={pending}
                            placeholder="How can we help? (at least 20 characters)"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Minimum 20 characters.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="submit"
                      disabled={pending}
                      className="w-full min-w-40 text-white focus-visible:ring-ring sm:w-auto"
                      style={{ backgroundColor: BRAND_RED }}
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
                    <p className="text-center text-xs text-muted-foreground sm:text-right">
                      <Link to="/faq" className="underline underline-offset-2 hover:text-foreground">
                        FAQ
                      </Link>
                      <span className="mx-1.5 text-muted-foreground/50" aria-hidden>
                        ·
                      </span>
                      <Link to="/about" className="underline underline-offset-2 hover:text-foreground">
                        About us
                      </Link>
                    </p>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
