import type { UseFormReturn } from "react-hook-form";
import { Link } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import type { WithRootError } from "@/lib/formWithRootError";
import type { SignupFormValues } from "@/lib/validation/authPages";
import {
  appInputClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";

const formLabelClassName =
  "font-apex-body text-[10px] uppercase text-apex-on-surface-variant";

const sectionEyebrowClassName =
  "font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant";

const formCardClassName =
  "rounded-xl border border-apex-outline-variant/15 bg-gradient-to-b from-apex-surface-container to-apex-background p-6 sm:p-8";

type SignupFormCardProps = {
  form: UseFormReturn<WithRootError<SignupFormValues>>;
  onSubmit: (values: SignupFormValues) => void | Promise<void>;
  loading: boolean;
  authRedirectMessage?: string;
};

export default function SignupFormCard({
  form,
  onSubmit,
  loading,
  authRedirectMessage,
}: SignupFormCardProps) {
  return (
    <div className={formCardClassName}>
      <div className="mb-6 flex flex-col items-center text-center">
        <div
          className="mb-4 flex size-10 items-center justify-center rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container text-apex-primary lg:hidden"
          aria-hidden
        >
          <UserPlus className="size-5" />
        </div>
        <p className={cn(sectionEyebrowClassName, "lg:hidden")}>New driver</p>
        <h2 className="mt-2 font-apex-headline text-lg font-semibold text-apex-on-surface lg:mt-0">
          Create account
        </h2>
      </div>

      {authRedirectMessage && (
        <p
          className="mb-6 rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container-low px-4 py-3 font-apex-body text-sm text-apex-on-surface-variant"
          role="status"
        >
          {authRedirectMessage}
        </p>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          aria-busy={loading || undefined}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <label className={formLabelClassName}>
                  Name{" "}
                  <span className="normal-case text-apex-on-surface-variant/70">
                    (optional)
                  </span>
                </label>
                <FormControl>
                  <Input
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    disabled={loading}
                    className={appInputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-apex-error" />
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
                    placeholder="you@example.com"
                    disabled={loading}
                    className={appInputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-apex-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <label className={formLabelClassName}>Password</label>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    disabled={loading}
                    className={appInputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-apex-error" />
              </FormItem>
            )}
          />

          <FormRootMessage className="text-xs text-apex-error" />

          <Button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={cn("w-full", appPrimaryButtonClassName)}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Creating account…
              </>
            ) : (
              "Sign up"
            )}
          </Button>

          <p className="text-center font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
            By signing up, you agree to our{" "}
            <Link
              to="/terms-and-conditions"
              className="text-apex-primary transition-colors hover:text-apex-primary/80"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy-policy"
              className="text-apex-primary transition-colors hover:text-apex-primary/80"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </Form>
    </div>
  );
}
