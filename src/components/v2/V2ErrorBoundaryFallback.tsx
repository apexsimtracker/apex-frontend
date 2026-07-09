import type { ErrorFallbackProps } from "@/components/ErrorFallback";
import ErrorFallbackV2 from "@/components/v2/ErrorFallbackV2";
import V2BottomNavV2 from "@/components/v2/V2BottomNavV2";
import V2Layout from "@/components/v2/V2Layout";
import ErrorTopBarV2 from "@/pages/v2/error/ErrorTopBarV2";

export default function V2ErrorBoundaryFallback(props: ErrorFallbackProps) {
  return (
    <V2Layout topBar={<ErrorTopBarV2 />} bottomBar={<V2BottomNavV2 />}>
      <ErrorFallbackV2 {...props} />
    </V2Layout>
  );
}
