import type { ReportTargetType } from "@/lib/api/ugcModeration";

type UgcOverflowMenuPolicyInput = {
  signedIn: boolean;
  isOwn: boolean;
  hideTargetContentId?: string | null;
  authorId?: string | null;
  showBlock: boolean;
  reportEnabled: boolean;
  reportContentType: ReportTargetType;
  reportTargetContentId?: string | null;
  reportTargetUserId?: string | null;
};

export type UgcOverflowMenuPolicy = {
  canHide: boolean;
  canBlock: boolean;
  canReport: boolean;
  canRender: boolean;
};

export function getUgcOverflowMenuPolicy({
  signedIn,
  isOwn,
  hideTargetContentId,
  authorId,
  showBlock,
  reportEnabled,
  reportContentType,
  reportTargetContentId,
  reportTargetUserId,
}: UgcOverflowMenuPolicyInput): UgcOverflowMenuPolicy {
  const canHide = Boolean(hideTargetContentId);
  const canBlock = showBlock && Boolean(authorId);
  const canReport =
    reportEnabled &&
    (reportContentType === "USER"
      ? Boolean(reportTargetUserId)
      : Boolean(reportTargetContentId));

  return {
    canHide,
    canBlock,
    canReport,
    canRender:
      signedIn && !isOwn && (canHide || canBlock || canReport),
  };
}
