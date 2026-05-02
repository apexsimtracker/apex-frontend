import { useNavigate } from "react-router-dom";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";

type AdminComingSoonPageProps = {
  /** Section name shown in the heading and browser title */
  title: string;
  /** Canonical path for meta (e.g. /admin/users) */
  path: string;
};

export default function AdminComingSoonPage({ title, path }: AdminComingSoonPageProps) {
  const navigate = useNavigate();
  const pageTitle = `${title} · Admin | ${COMPANY_NAME}`;

  return (
    <>
      <PageMeta path={path} title={pageTitle} description={`${title} — coming soon.`} noindex />
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full border border-white/10 bg-secondary/40">
          <Construction className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-3 text-muted-foreground">
          This admin tool is not available yet. Check back later for updates.
        </p>
        <p className="mt-6 rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
          Coming soon
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="min-w-[10rem] bg-[rgba(240,28,28,0.85)] text-white hover:bg-[rgba(220,24,24,0.95)]"
            onClick={() => navigate("/admin")}
          >
            Back to dashboard
          </Button>
          <Button type="button" variant="outline" className="min-w-[10rem]" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </div>
    </>
  );
}
