import { Children, Fragment, isValidElement, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/app-ui/AppAlertDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/app-ui/AppDialog";
import {
  appModalBodyClassName,
  appModalFooterClassName,
  appModalHeaderClassName,
  appModalPanelClassName,
  type AppModalMobileVariant,
  type AppModalSize,
} from "@/components/app-ui/appModalStyles";
import { cn } from "@/lib/utils";

type AppBaseModalSharedProps = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: AppModalSize;
  mobileVariant?: AppModalMobileVariant;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
};

type AppBaseModalProps = AppBaseModalSharedProps & {
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

export function AppBaseModal({
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
}: AppBaseModalProps) {
  const hasBody = hasModalBodyContent(children);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size={size}
        mobileVariant={mobileVariant}
        className={contentClassName}
        showCloseButton={!hideCloseButton}
        closeLabel={closeLabel}
        // Radix warns unless a Description exists or this is explicitly undefined.
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <div className={appModalPanelClassName}>
          <DialogHeader
            className={cn(
              appModalHeaderClassName,
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
            <div className={cn(appModalBodyClassName, bodyClassName)}>
              {children}
            </div>
          ) : null}
          {footer ? (
            <DialogFooter
              className={cn(
                appModalFooterClassName,
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

type AppBaseAlertDialogProps = AppBaseModalSharedProps;

export function AppBaseAlertDialog({
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
}: AppBaseAlertDialogProps) {
  const hasBody = hasModalBodyContent(children);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        size={size}
        mobileVariant={mobileVariant}
        className={contentClassName}
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <div className={appModalPanelClassName}>
          <AlertDialogHeader
            className={cn(
              appModalHeaderClassName,
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
            <div className={cn(appModalBodyClassName, bodyClassName)}>
              {children}
            </div>
          ) : null}
          {footer ? (
            <AlertDialogFooter
              className={cn(
                appModalFooterClassName,
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
