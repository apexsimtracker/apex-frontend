import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { cn } from "@/lib/utils";
import { gradientCardClassName } from "./publicHomeV2Shared";

export default function PublicHomeFinalCtaV2() {
  return (
    <section
      className={cn(
        gradientCardClassName,
        "relative text-center shadow-[0_0_24px_hsl(var(--v2-primary)/0.15)]",
      )}
    >
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface sm:text-xl">
        Ready to centralize your sim racing data?
      </h2>
      <p className="mx-auto mt-2 max-w-md font-v2-body text-sm text-v2-on-surface-variant">
        Join {COMPANY_NAME} and turn scattered sessions into a clear picture of
        your pace.
      </p>
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild className={v2PrimaryButtonClassName}>
          <Link to="/v2/signup">Sign up free</Link>
        </Button>
        <Button asChild className={v2OutlineButtonClassName}>
          <Link to="/v2/contact">Contact us</Link>
        </Button>
      </div>
    </section>
  );
}
