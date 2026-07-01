import type { UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { WithRootError } from "@/lib/formWithRootError";
import type { SettingsDisplayNameValues } from "@/lib/validation/settingsForms";
import type { AuthUser } from "@/lib/api";
import { SettingsSectionChromeV2 } from "./SettingsSectionChromeV2";
import { cn } from "@/lib/utils";

const v2InputClassName =
  "w-full rounded-md border border-v2-outline-variant/20 bg-v2-surface-container-highest px-3 py-2 font-v2-headline text-xl font-bold text-v2-on-surface placeholder:text-v2-on-surface-variant/50 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-v2-primary disabled:opacity-50";

type SettingsAccountSectionV2Props = {
  user: AuthUser;
  displayNameForm: UseFormReturn<WithRootError<SettingsDisplayNameValues>>;
  onSaveDisplayName: (
    values: SettingsDisplayNameValues,
  ) => void | Promise<void>;
  saveDisabled: boolean;
  saving: boolean;
  success: boolean;
  formatCreatedAt: (createdAt?: string) => string;
};

export default function SettingsAccountSectionV2({
  user,
  displayNameForm,
  onSaveDisplayName,
  saveDisabled,
  saving,
  success,
  formatCreatedAt,
}: SettingsAccountSectionV2Props) {
  const createdAt = (user as { createdAt?: string }).createdAt;

  return (
    <SettingsSectionChromeV2 title="Account">
      <Form {...displayNameForm}>
        <form
          onSubmit={displayNameForm.handleSubmit(onSaveDisplayName)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={displayNameForm.control}
              name="displayName"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <label className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
                    Display Name
                  </label>
                  <FormControl>
                    <Input
                      placeholder="Enter display name"
                      disabled={saving}
                      className={v2InputClassName}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        displayNameForm.clearErrors("root");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-v2-error" />
                </FormItem>
              )}
            />
            <div className="space-y-1">
              <label className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
                Email Address
              </label>
              <p className="font-v2-headline text-xl font-bold text-v2-on-surface">
                {user.email ?? "—"}
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
                Member Since
              </label>
              <p className="font-v2-headline text-xl font-bold text-v2-on-surface">
                {formatCreatedAt(createdAt)}
              </p>
            </div>
          </div>
          <FormRootMessage className="text-xs text-v2-error" />
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={saveDisabled}
              className={cn(
                "px-8 py-2.5 font-v2-headline text-sm font-bold uppercase tracking-widest",
                !saveDisabled &&
                  "bg-v2-primary text-white hover:bg-v2-primary/90",
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            {success && <p className="text-xs text-v2-success">Saved</p>}
          </div>
        </form>
      </Form>
    </SettingsSectionChromeV2>
  );
}
