import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { SESSION_CAPTION_MAX_LENGTH } from "@/lib/validation/manualActivity";
import SessionCaption from "@/components/sessions/SessionCaption";
import { Button } from "@/components/ui/button";

type SessionCaptionEditorProps = {
  caption: string | null | undefined;
  canEdit: boolean;
  isSaving?: boolean;
  onSave: (caption: string | null) => Promise<boolean>;
  className?: string;
};

/**
 * Display + owner inline add/edit for session captions.
 */
export default function SessionCaptionEditor({
  caption,
  canEdit,
  isSaving = false,
  onSave,
  className,
}: SessionCaptionEditorProps) {
  const existing = caption?.trim() || null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(existing ?? "");

  useEffect(() => {
    if (!editing) {
      setDraft(existing ?? "");
    }
  }, [existing, editing]);

  if (!canEdit && !existing) return null;

  if (!canEdit && existing) {
    return <SessionCaption caption={existing} className={className} />;
  }

  const showComposer = !existing || editing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = draft.trim() || null;
    const ok = await onSave(next);
    if (!ok) return;
    setEditing(false);
    setDraft(next ?? "");
  }

  async function handleClear() {
    const ok = await onSave(null);
    if (!ok) return;
    setEditing(false);
    setDraft("");
  }

  return (
    <div className={cn("space-y-2", className)}>
      {existing && !editing ? (
        <div className="space-y-2">
          <SessionCaption caption={existing} />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-apex-on-surface-variant"
              onClick={() => {
                setDraft(existing);
                setEditing(true);
              }}
              disabled={isSaving}
            >
              Edit caption
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-apex-on-surface-variant"
              onClick={() => void handleClear()}
              disabled={isSaving}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {showComposer ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-apex-on-surface-variant">
            {existing ? "Edit caption" : "Add a caption"}
          </p>
          <div className="flex items-end gap-2 rounded-lg border border-apex-outline-variant/20 bg-apex-surface-container-low px-3 py-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={isSaving}
              maxLength={SESSION_CAPTION_MAX_LENGTH}
              rows={2}
              placeholder="Share what made this session special…"
              className="min-h-[2.5rem] flex-1 resize-none bg-transparent font-apex-body text-sm italic text-apex-on-surface placeholder:text-apex-on-surface-variant/60 focus:outline-none"
              aria-label="Session caption"
            />
            <button
              type="submit"
              disabled={
                isSaving ||
                draft.trim() === (existing ?? "") ||
                (!existing && !draft.trim())
              }
              className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-apex-primary text-white transition-opacity disabled:opacity-40"
              aria-label="Save caption"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </div>
          {editing && existing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setEditing(false);
                setDraft(existing);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
