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
          <FormRootMessage className="mb-4 text-xs" />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-3 block text-sm font-medium text-foreground">
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
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "text-foreground hover:border-border",
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-0.5 block text-sm font-medium text-foreground">
                  Discussion Title
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="What's your question or topic?"
                    disabled={creating}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="mb-0.5 block text-sm font-medium text-foreground">
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your discussion in detail..."
                    disabled={creating}
                    className="h-32 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </BaseModal>
  );
}
