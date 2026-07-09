import { forwardRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PenLine, Plus, Upload, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LogSessionSheetV2 from "@/components/v2/LogSessionSheetV2";
import {
  v2DropdownContentClassName,
  v2DropdownItemClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import {
  logSessionMenuItemsV2,
  type LogSessionMenuIcon,
} from "@/config/navigation";
import { cn } from "@/lib/utils";

const createPlusButtonClassName = cn(
  "flex size-8 items-center justify-center rounded-xl border border-v2-outline-variant/30 bg-v2-primary text-white transition-colors hover:bg-v2-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/70",
);

const CreatePlusButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(createPlusButtonClassName, className)}
    aria-label="Create"
    {...props}
  >
    <Plus className="size-5" aria-hidden />
  </button>
));
CreatePlusButton.displayName = "CreatePlusButton";

function DropdownMenuIcon({ icon }: { icon: LogSessionMenuIcon }) {
  const className = "mr-2 size-4 shrink-0";
  switch (icon) {
    case "agent":
      return <Zap className={className} aria-hidden />;
    case "manual":
      return <PenLine className={className} aria-hidden />;
    case "upload":
      return <Upload className={className} aria-hidden />;
  }
}

export default function CreateMenuV2() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div className="md:hidden">
        <CreatePlusButton onClick={() => setSheetOpen(true)} />
        <LogSessionSheetV2 open={sheetOpen} onOpenChange={setSheetOpen} />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <CreatePlusButton className="hidden md:flex" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={v2DropdownContentClassName}>
          {logSessionMenuItemsV2.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className={v2DropdownItemClassName}
              onClick={() => navigate(item.to)}
            >
              <DropdownMenuIcon icon={item.icon} />
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span>{item.title}</span>
                {item.proBadge ? (
                  <span className="rounded-[2px] bg-[#E10600] px-1 py-px text-[6px] font-bold uppercase tracking-wider text-white">
                    Pro
                  </span>
                ) : null}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
