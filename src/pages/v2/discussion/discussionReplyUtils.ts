/** Normalize reply text before submit — collapse whitespace spam while preserving readable breaks. */
export function normalizeDiscussionReplyBody(raw: string): string {
    return raw
        .trim()
        .replace(/[^\S\n]+/g, " ")
        .replace(/\n{4,}/g, "\n\n\n");
}

export const DISCUSSION_REPLY_MAX_LENGTH = 2000;

export const DISCUSSION_REPLY_NEAR_LIMIT = 1500;
