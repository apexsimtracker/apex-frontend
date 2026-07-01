import type { UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseAlertDialog } from "@/components/ui/base-modal";
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
import type { DeleteAccountFormValues } from "@/lib/validation/settingsForms";

const v2InputClassName =
  "w-full rounded-lg border border-v2-outline-variant/20 bg-v2-surface-container-highest px-3 py-2 text-sm text-v2-on-surface placeholder:text-v2-on-surface-variant/50 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-v2-primary disabled:opacity-50";

type SettingsDeleteDialogV2Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteAccountForm: UseFormReturn<WithRootError<DeleteAccountFormValues>>;
  onConfirm: (values: DeleteAccountFormValues) => void | Promise<void>;
  submitting: boolean;
  deleteConfirmPhrase: string;
};

export default function SettingsDeleteDialogV2({
  open,
  onOpenChange,
  deleteAccountForm,
  onConfirm,
  submitting,
  deleteConfirmPhrase,
}: SettingsDeleteDialogV2Props) {
  return (
    <BaseAlertDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Delete account"
      description={
        <>
          <span className="block">
            This will sign you out everywhere, revoke sessions, and anonymize
            your email, password, name, avatar, and bio. You will not be able to
            sign in again with this account.
          </span>
          <span className="block font-medium text-v2-on-surface">
            Type {deleteConfirmPhrase} below to confirm.
          </span>
        </>
      }
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="delete-account-form"
            variant="destructive"
            disabled={submitting}
            className={submitting ? "cursor-not-allowed opacity-60" : undefined}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Deleting…
              </>
            ) : (
              "Delete permanently"
            )}
          </Button>
        </>
      }
    >
      <Form {...deleteAccountForm}>
        <form
          id="delete-account-form"
          onSubmit={deleteAccountForm.handleSubmit(onConfirm)}
          className="space-y-3"
        >
          <FormField
            control={deleteAccountForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Current password"
                    disabled={submitting}
                    className={v2InputClassName}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      deleteAccountForm.clearErrors("root");
                    }}
                  />
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />
          <FormField
            control={deleteAccountForm.control}
            name="confirmPhrase"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="text"
                    autoComplete="off"
                    placeholder={`Type ${deleteConfirmPhrase}`}
                    disabled={submitting}
                    className={v2InputClassName}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      deleteAccountForm.clearErrors("root");
                    }}
                  />
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />
          <FormRootMessage className="text-xs text-v2-error" />
        </form>
      </Form>
    </BaseAlertDialog>
  );
}
