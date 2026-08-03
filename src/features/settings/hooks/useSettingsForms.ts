import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { WithRootError } from "@/lib/formWithRootError";
import {
  settingsAccountFormSchema,
  settingsChangePasswordSchema,
  deleteAccountSchema,
  type SettingsAccountFormValues,
  type SettingsChangePasswordValues,
  type DeleteAccountFormValues,
} from "@/lib/validation/settingsForms";
import { DELETE_CONFIRM_PHRASE } from "../constants";

export function useSettingsForms(
  confirmPhrase: string = DELETE_CONFIRM_PHRASE,
) {
  const accountForm = useForm<WithRootError<SettingsAccountFormValues>>({
    resolver: zodResolver(settingsAccountFormSchema),
    defaultValues: { displayName: "", tagline: "" },
    mode: "onChange",
  });

  const changePasswordForm = useForm<
    WithRootError<SettingsChangePasswordValues>
  >({
    resolver: zodResolver(settingsChangePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const deleteAccountForm = useForm<WithRootError<DeleteAccountFormValues>>({
    resolver: zodResolver(deleteAccountSchema(confirmPhrase)),
    defaultValues: { password: "", confirmPhrase: "" },
  });

  return { accountForm, changePasswordForm, deleteAccountForm };
}
