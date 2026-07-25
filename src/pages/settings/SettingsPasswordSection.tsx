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
import { PasswordInput } from "@/components/ui/password-input";
import type { WithRootError } from "@/lib/formWithRootError";
import type { SettingsChangePasswordValues } from "@/lib/validation/settingsForms";
import { PASSWORD_MIN, PASSWORD_MAX } from "@/lib/validation/settingsForms";
import { SettingsSectionChrome } from "./SettingsSectionChrome";
import {
  appInputClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";

type SettingsPasswordSectionProps = {
  changePasswordForm: UseFormReturn<
    WithRootError<SettingsChangePasswordValues>
  >;
  onChangePassword: (
    values: SettingsChangePasswordValues,
  ) => void | Promise<void>;
  changePwWatch: SettingsChangePasswordValues;
  trimmedNewPw: string;
  currentPasswordValid: boolean;
  newPasswordValid: boolean;
  newPasswordTooLong: boolean;
  passwordsSameAsCurrent: boolean;
  updatePasswordDisabled: boolean;
  changePwSubmitting: boolean;
  changePwSuccess: boolean;
  onFieldChange: () => void;
};

export default function SettingsPasswordSection({
  changePasswordForm,
  onChangePassword,
  changePwWatch,
  trimmedNewPw,
  currentPasswordValid,
  newPasswordValid,
  newPasswordTooLong,
  passwordsSameAsCurrent,
  updatePasswordDisabled,
  changePwSubmitting,
  changePwSuccess,
  onFieldChange,
}: SettingsPasswordSectionProps) {
  return (
    <SettingsSectionChrome title="Password & security">
      <p className="mb-4 text-xs text-apex-on-surface-variant">
        Enter your current password and a new password ({PASSWORD_MIN}–
        {PASSWORD_MAX} characters).
      </p>
      <Form {...changePasswordForm}>
        <form
          id="change-password"
          onSubmit={changePasswordForm.handleSubmit(onChangePassword)}
          className="max-w-md space-y-3"
        >
          <FormField
            control={changePasswordForm.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password"
                    placeholder="Current password"
                    disabled={changePwSubmitting}
                    className={appInputClassName}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onFieldChange();
                    }}
                  />
                </FormControl>
                {!currentPasswordValid &&
                  changePwWatch.currentPassword?.length === 0 &&
                  (changePwWatch.newPassword?.length ?? 0) > 0 && (
                    <p className="text-xs text-amber-500">
                      Current password is required.
                    </p>
                  )}
                <FormMessage className="text-xs text-apex-error" />
              </FormItem>
            )}
          />
          <FormField
            control={changePasswordForm.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="New password"
                    disabled={changePwSubmitting}
                    className={appInputClassName}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onFieldChange();
                    }}
                  />
                </FormControl>
                {(changePwWatch.newPassword?.length ?? 0) > 0 &&
                  trimmedNewPw.length < PASSWORD_MIN && (
                    <p className="text-xs text-amber-500">
                      New password must be at least {PASSWORD_MIN} characters.
                    </p>
                  )}
                {newPasswordTooLong && (
                  <p className="text-xs text-amber-500">
                    New password must be at most {PASSWORD_MAX} characters.
                  </p>
                )}
                {passwordsSameAsCurrent &&
                  newPasswordValid &&
                  currentPasswordValid && (
                    <p className="text-xs text-amber-500">
                      New password must be different from your current password.
                    </p>
                  )}
                <FormMessage className="text-xs text-apex-error" />
              </FormItem>
            )}
          />
          <FormRootMessage className="text-xs text-apex-error" />
          {changePwSuccess && (
            <p className="text-xs text-apex-success">Password updated.</p>
          )}
          <Button
            type="submit"
            disabled={updatePasswordDisabled}
            aria-busy={changePwSubmitting}
            className={cn(appPrimaryButtonClassName)}
          >
            {changePwSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </Form>
    </SettingsSectionChrome>
  );
}
