import type { UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  v2DestructiveButtonClassName,
  v2InputClassName,
  v2OutlineButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { V2BaseAlertDialog } from "@/components/v2/ui/V2BaseModal";

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
    <V2BaseAlertDialog
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
          <button
            type="button"
            className={cn(
              v2OutlineButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="delete-account-form"
            className={cn(
              v2DestructiveButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
              submitting && "cursor-not-allowed opacity-60",
            )}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Deleting…
              </>
            ) : (
              "Delete permanently"
            )}
          </button>
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
    </V2BaseAlertDialog>
  );
}
