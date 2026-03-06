import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Eye } from "lucide-react";

// Helper to convert username to URL slug
const userNameToSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, "-");
};

// Use backend author only; no mock fallback. Empty string when missing.
function getAuthorDisplay(author: unknown): string {
  if (typeof author === "string") return author.trim();
  if (author && typeof author === "object" && "name" in author) {
    const n = (author as { name?: unknown }).name;
    return typeof n === "string" ? (n.trim() || "") : "";
  }
  return "";
}

interface DiscussionCardProps {
  id: string;
  title: string;
  excerpt: string;
  author: string | { name?: string } | unknown;
  authorAvatar?: string | null;
  category: string;
  timestamp: string;
  replies: number;
  views: number;
  isPinned?: boolean;
}

export default function DiscussionCard({
  id,
  title,
  excerpt,
  author,
  authorAvatar,
  category,
  timestamp,
  replies,
  views,
  isPinned,
}: DiscussionCardProps) {
  const navigate = useNavigate();
  const authorDisplay = getAuthorDisplay(author) || "User";
  const hasAvatar = authorAvatar && typeof authorAvatar === "string" && authorAvatar.trim().length > 0;
  const initials = authorDisplay !== "User" ? authorDisplay.slice(0, 2).toUpperCase() : "?";

  return (
    <Link to={`/discussion/${id}`}>
      <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 overflow-hidden shadow-none hover:shadow-sm active:bg-card/30 active:shadow-md transition-all duration-300 cursor-pointer mb-6">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-white/3">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/user/${userNameToSlug(authorDisplay)}`);
              }}
              className="flex items-center gap-2 sm:gap-3 flex-1 hover:opacity-80 transition-opacity group text-left"
            >
              {hasAvatar ? (
                <img
                  src={authorAvatar!}
                  alt={authorDisplay}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover group-hover:ring-1.5 group-hover:ring-primary transition-all flex-shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:ring-1.5 group-hover:ring-primary transition-all text-white/70 text-xs font-medium"
                  aria-label={`Avatar for ${authorDisplay}`}
                >
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white group-hover:text-primary transition-colors text-xs sm:text-sm">
                  {authorDisplay}
                </p>
                <p className="text-xs text-white/50 mt-0.5">{timestamp}</p>
              </div>
            </button>
            {isPinned && (
              <div
                className="text-xs sm:text-sm flex-shrink-0"
                style={{ color: "rgb(240, 28, 28)" }}
              >
                <span>📌</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-5 py-4 sm:py-5">
          {/* Category */}
          <div className="mb-3 flex items-center gap-1.5">
            <span className="inline-block px-2 py-1 text-white/60 rounded-md text-xs font-medium bg-white/2 ml-0">
              {category}
            </span>
            {isPinned && (
              <span
                className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-[rgba(240,28,28,0.06)] text-[rgb(240,28,28)]"
              >
                Pinned
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="text-xs text-white/60 line-clamp-2 mb-3 leading-relaxed">
            {excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-4 text-xs text-white/50">
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span className="font-medium">{replies ?? 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span className="font-medium">{views ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
