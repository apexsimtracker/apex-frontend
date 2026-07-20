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
import { SettingsSectionChrome } from "./SettingsSectionChrome";
import {
  appAccountInputClassName,
  appAccountFieldValueClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";

type SettingsAccountSectionProps = {
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

export default function SettingsAccountSection({
  user,
  displayNameForm,
  onSaveDisplayName,
  saveDisabled,
  saving,
  success,
  formatCreatedAt,
}: SettingsAccountSectionProps) {
  const createdAt = (user as { createdAt?: string }).createdAt;

  return (
    <SettingsSectionChrome title="Account">
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
                  <label className="font-apex-body text-[10px] uppercase text-apex-on-surface-variant">
                    Display Name
                  </label>
                  <FormControl>
                    <Input
                      placeholder="Enter display name"
                      disabled={saving}
                      className={appAccountInputClassName}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        displayNameForm.clearErrors("root");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-apex-error" />
                </FormItem>
              )}
            />
            <div className="space-y-1">
              <label className="font-apex-body text-[10px] uppercase text-apex-on-surface-variant">
                Email Address
              </label>
              <p className={appAccountFieldValueClassName}>
                {user.email ?? "—"}
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-apex-body text-[10px] uppercase text-apex-on-surface-variant">
                Member Since
              </label>
              <p className={appAccountFieldValueClassName}>
                {formatCreatedAt(createdAt)}
              </p>
            </div>
          </div>
          <FormRootMessage className="text-xs text-apex-error" />
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={saveDisabled}
              className={appPrimaryButtonClassName}
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
            {success && <p className="text-xs text-apex-success">Saved</p>}
          </div>
        </form>
      </Form>
    </SettingsSectionChrome>
  );
}
