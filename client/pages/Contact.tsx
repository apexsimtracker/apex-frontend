import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
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
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
  });

  const title = `Contact us | ${COMPANY_NAME}`;
  const description = `Reach ${COMPANY_NAME} support — questions, feedback, and account help at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

  const mutation = useMutation({
    mutationFn: submitContact,
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Thanks for getting in touch. We’ll get back to you as soon as we can.",
      });
      form.reset(defaultValues);
    },
    onError: (err: unknown) => {
      let description =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      if (err instanceof ApiError && err.status === 503) {
        description = `${description} You can also reach us at ${SUPPORT_EMAIL}.`;
      }
      toast({
        title: "Could not send message",
        description,
        variant: "destructive",
      });
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-3xl mx-auto">
            <header className="mb-8 text-center sm:mb-10">
              <p className="mb-3 text-sm font-semibold text-foreground uppercase tracking-wider">
                Support
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contact us</h1>
              <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground leading-relaxed">
                Questions about your account, Apex Pro, or the product? Send a message and we’ll reply by
                email. We typically respond within a few business days.
              </p>
            </header>

            <div className="rounded-xl border border-white/10 bg-card/50 p-5 sm:p-6">
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-white/10 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
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
                          Subject <span className="text-muted-foreground font-normal">(optional)</span>
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
                      className="w-full sm:w-auto min-w-[10rem] text-white focus-visible:ring-ring"
                      style={{ backgroundColor: BRAND_RED }}
                    >
                      {pending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
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
                      <span className="text-muted-foreground/50 mx-1.5" aria-hidden>
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
