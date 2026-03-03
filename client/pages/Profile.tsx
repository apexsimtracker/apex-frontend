import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { MeResponse } from "@/auth/api";
import { clearToken } from "@/auth/token";
import { API_BASE, getProfileSummary, type ProfileSummary } from "@/lib/api";
import { ProfileView } from "@/components/ProfileView";

const emptyBuckets = {
  Mon: 0,
  Tue: 0,
  Wed: 0,
  Thu: 0,
  Fri: 0,
  Sat: 0,
  Sun: 0,
};

/** Resolve display name for the current account (works for any account: displayName, name, or email). */
function getAccountDisplayName(user: { displayName?: string; name?: string; email?: string }): string {
  const n = (user.displayName ?? user.name)?.trim();
  if (n && n.length > 0) return n;
  const e = user.email?.trim();
  if (e && e.length > 0) return e;
  return "User";
}

function profileSummaryFromMe(me: MeResponse): ProfileSummary {
  const u = me.user;
  return {
    user: {
      id: u.id,
      displayName: getAccountDisplayName(u),
      streakDays: 0,
      tagline: undefined,
      level: undefined,
      levelProgressPct: undefined,
    },
    totals: {
      races: 0,
      wins: null,
      podiums: null,
      poles: null,
      fastestLaps: 0,
      avgFinish: null,
    },
    weekly: {
      buckets: emptyBuckets,
      totalRaces: 0,
      wins: null,
      avgFinish: null,
      totalKm: null,
    },
    mostPlayed: [],
    raceHistory: [],
    statsByGame: [],
    insight: null,
  };
}

export default function Profile() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("apex_token");
    fetch(`${API_BASE}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data: MeResponse | null) => {
        setMe(data);
        if (data?.user) {
          getProfileSummary()
            .then(setProfile)
            .catch(() => setProfile(profileSummaryFromMe(data)));
        }
      })
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = () => {
    clearToken();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  const user = me?.user;
  if (!me || !user) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 sm:p-8 text-center max-w-md">
          <p className="text-white/80 mb-4">Not signed in.</p>
          <Link
            to="/login"
            className="inline-block px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const accountName = getAccountDisplayName(user);
  const displayProfile: ProfileSummary = profile
    ? { ...profile, user: { ...profile.user, displayName: accountName } }
    : profileSummaryFromMe(me);

  const memberSince =
    user.createdAt &&
    (() => {
      try {
        const d = new Date(user.createdAt);
        return isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
      } catch {
        return null;
      }
    })();

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <ProfileView profile={displayProfile} />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-end gap-2">
          {memberSince && (
            <p className="text-sm text-white/50">Member since {memberSince}</p>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
