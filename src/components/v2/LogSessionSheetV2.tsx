import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronRight, PenLine, Upload, X, Zap } from "lucide-react";
import {
  logSessionMenuItemsV2,
  type LogSessionMenuIcon,
  type LogSessionMenuItemV2,
} from "@/config/navigation";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Loveable telemetry.html overrides `rounded-full` to 0.75rem — not a circle. */
const LOVEABLE_ICON_RADIUS = "rounded-[0.75rem]";

type LogSessionSheetV2Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function LogSessionMenuIcon({
  icon,
  featured,
}: {
  icon: LogSessionMenuIcon;
  featured?: boolean;
}) {
  const iconClassName = featured
    ? "size-[22px] fill-[#E10600] text-[#E10600]"
    : "size-[22px] text-white/60";

  switch (icon) {
    case "agent":
      return <Zap className={iconClassName} aria-hidden />;
    case "manual":
      return <PenLine className={iconClassName} aria-hidden />;
    case "upload":
      return <Upload className={iconClassName} aria-hidden />;
  }
}

function LogSessionSheetRow({
  item,
  onSelect,
}: {
  item: LogSessionMenuItemV2;
  onSelect: (to: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.to)}
      className="group relative flex h-[76px] w-full cursor-pointer items-center border-b border-white/5 px-6 text-left transition-colors hover:bg-white/[0.03]"
    >
      {item.featured ? (
        <div
          className="absolute inset-y-0 left-0 w-[2px] bg-[#E10600]"
          aria-hidden
        />
      ) : null}

      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center border",
          LOVEABLE_ICON_RADIUS,
          item.featured
            ? "border-[#E10600]/20 bg-[#E10600]/15"
            : "border-white/10 bg-white/5",
        )}
      >
        <LogSessionMenuIcon icon={item.icon} featured={item.featured} />
      </div>

      <div className="ml-4 flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="font-v2-headline text-[15px] font-semibold text-white">
            {item.title}
          </span>
          {item.proBadge ? (
            <span className="rounded-[2px] bg-[#E10600] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              APEX PRO REQUIRED
            </span>
          ) : null}
        </div>
        <p className="truncate text-[12px] text-white/40">{item.subtitle}</p>
      </div>

      <ChevronRight
        className="size-5 shrink-0 text-white/20 transition-colors group-hover:text-white/40"
        aria-hidden
      />
    </button>
  );
}

export default function LogSessionSheetV2({
  open,
  onOpenChange,
}: LogSessionSheetV2Props) {
  const navigate = useNavigate();

  const handleSelect = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <div className="v2-theme">
          <DialogPrimitive.Overlay
            className={cn(
              "v2-log-session-overlay fixed inset-0 z-[80]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            )}
          />
          <DialogPrimitive.Content
            className={cn(
              "v2-log-session-sheet fixed inset-x-0 bottom-0 z-[80] mx-auto flex h-[58vh] w-full max-w-xl flex-col overflow-hidden",
              "rounded-t-[16px] border-t border-white/10 bg-v2-background text-v2-on-surface",
              "outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
              "duration-300",
            )}
            aria-describedby="log-session-sheet-description"
          >
            <div
              className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/20"
              aria-hidden
            />

            <header className="mt-1 flex items-start justify-between p-4 px-6">
              <div className="flex flex-col">
                <DialogPrimitive.Title className="font-v2-headline text-[20px] font-semibold leading-tight text-white">
                  Log a Session
                </DialogPrimitive.Title>
                <DialogPrimitive.Description
                  id="log-session-sheet-description"
                  className="mt-0.5 text-[13px] font-normal text-white/50"
                >
                  Choose how you want to record this session
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                type="button"
                className="flex size-8 items-center justify-center text-white/40 transition-colors hover:text-white"
                aria-label="Close"
              >
                <X className="size-6" aria-hidden />
              </DialogPrimitive.Close>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {logSessionMenuItemsV2.map((item) => (
                <LogSessionSheetRow
                  key={item.id}
                  item={item}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            <div className="h-8 w-full shrink-0" aria-hidden />
          </DialogPrimitive.Content>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
