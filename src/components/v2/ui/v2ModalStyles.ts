import { cva, type VariantProps } from "class-variance-authority";

export const v2ModalOverlayClassName =
  "fixed inset-0 z-[80] bg-v2-background/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";

export const v2ModalSurfaceVariants = cva(
  "fixed z-[80] flex min-h-0 w-full flex-col gap-0 overflow-hidden border border-v2-outline-variant/15 bg-v2-surface-container text-v2-on-surface shadow-lg duration-200 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  {
    variants: {
      size: {
        sm: "sm:max-w-md",
        md: "sm:max-w-lg",
        lg: "sm:max-w-xl",
        xl: "sm:max-w-2xl",
        "2xl": "sm:max-w-3xl",
        full: "sm:max-w-[min(72rem,calc(100vw-2rem))]",
      },
      mobileVariant: {
        centered:
          "left-[50%] top-[50%] max-h-[calc(100dvh-2rem)] translate-x-[-50%] translate-y-[-50%] rounded-xl data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        sheet:
          "inset-x-0 bottom-0 max-h-[calc(100dvh-0.75rem)] rounded-t-[16px] data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:w-full sm:max-h-[calc(100dvh-2rem)] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-xl sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
        fullscreen:
          "inset-0 h-[100dvh] max-h-[100dvh] max-w-none rounded-none border-0 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full sm:left-[50%] sm:top-[50%] sm:right-auto sm:bottom-auto sm:h-auto sm:w-full sm:max-h-[calc(100dvh-2rem)] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-xl sm:border sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
      },
    },
    defaultVariants: {
      size: "md",
      mobileVariant: "centered",
    },
  },
);

export type V2ModalSurfaceVariantProps = VariantProps<
  typeof v2ModalSurfaceVariants
>;
export type V2ModalSize = NonNullable<V2ModalSurfaceVariantProps["size"]>;
export type V2ModalMobileVariant = NonNullable<
  V2ModalSurfaceVariantProps["mobileVariant"]
>;

export const v2ModalPanelClassName =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";
export const v2ModalHeaderClassName =
  "shrink-0 space-y-2 border-b border-v2-outline-variant/15 px-5 py-4 text-left sm:px-6";
/** Extra bottom padding so the last lines clear scrollbars / home indicator when scrolling. */
export const v2ModalBodyClassName =
  "min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-8";
export const v2ModalFooterClassName =
  "shrink-0 flex flex-col-reverse gap-2 border-t border-v2-outline-variant/15 px-5 pb-[max(1rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] pt-4 sm:flex-row sm:justify-end sm:px-6";
export const v2ModalTitleClassName =
  "font-v2-headline text-lg font-semibold leading-7 text-v2-on-surface";
export const v2ModalDescriptionClassName =
  "font-v2-body text-sm leading-6 text-v2-on-surface-variant";
export const v2ModalCloseButtonClassName =
  "absolute right-3 top-3 rounded-v2-sm p-2 text-v2-on-surface-variant transition-colors hover:bg-v2-surface-container-high hover:text-v2-on-surface focus:outline-none focus:ring-2 focus:ring-v2-primary/70 focus:ring-offset-2 focus:ring-offset-v2-surface-container disabled:pointer-events-none disabled:opacity-50";

/** Bottom sheet top radius — matches LogSessionSheetV2. */
export const v2ModalSheetTopRadiusClassName = "rounded-t-[16px]";
