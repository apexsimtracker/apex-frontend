import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  RedditIcon,
  RedditShareButton,
  TelegramIcon,
  TelegramShareButton,
  ThreadsIcon,
  ThreadsShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
  XShareButton,
} from "react-share";
import { cn } from "@/lib/utils";
import { AppBaseModal } from "@/components/app-ui/AppBaseModal";

const ICON_SIZE = 32;
const ROW_CLASS =
  "flex w-full items-center gap-3 rounded-apex-sm border border-apex-outline-variant/20 bg-apex-surface-container-low px-3 py-2.5 text-left font-apex-body text-sm text-apex-on-surface transition-colors hover:bg-apex-surface-container";

function splitShareHeadline(shareText: string): {
  headline: string;
  rest: string;
} {
  const idx = shareText.indexOf("\n");
  if (idx === -1) return { headline: shareText, rest: "" };
  return {
    headline: shareText.slice(0, idx),
    rest: shareText.slice(idx + 1).trimEnd(),
  };
}

/** X / Twitter post limit; library appends a separator and the URL after `title`. */
function truncateForX(title: string, shareUrl: string): string {
  const overhead = shareUrl.length + 2;
  const maxTitle = Math.max(0, 280 - overhead);
  if (title.length <= maxTitle) return title;
  if (maxTitle <= 1) return "…";
  return `${title.slice(0, maxTitle - 1)}…`;
}

const REDDIT_TITLE_MAX = 300;

function truncateRedditTitle(title: string): string {
  if (title.length <= REDDIT_TITLE_MAX) return title;
  if (REDDIT_TITLE_MAX <= 1) return "…";
  return `${title.slice(0, REDDIT_TITLE_MAX - 1)}…`;
}

function fullShareClipboardText(shareText: string, shareUrl: string): string {
  return `${shareText}\n\n${shareUrl}`;
}

/** LinkedIn share flow is URL-only; we copy text first so the user can paste in the composer. */
function openLinkedInShare(shareUrl: string) {
  const u = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  window.open(u, "_blank", "noopener,noreferrer,width=750,height=600");
}

export interface SessionShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  shareText: string;
}

export default function SessionShareModal({
  open,
  onOpenChange,
  shareUrl,
  shareText,
}: SessionShareModalProps) {
  const { headline } = splitShareHeadline(shareText);
  const [copied, setCopied] = useState(false);

  const clipboardText = fullShareClipboardText(shareText, shareUrl);

  useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(clipboardText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function copyThenOpenFacebook() {
    try {
      await navigator.clipboard.writeText(clipboardText);
    } catch {
      /* still open share; user can use Copy button below */
    }
  }

  async function copyThenOpenLinkedIn() {
    try {
      await navigator.clipboard.writeText(clipboardText);
    } catch {
      /* same */
    }
    openLinkedInShare(shareUrl);
  }

  return (
    <AppBaseModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Share session"
      description="Share this session link and summary on social media or by email."
      size="sm"
      bodyClassName="flex min-h-0 flex-col gap-5 pt-1"
    >
      <section aria-labelledby="share-prefill-heading">
        <h3
          id="share-prefill-heading"
          className="mb-2 font-apex-headline text-xs font-semibold uppercase tracking-wider text-apex-on-surface-variant"
        >
          Prefills in the app
        </h3>
        <nav
          className="flex flex-col gap-2"
          aria-label="Share options with prefilled text"
        >
          <EmailShareButton
            resetButtonStyle={false}
            className={ROW_CLASS}
            url={shareUrl}
            subject={headline}
            body={`${shareText}\n\n`}
            aria-label="Share by email"
          >
            <EmailIcon size={ICON_SIZE} round />
            <span className="font-medium">Email</span>
          </EmailShareButton>

          <RedditShareButton
            resetButtonStyle={false}
            className={ROW_CLASS}
            url={shareUrl}
            title={truncateRedditTitle(shareText)}
            aria-label="Share on Reddit"
          >
            <RedditIcon size={ICON_SIZE} round />
            <span className="font-medium">Reddit</span>
          </RedditShareButton>

          <TelegramShareButton
            resetButtonStyle={false}
            className={ROW_CLASS}
            url={shareUrl}
            title={shareText}
            aria-label="Share on Telegram"
          >
            <TelegramIcon size={ICON_SIZE} round />
            <span className="font-medium">Telegram</span>
          </TelegramShareButton>

          <ThreadsShareButton
            resetButtonStyle={false}
            className={ROW_CLASS}
            url={shareUrl}
            title={shareText}
            aria-label="Share on Threads"
          >
            <ThreadsIcon size={ICON_SIZE} round />
            <span className="font-medium">Threads</span>
          </ThreadsShareButton>

          <WhatsappShareButton
            resetButtonStyle={false}
            className={ROW_CLASS}
            url={shareUrl}
            title={shareText}
            aria-label="Share on WhatsApp"
          >
            <WhatsappIcon size={ICON_SIZE} round />
            <span className="font-medium">WhatsApp</span>
          </WhatsappShareButton>

          <XShareButton
            resetButtonStyle={false}
            className={ROW_CLASS}
            url={shareUrl}
            title={truncateForX(shareText, shareUrl)}
            aria-label="Share on X"
          >
            <XIcon size={ICON_SIZE} round />
            <span className="font-medium">X</span>
          </XShareButton>
        </nav>
      </section>

      <section aria-labelledby="share-no-prefill-heading">
        <h3
          id="share-no-prefill-heading"
          className="mb-2 font-apex-headline text-xs font-semibold uppercase tracking-wider text-apex-on-surface-variant"
        >
          Does not prefill post text
        </h3>
        <p className="mb-3 font-apex-body text-xs leading-relaxed text-apex-on-surface-variant">
          Facebook and LinkedIn open in a new tab with only your link. Your
          session details and link are copied to the clipboard first—paste into
          the post after the window opens.
        </p>
        <nav
          className="flex flex-col gap-2"
          aria-label="Share options without prefilled text"
        >
          <FacebookShareButton
            resetButtonStyle={false}
            className={ROW_CLASS}
            url={shareUrl}
            beforeOnClick={copyThenOpenFacebook}
            aria-label="Share on Facebook"
          >
            <FacebookIcon size={ICON_SIZE} round />
            <span className="font-medium">Facebook</span>
          </FacebookShareButton>

          <button
            type="button"
            className={ROW_CLASS}
            onClick={() => void copyThenOpenLinkedIn()}
            aria-label="Share on LinkedIn"
          >
            <LinkedinIcon size={ICON_SIZE} round />
            <span className="font-medium">LinkedIn</span>
          </button>
        </nav>
      </section>

      <div className="border-t border-apex-outline-variant/15 pt-4">
        <button
          type="button"
          onClick={() => void copyToClipboard()}
          className={cn(
            ROW_CLASS,
            "justify-center font-medium hover:bg-apex-surface-container-high",
          )}
          aria-label="Copy session details and link to clipboard"
        >
          {copied ? (
            <>
              <Check className="size-4 text-apex-primary" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" aria-hidden />
              Copy details to clipboard
            </>
          )}
        </button>
      </div>
    </AppBaseModal>
  );
}
