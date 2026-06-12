import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { AdminAgentReleasesPanel } from "@/pages/admin/AdminAgentReleasesPanel";
import { ADMIN_PAGE } from "@/pages/admin/adminTableLayout";

const TITLE = `Admin · Agent releases | ${COMPANY_NAME}`;

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent releases</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Publish desktop agent installers, verify R2 delivery, toggle download settings, and review
            download audit logs.
          </p>
        </div>

        <AdminAgentReleasesPanel />
      </div>
    </>
  );
}
