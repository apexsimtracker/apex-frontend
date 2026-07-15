import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSessionDetail } from "@/features/session-detail/sessionDetailData";

/**
 * Sessions nav should highlight for the library and the current user's
 * session detail/edit routes, but not for other users' sessions.
 */
export function useSessionsNavActiveV2(): boolean {
  const location = useLocation();
  const { user } = useAuth();
  const sessionDetailMatch = location.pathname.match(
    /^\/v2\/sessions\/([^/]+)(?:\/edit)?\/?$/,
  );
  const sessionId = sessionDetailMatch?.[1] ?? "";
  const sessionDetailQuery = useQuery({
    queryKey: ["sessions", "detail", sessionId],
    queryFn: () => fetchSessionDetail(sessionId),
    enabled: Boolean(sessionId && user),
  });

  return (
    location.pathname === "/v2/sessions" ||
    (Boolean(sessionId) && sessionDetailQuery.data?.session.userId === user?.id)
  );
}
