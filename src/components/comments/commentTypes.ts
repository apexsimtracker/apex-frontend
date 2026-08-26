export type ThreadCommentAuthor = {
  id?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export type ThreadComment = {
  id: string;
  body: string;
  createdAt: string;
  originalBody?: string | null;
  editedAt?: string | null;
  userId?: string;
  parentId?: string | null;
  deletedAt?: string | null;
  wasEdited?: boolean;
  isSessionOwner?: boolean;
  replyCount?: number;
  hasMoreReplies?: boolean;
  replies?: ThreadComment[];
  author?: ThreadCommentAuthor;
};
