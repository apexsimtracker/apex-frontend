import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function EditActivityTopBarV2() {
  const { id } = useParams<{ id: string }>();
  const sid = id?.trim() ?? "";
  const backTo = sid ? `/v2/sessions/${sid}` : "/v2";

  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-v2-outline-variant bg-v2-background p-4">
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 text-sm text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        <span className="sr-only sm:not-sr-only">Back</span>
      </Link>
      <h1 className="flex-1 text-center font-v2-headline text-base font-bold tracking-tight text-v2-on-surface">
        Edit session
      </h1>
      <span className="w-[52px] shrink-0 sm:w-[72px]" aria-hidden />
    </div>
  );
}
