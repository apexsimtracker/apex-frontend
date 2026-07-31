import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { getApiBase, getAppEnv } from "@/lib/api/config";
import { AdminAgentReleasesPanel } from "@/pages/admin/AdminAgentReleasesPanel";
import { ADMIN_PAGE } from "@/pages/admin/adminTableLayout";
import { cn } from "@/lib/utils";

const TITLE = `Admin · Agent releases | ${COMPANY_NAME}`;

function EnvPublishBanner() {
  const appEnv = getAppEnv();
  const apiBase = getApiBase();
  const isProd = appEnv === "production";
  const isStaging = appEnv === "staging";

  return (
    <div
      className={cn(
        "mb-6 rounded-md border px-4 py-3 text-sm",
        isProd && "border-destructive/40 bg-destructive/10 text-foreground",
        isStaging && "border-amber-500/40 bg-amber-500/10 text-foreground",
        !isProd && !isStaging && "border-border bg-muted/40 text-muted-foreground",
      )}
      role="status"
    >
      <p className="font-medium text-foreground">
        Publishing to{" "}
        <span className="uppercase tracking-wide">{appEnv}</span>
      </p>
      <p className="mt-1">
        Installers upload to the R2 keys configured on{" "}
        <span className="break-all font-mono text-xs">{apiBase}</span>.
        {isProd
          ? " Confirm you intend to overwrite production agent downloads."
          : isStaging
            ? " Staging should use separate R2 keys/prefixes from production."
            : " Local/dev API — verify R2 credentials before publishing."}
      </p>
    </div>
  );
}

export default function AdminDevices() {
  return (
    <>
      <PageMeta
        path="/admin/devices"
        title={TITLE}
        description="Publish and manage Apex Agent desktop releases for macOS, Windows, and Linux."
        noindex
      />
      <div className={ADMIN_PAGE}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Agent releases
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Publish desktop agent installers, verify R2 delivery, toggle
            download settings, and review download audit logs.
          </p>
        </div>

        <EnvPublishBanner />
        <AdminAgentReleasesPanel />
      </div>
    </>
  );
}
