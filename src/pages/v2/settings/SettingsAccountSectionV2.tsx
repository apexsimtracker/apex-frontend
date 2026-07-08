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
import {
  v2AccountInputClassName,
  v2AccountFieldValueClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";

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
                      className={v2AccountInputClassName}
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
              <p className={v2AccountFieldValueClassName}>
                {user.email ?? "—"}
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
                Member Since
              </label>
              <p className={v2AccountFieldValueClassName}>
                {formatCreatedAt(createdAt)}
              </p>
            </div>
          </div>
          <FormRootMessage className="text-xs text-v2-error" />
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={saveDisabled}
              className={v2PrimaryButtonClassName}
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
