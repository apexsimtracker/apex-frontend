import { Children, Fragment, isValidElement, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/v2/ui/V2AlertDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/v2/ui/V2Dialog";
import {
  v2ModalBodyClassName,
  v2ModalFooterClassName,
  v2ModalHeaderClassName,
  v2ModalPanelClassName,
  type V2ModalMobileVariant,
  type V2ModalSize,
} from "@/components/v2/ui/v2ModalStyles";
import { cn } from "@/lib/utils";

type V2BaseModalSharedProps = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: V2ModalSize;
  mobileVariant?: V2ModalMobileVariant;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
};

type V2BaseModalProps = V2BaseModalSharedProps & {
  hideCloseButton?: boolean;
  closeLabel?: string;
};

function hasModalBodyContent(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if (typeof child === "string") return child.trim().length > 0;
    if (typeof child === "number") return true;
    if (!isValidElement(child)) return false;
    if (child.type === Fragment) {
      return hasModalBodyContent(
        (child.props as { children?: ReactNode }).children,
      );
    }
    return true;
  });
}

export function V2BaseModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  mobileVariant = "centered",
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  hideCloseButton = false,
  closeLabel = "Close modal",
}: V2BaseModalProps) {
  const hasBody = hasModalBodyContent(children);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size={size}
        mobileVariant={mobileVariant}
        className={contentClassName}
        showCloseButton={!hideCloseButton}
        closeLabel={closeLabel}
      >
        <div className={v2ModalPanelClassName}>
          <DialogHeader
            className={cn(
              v2ModalHeaderClassName,
              !hasBody && footer && "border-b-0",
              headerClassName,
            )}
          >
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          {hasBody ? (
            <div className={cn(v2ModalBodyClassName, bodyClassName)}>
              {children}
            </div>
          ) : null}
          {footer ? (
            <DialogFooter
              className={cn(
                v2ModalFooterClassName,
                !hasBody && "border-t-0 pt-0",
                footerClassName,
              )}
            >
              {footer}
            </DialogFooter>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type V2BaseAlertDialogProps = V2BaseModalSharedProps;

export function V2BaseAlertDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  mobileVariant = "centered",
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
}: V2BaseAlertDialogProps) {
  const hasBody = hasModalBodyContent(children);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        size={size}
        mobileVariant={mobileVariant}
        className={contentClassName}
      >
        <div className={v2ModalPanelClassName}>
          <AlertDialogHeader
            className={cn(
              v2ModalHeaderClassName,
              !hasBody && footer && "border-b-0",
              headerClassName,
            )}
          >
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description ? (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          {hasBody ? (
            <div className={cn(v2ModalBodyClassName, bodyClassName)}>
              {children}
            </div>
          ) : null}
          {footer ? (
            <AlertDialogFooter
              className={cn(
                v2ModalFooterClassName,
                !hasBody && "border-t-0 pt-0",
                footerClassName,
              )}
            >
              {footer}
            </AlertDialogFooter>
          ) : null}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
