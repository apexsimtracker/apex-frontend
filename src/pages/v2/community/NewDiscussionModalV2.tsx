import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { BaseModal } from "@/components/ui/base-modal";
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

const v2InputClassName =
  "w-full rounded-lg border border-v2-outline-variant/20 bg-v2-surface-container-highest px-3 py-2 text-sm text-v2-on-surface placeholder:text-v2-on-surface-variant/50 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-v2-primary disabled:opacity-50";

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
    <BaseModal
      isOpen={open}
      onClose={closeModal}
      title="Create New Discussion"
      size="xl"
      mobileVariant="fullscreen"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={closeModal}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-discussion-form-v2"
            disabled={creating}
          >
            {creating ? "Creating…" : "Create"}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="create-discussion-form-v2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormRootMessage className="mb-4 text-xs text-v2-error" />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-3 block text-sm font-medium text-v2-on-surface">
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
                        "rounded-lg border p-3 text-sm font-medium transition-all",
                        field.value === cat.value
                          ? "border-v2-primary/60 bg-v2-primary/10 text-v2-on-surface"
                          : "border-v2-outline-variant/20 text-v2-on-surface hover:border-v2-outline-variant/40",
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-0.5 block text-sm font-medium text-v2-on-surface">
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
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-0.5 block text-sm font-medium text-v2-on-surface">
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your discussion in detail..."
                    disabled={creating}
                    className={cn(v2InputClassName, "h-32 resize-none")}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </BaseModal>
  );
}
