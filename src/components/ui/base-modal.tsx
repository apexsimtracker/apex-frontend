import {
  Children,
  Fragment,
  isValidElement,
  type ReactNode,
} from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  modalBodyClassName,
  modalFooterClassName,
  modalHeaderClassName,
  modalPanelClassName,
  type ModalMobileVariant,
  type ModalSize,
} from "@/components/ui/modal-styles";
import { cn } from "@/lib/utils";

type BaseModalSharedProps = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  mobileVariant?: ModalMobileVariant;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
};

type BaseModalProps = BaseModalSharedProps & {
  hideCloseButton?: boolean;
  closeLabel?: string;
};

function hasModalBodyContent(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if (typeof child === "string") return child.trim().length > 0;
    if (typeof child === "number") return true;
    if (!isValidElement(child)) return false;
    if (child.type === Fragment) {
      return hasModalBodyContent((child.props as { children?: ReactNode }).children);
    }
    return true;
  });
}

export function BaseModal({
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
}: BaseModalProps) {
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
        <div className={modalPanelClassName}>
          <DialogHeader
            className={cn(
              modalHeaderClassName,
              !hasBody && footer && "border-b-0",
              headerClassName
            )}
          >
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          {hasBody ? (
            <div className={cn(modalBodyClassName, bodyClassName)}>{children}</div>
          ) : null}
          {footer ? (
            <DialogFooter
              className={cn(
                modalFooterClassName,
                !hasBody && "border-t-0 pt-0",
                footerClassName
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

type BaseAlertDialogProps = BaseModalSharedProps;

export function BaseAlertDialog({
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
}: BaseAlertDialogProps) {
  const hasBody = hasModalBodyContent(children);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        size={size}
        mobileVariant={mobileVariant}
        className={contentClassName}
      >
        <div className={modalPanelClassName}>
          <AlertDialogHeader
            className={cn(
              modalHeaderClassName,
              !hasBody && footer && "border-b-0",
              headerClassName
            )}
          >
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description ? (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          {hasBody ? (
            <div className={cn(modalBodyClassName, bodyClassName)}>{children}</div>
          ) : null}
          {footer ? (
            <AlertDialogFooter
              className={cn(
                modalFooterClassName,
                !hasBody && "border-t-0 pt-0",
                footerClassName
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
