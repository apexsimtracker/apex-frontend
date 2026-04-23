import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RotateCcw, ListChecks, LayoutList } from "lucide-react";

const IS_DEV = import.meta.env.DEV;

const ONBOARDED_KEY = "apex_onboarded";

function clearLocalStorageFlags() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(ONBOARDED_KEY);
  // Optionally clear other app flags if added later
}

export default function QAPage() {
  const navigate = useNavigate();

  if (!IS_DEV) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-2">
          <ListChecks className="size-6 text-white/60" />
          <h1 className="text-xl font-semibold text-foreground">QA Checklist</h1>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearLocalStorageFlags}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <RotateCcw className="mr-1.5 size-4" />
            Clear localStorage flags
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/sessions")}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <LayoutList className="mr-1.5 size-4" />
            Back to Sessions
          </Button>
        </div>

        <nav className="space-y-8">
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
              Auth
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/signup" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Signup
                </Link>
                <span className="ml-1 text-white/40">(/signup)</span>
              </li>
              <li>
                <Link to="/login" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Login
                </Link>
                <span className="ml-1 text-white/40">(/login)</span>
              </li>
              <li>
                <Link to="/profile" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Profile (when signed in)
                </Link>
                <span className="ml-1 text-white/40">(/profile)</span>
              </li>
              <li>
                <Link to="/settings" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Logout
                </Link>
                <span className="ml-1 text-white/40">(Settings → Log out)</span>
              </li>
              <li>
                <a href="/settings#change-password" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Change password
                </a>
                <span className="ml-1 text-white/40">(Settings #change-password)</span>
              </li>
              <li>
                <a href="/settings#delete-account" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Delete account
                </a>
                <span className="ml-1 text-white/40">(Settings #delete-account)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
              Sessions
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/upload" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Upload session
                </Link>
                <span className="ml-1 text-white/40">(/upload)</span>
              </li>
              <li>
                <Link to="/manual" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Log manual activity
                </Link>
                <span className="ml-1 text-white/40">(/manual)</span>
              </li>
              <li>
                <Link to="/manual" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Edit manual activity
                </Link>
                <span className="ml-1 text-white/40">(/sessions/:id/edit or /manual/:sessionId/edit)</span>
              </li>
              <li>
                <Link to="/sessions" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Session detail
                </Link>
                <span className="ml-1 text-white/40">(/sessions, then open any session → /sessions/:id)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
              Monetization
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <span className="text-white/80">Lap charts preview (FREE)</span>
                <span className="ml-1 text-white/40">(Open session as FREE user → charts show teaser)</span>
              </li>
              <li>
                <Link to="/upgrade" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Upgrade page
                </Link>
                <span className="ml-1 text-white/40">(/upgrade)</span>
              </li>
              <li>
                <Link to="/agent" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Agent page
                </Link>
                <span className="ml-1 text-white/40">(/agent)</span>
              </li>
              <li>
                <span className="text-white/80">Agent download (PRO)</span>
                <span className="ml-1 text-white/40">(/agent when PRO → Download button)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
              Community
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/community" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Discussions list
                </Link>
                <span className="ml-1 text-white/40">(/community)</span>
              </li>
              <li>
                <span className="text-white/80">Create post</span>
                <span className="ml-1 text-white/40">(Community → New discussion)</span>
              </li>
              <li>
                <span className="text-white/80">Comment</span>
                <span className="ml-1 text-white/40">(Open discussion → add comment)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
              Leaderboards / Challenges
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/leaderboards" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Leaderboard page
                </Link>
                <span className="ml-1 text-white/40">(/leaderboards)</span>
              </li>
              <li>
                <Link to="/challenges" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Join challenge
                </Link>
                <span className="ml-1 text-white/40">(/challenges)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
              System
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/settings" className="text-white/80 underline underline-offset-2 hover:text-white">
                  Settings — status block
                </Link>
                <span className="ml-1 text-white/40">(/settings → System Status section)</span>
              </li>
            </ul>
          </section>
        </nav>
      </div>
    </div>
  );
}
