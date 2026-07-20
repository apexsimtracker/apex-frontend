import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { cn } from "@/lib/utils";
import { cardClassName } from "./publicHomeShared";

export default function PublicHomeFinalCta() {
  return (
    <section className={cn(cardClassName, "text-center")}>
      <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface sm:text-xl">
        Ready to centralize your sim racing data?
      </h2>
      <p className="mx-auto mt-2 max-w-md font-apex-body text-sm text-apex-on-surface-variant">
        Join {COMPANY_NAME} and turn scattered sessions into a clear picture of
        your pace.
      </p>
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild className={appPrimaryButtonClassName}>
          <Link to="/signup">Sign up free</Link>
        </Button>
        <Button asChild className={appOutlineButtonClassName}>
          <Link to="/contact">Contact us</Link>
        </Button>
      </div>
    </section>
  );
}
