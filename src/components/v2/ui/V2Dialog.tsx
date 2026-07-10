import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  v2ModalCloseButtonClassName,
  v2ModalDescriptionClassName,
  v2ModalOverlayClassName,
  v2ModalSurfaceVariants,
  v2ModalTitleClassName,
  type V2ModalSurfaceVariantProps,
} from "@/components/v2/ui/v2ModalStyles";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(v2ModalOverlayClassName, className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> &
  V2ModalSurfaceVariantProps & {
    showCloseButton?: boolean;
    closeLabel?: string;
    closeClassName?: string;
  };

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    {
      className,
      children,
      size,
      mobileVariant,
      showCloseButton = true,
      closeLabel = "Close",
      closeClassName,
      ...props
    },
    ref,
  ) => (
    <DialogPortal>
      <div className="v2-theme">
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            v2ModalSurfaceVariants({ size, mobileVariant }),
            className,
          )}
          {...props}
        >
          {children}
          {showCloseButton ? (
            <DialogPrimitive.Close
              className={cn(v2ModalCloseButtonClassName, closeClassName)}
            >
              <X className="size-4" />
              <span className="sr-only">{closeLabel}</span>
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-2 text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(v2ModalTitleClassName, className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(v2ModalDescriptionClassName, className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
