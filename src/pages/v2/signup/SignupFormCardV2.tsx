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
  v2InputClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";

const formLabelClassName =
  "font-v2-body text-[10px] uppercase text-v2-on-surface-variant";

const sectionEyebrowClassName =
  "font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant";

const formCardClassName =
  "rounded-xl border border-v2-outline-variant/15 bg-gradient-to-b from-v2-surface-container to-v2-background p-6 sm:p-8";

type SignupFormCardV2Props = {
  form: UseFormReturn<WithRootError<SignupFormValues>>;
  onSubmit: (values: SignupFormValues) => void | Promise<void>;
  loading: boolean;
  authRedirectMessage?: string;
};

export default function SignupFormCardV2({
  form,
  onSubmit,
  loading,
  authRedirectMessage,
}: SignupFormCardV2Props) {
  return (
    <div className={formCardClassName}>
      <div className="mb-6 flex flex-col items-center text-center">
        <div
          className="mb-4 flex size-10 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary lg:hidden"
          aria-hidden
        >
          <UserPlus className="size-5" />
        </div>
        <p className={cn(sectionEyebrowClassName, "lg:hidden")}>New driver</p>
        <h2 className="mt-2 font-v2-headline text-lg font-semibold text-v2-on-surface lg:mt-0">
          Create account
        </h2>
      </div>

      {authRedirectMessage && (
        <p
          className="mb-6 rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-low px-4 py-3 font-v2-body text-sm text-v2-on-surface-variant"
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
                  <span className="normal-case text-v2-on-surface-variant/70">
                    (optional)
                  </span>
                </label>
                <FormControl>
                  <Input
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    disabled={loading}
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
                    placeholder="you@example.com"
                    disabled={loading}
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
                    className={v2InputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormRootMessage className="text-xs text-v2-error" />

          <Button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={cn("w-full", v2PrimaryButtonClassName)}
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

          <p className="text-center font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
            By signing up, you agree to our{" "}
            <Link
              to="/v2/terms-and-conditions"
              className="text-v2-primary transition-colors hover:text-v2-primary/80"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/v2/privacy-policy"
              className="text-v2-primary transition-colors hover:text-v2-primary/80"
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
