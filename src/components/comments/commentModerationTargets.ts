import type {
  HiddenContentType,
  ReportTargetType,
} from "@/lib/api/ugcModeration";

type CommentModerationTarget = {
  contentType: HiddenContentType;
  targetContentId: string;
};

type CommentReportTarget = {
  contentType: ReportTargetType;
  targetContentId: string;
  targetUserId?: string;
};

export function commentModerationTargets(params: {
  variant: "discussion" | "session";
  commentId: string;
  authorId?: string | null;
  deleted: boolean;
}): {
  hide?: CommentModerationTarget;
  report?: CommentReportTarget;
} {
  if (params.deleted) return {};
  const contentType: HiddenContentType =
    params.variant === "discussion"
      ? "DISCUSSION_COMMENT"
      : "SESSION_COMMENT";
  const target = {
    contentType,
    targetContentId: params.commentId,
  };
  return {
    hide: target,
    report: {
      ...target,
      targetUserId: params.authorId || undefined,
    },
  };
}
