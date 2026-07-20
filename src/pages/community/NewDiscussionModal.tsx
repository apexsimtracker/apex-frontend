import type { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DISCUSSION_CATEGORIES } from "@/lib/api";
import type { WithRootError } from "@/lib/formWithRootError";
import type { NewDiscussionFormValues } from "@/lib/validation/community";
import { cn } from "@/lib/utils";
import {
  appInputClassName,
  appManualTextareaClassName,
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { AppBaseModal } from "@/components/app-ui/AppBaseModal";

const createCategories = DISCUSSION_CATEGORIES.filter((c) => c.value !== "all");

type NewDiscussionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<WithRootError<NewDiscussionFormValues>>;
  creating: boolean;
  onSubmit: (values: NewDiscussionFormValues) => void | Promise<void>;
};

export default function NewDiscussionModal({
  open,
  onOpenChange,
  form,
  creating,
  onSubmit,
}: NewDiscussionModalProps) {
  const closeModal = () => {
    if (creating) return;
    onOpenChange(false);
    form.clearErrors("root");
  };

  if (!open) return null;

  return (
    <AppBaseModal
      isOpen={open}
      onClose={closeModal}
      title="Create New Discussion"
      size="xl"
      mobileVariant="fullscreen"
      footer={
        <>
          <button
            type="button"
            className={cn(
              appOutlineButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            onClick={closeModal}
            disabled={creating}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-discussion-form"
            className={cn(
              appPrimaryButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            disabled={creating}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="create-discussion-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormRootMessage className="mb-4 font-apex-body text-xs text-apex-error" />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-3 block font-apex-body text-sm font-medium text-apex-on-surface">
                  Category
                </FormLabel>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {createCategories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        field.onChange(cat.value);
                      }}
                      className={cn(
                        "rounded-apex-sm border p-3 font-apex-body text-sm font-medium transition-all",
                        field.value === cat.value
                          ? "border-apex-primary/60 bg-apex-primary/10 text-apex-on-surface"
                          : "text-apex-on-surface hover:border-apex-outline-variant/30",
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <FormMessage className="font-apex-body text-xs text-apex-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-0.5 block font-apex-body text-sm font-medium text-apex-on-surface">
                  Discussion Title
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="What's your question or topic?"
                    disabled={creating}
                    className={appInputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-apex-body text-xs text-apex-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-0.5 block font-apex-body text-sm font-medium text-apex-on-surface">
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your discussion in detail..."
                    disabled={creating}
                    className={cn(
                      appManualTextareaClassName,
                      "h-32 resize-none",
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-apex-body text-xs text-apex-error" />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </AppBaseModal>
  );
}
