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
  v2InputClassName,
  v2ManualTextareaClassName,
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { V2BaseModal } from "@/components/v2/ui/V2BaseModal";

const createCategories = DISCUSSION_CATEGORIES.filter((c) => c.value !== "all");

type NewDiscussionModalV2Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<WithRootError<NewDiscussionFormValues>>;
  creating: boolean;
  onSubmit: (values: NewDiscussionFormValues) => void | Promise<void>;
};

export default function NewDiscussionModalV2({
  open,
  onOpenChange,
  form,
  creating,
  onSubmit,
}: NewDiscussionModalV2Props) {
  const closeModal = () => {
    if (creating) return;
    onOpenChange(false);
    form.clearErrors("root");
  };

  if (!open) return null;

  return (
    <V2BaseModal
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
              v2OutlineButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            onClick={closeModal}
            disabled={creating}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-discussion-form-v2"
            className={cn(
              v2PrimaryButtonClassName,
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
          id="create-discussion-form-v2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormRootMessage className="mb-4 font-v2-body text-xs text-v2-error" />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-3 block font-v2-body text-sm font-medium text-v2-on-surface">
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
                        "rounded-v2-sm border p-3 font-v2-body text-sm font-medium transition-all",
                        field.value === cat.value
                          ? "border-v2-primary/60 bg-v2-primary/10 text-v2-on-surface"
                          : "text-v2-on-surface hover:border-v2-outline-variant/30",
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <FormMessage className="font-v2-body text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-0.5 block font-v2-body text-sm font-medium text-v2-on-surface">
                  Discussion Title
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="What's your question or topic?"
                    disabled={creating}
                    className={v2InputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-v2-body text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-0.5 block font-v2-body text-sm font-medium text-v2-on-surface">
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your discussion in detail..."
                    disabled={creating}
                    className={cn(
                      v2ManualTextareaClassName,
                      "h-32 resize-none",
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-v2-body text-xs text-v2-error" />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </V2BaseModal>
  );
}
