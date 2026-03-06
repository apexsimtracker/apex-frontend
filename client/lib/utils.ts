import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Author display for discussion posts. Reads author.displayName first, then fallbacks. No mock values (e.g. "Local Driver").
 *  Fallback order: author.displayName → author.name → email username (part before @) → "User". */
export function getDiscussionAuthorDisplay(author: unknown): string {
  if (typeof author === "string") {
    const s = author.trim();
    return s || "User";
  }
  if (author && typeof author === "object") {
    const o = author as { displayName?: string; name?: string; email?: string };
    const displayName = typeof o.displayName === "string" ? o.displayName.trim() : "";
    if (displayName) return displayName;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    if (name) return name;
    const email = typeof o.email === "string" ? o.email.trim() : "";
    if (email) {
      const beforeAt = email.split("@")[0]?.trim();
      if (beforeAt) return beforeAt;
    }
  }
  return "User";
}

/** Initials from the final display name: first 2 chars, or single char for short names (e.g. "User" → "U"). */
export function getDiscussionAuthorInitials(displayName: string): string {
  const s = displayName.trim();
  if (!s) return "?";
  if (s.length >= 2) return s.slice(0, 2).toUpperCase();
  return s.slice(0, 1).toUpperCase();
}

export const formatLapMs = (ms: number | null | undefined): string => {
  if (!ms || !Number.isFinite(ms)) return "—";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${millis
    .toString()
    .padStart(3, "0")}`;
};

/**
 * Format milliseconds as mm:ss.mmm (zero-padded minutes) for lap time input preview.
 * Example: 92456 -> "01:32.456"
 */
export function formatMsToLapTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "00:00.000";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
}

/**
 * Parse lap time string to milliseconds.
 * Accepts: m:ss.mmm, mm:ss.mmm, ss.mmm, m:ss (.000), ss (.000).
 * Returns null for empty, invalid, negative, seconds >= 60 (with minutes), or ms not 0–999.
 */
export function parseLapTimeToMs(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!normalized) return null;
  if (/[^\d:.]/.test(normalized)) return null;

  const parts = normalized.split(":");
  if (parts.length === 1) {
    const secMs = parts[0];
    if (secMs.includes(".")) {
      const [secStr, msStr] = secMs.split(".");
      const secs = parseInt(secStr, 10);
      if (msStr.length > 3 || /[^\d]/.test(msStr)) return null;
      const msPart = msStr.padEnd(3, "0").slice(0, 3);
      const ms = parseInt(msPart, 10);
      if (ms < 0 || ms > 999 || !Number.isFinite(secs) || secs < 0) return null;
      return secs * 1000 + ms;
    }
    const secs = parseInt(secMs, 10);
    if (!Number.isFinite(secs) || secs < 0) return null;
    return secs * 1000;
  }

  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secMs = parts[1];
    if (!Number.isFinite(mins) || mins < 0) return null;
    if (secMs.includes(".")) {
      const [secStr, msStr] = secMs.split(".");
      const secs = parseInt(secStr, 10);
      if (msStr.length > 3 || /[^\d]/.test(msStr)) return null;
      const msPart = msStr.padEnd(3, "0").slice(0, 3);
      const ms = parseInt(msPart, 10);
      if (
        !Number.isFinite(secs) ||
        secs < 0 ||
        secs >= 60 ||
        ms < 0 ||
        ms > 999
      )
        return null;
      return mins * 60000 + secs * 1000 + ms;
    }
    const secs = parseInt(secMs, 10);
    if (!Number.isFinite(secs) || secs < 0 || secs >= 60) return null;
    return mins * 60000 + secs * 1000;
  }

  return null;
}

export const formatLapDelta = (ms: number | null | undefined): string => {
  if (!ms || !Number.isFinite(ms)) return "—";
  return `${(ms / 1000).toFixed(3)}s`;
};

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function timeAgo(createdAt: string | Date): string {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}

/**
 * Formats raw car identifiers into human-readable titles.
 * 
 * Handles concatenated identifiers like "mercedesw12" → "Mercedes W12"
 * Preserves already well-formatted names (e.g., "Ferrari 488 GT3").
 * Handles null/undefined safely.
 */
export function formatCarName(car: string | null | undefined): string {
  if (!car || car === "—") return "Unknown Car";

  // Known model codes to detect and extract (longer patterns first)
  const modelCodes = [
    "W15", "W14", "W13", "W12", "W11", "W10", "W09", "W08", "W07", "W06", "W05",
    "RB20", "RB19", "RB18", "RB17", "RB16", "RB15",
    "SF-24", "SF-23", "SF-22", "SF-21", "SF24", "SF23", "SF22", "SF21",
    "VF-24", "VF-23", "VF-22", "VF24", "VF23", "VF22",
    "MCL38", "MCL37", "MCL36", "MCL35",
    "AMR24", "AMR23", "AMR22", "AMR21",
    "A523", "A522", "A521", "A520",
    "GT3RS", "GT2RS", "GT4RS", "GT3R", "GT2R",
    "LMP1", "LMP2", "LMP3",
    "GTR", "GT-R", "GT1", "GT2", "GT3", "GT4", "GTE",
    "RSR", "RS", "AMG", "BMW", "LMS",
    "GTE", "GTLM", "GTP",
    "DBR9", "M6", "M4", "M3", "M8",
    "R8", "C8", "C7", "C6",
    "P1", "488", "458", "911", "991", "992",
    "650S", "720S", "765LT",
  ];
  
  const acronyms = new Set(modelCodes.map(c => c.toUpperCase()));

  let result = car;
  
  // If no spaces, try to extract known model codes from the end
  if (!car.includes(" ")) {
    for (const code of modelCodes) {
      const regex = new RegExp(`(${code})$`, "i");
      if (regex.test(result)) {
        result = result.replace(regex, ` ${code.toUpperCase()}`);
        break;
      }
    }
  }

  // Split and process words
  const words = result.split(/\s+/);
  
  const processed = words.map((word) => {
    if (!word) return "";
    
    const upper = word.toUpperCase();
    
    // Pure numbers stay as-is
    if (/^\d+$/.test(word)) return word;
    
    // Known acronym/code - uppercase it
    if (acronyms.has(upper)) return upper;
    
    // Check for hyphenated words like "SF-24"
    if (word.includes("-")) {
      return word.split("-").map(part => {
        const partUpper = part.toUpperCase();
        if (acronyms.has(partUpper)) return partUpper;
        if (/^\d+$/.test(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join("-");
    }
    
    // Standard capitalization (preserve existing case if it looks intentional)
    if (word === word.toUpperCase() && word.length <= 4) {
      return word;
    }
    
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  return processed.filter(Boolean).join(" ") || "Unknown Car";
}
