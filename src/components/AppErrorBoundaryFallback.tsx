import type { ErrorFallbackProps } from "@/components/ErrorFallback";
import AppErrorFallback from "@/components/AppErrorFallback";
import BottomNav from "@/components/BottomNav";
import AppLayout from "@/components/AppLayout";
import ErrorTopBar from "@/pages/error/ErrorTopBar";

export default function AppErrorBoundaryFallback(props: ErrorFallbackProps) {
  return (
    <AppLayout topBar={<ErrorTopBar />} bottomBar={<BottomNav />}>
      <AppErrorFallback {...props} />
    </AppLayout>
  );
}
