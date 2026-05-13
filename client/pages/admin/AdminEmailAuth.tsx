import { useSearchParams } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminWebSignInsPanel } from "./AdminWebSignInsPanel";
import { AdminEmailOpsTab } from "./AdminEmailOpsTab";

const TITLE = `Admin · Email & auth ops | ${COMPANY_NAME}`;

type MainTab = "email" | "auth";

function parseTab(raw: string | null): MainTab {
  return raw === "auth" ? "auth" : "email";
}

export default function AdminEmailAuth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const setTab = (next: MainTab) => {
    setSearchParams(next === "email" ? {} : { tab: next }, { replace: true });
  };

  return (
    <>
      <PageMeta
        path="/admin/email-auth"
        title={TITLE}
        description="Email verification tools and browser session administration."
        noindex
      />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Email &amp; auth ops</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review verification and password-reset queues, resend signup codes, and manage{" "}
            <strong className="font-medium text-foreground">web sign-ins</strong> (site auth sessions — not
            racing sessions on <span className="whitespace-nowrap">/admin/sessions</span>).
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as MainTab)} className="w-full">
          <TabsList className="h-auto rounded-lg border border-white/10 bg-white/5 p-0.5">
            <TabsTrigger
              value="email"
              className="rounded-md px-4 py-2 text-sm text-muted-foreground data-[state=active]:bg-white/10 data-[state=active]:text-foreground"
            >
              Email
            </TabsTrigger>
            <TabsTrigger
              value="auth"
              className="rounded-md px-4 py-2 text-sm text-muted-foreground data-[state=active]:bg-white/10 data-[state=active]:text-foreground"
            >
              Auth
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-6">
            <AdminEmailOpsTab />
          </TabsContent>

          <TabsContent value="auth" className="mt-6">
            <AdminWebSignInsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
