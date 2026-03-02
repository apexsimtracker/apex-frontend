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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-2 mb-8">
          <ListChecks className="w-6 h-6 text-white/60" />
          <h1 className="text-xl font-semibold text-foreground">QA Checklist</h1>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearLocalStorageFlags}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Clear localStorage flags
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/sessions")}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <LayoutList className="w-4 h-4 mr-1.5" />
            Back to Sessions
          </Button>
        </div>

        <nav className="space-y-8">
          <section>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
              Auth
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/settings" className="text-white/80 hover:text-white underline underline-offset-2">
                  Signup
                </Link>
                <span className="text-white/40 ml-1">(Settings, when logged out)</span>
              </li>
              <li>
                <Link to="/settings" className="text-white/80 hover:text-white underline underline-offset-2">
                  Login / Logout
                </Link>
                <span className="text-white/40 ml-1">(Settings)</span>
              </li>
              <li>
                <a href="/settings#change-password" className="text-white/80 hover:text-white underline underline-offset-2">
                  Change password
                </a>
                <span className="text-white/40 ml-1">(Settings #change-password)</span>
              </li>
              <li>
                <a href="/settings#delete-account" className="text-white/80 hover:text-white underline underline-offset-2">
                  Delete account
                </a>
                <span className="text-white/40 ml-1">(Settings #delete-account)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
              Sessions
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/upload" className="text-white/80 hover:text-white underline underline-offset-2">
                  Upload session
                </Link>
                <span className="text-white/40 ml-1">(/upload)</span>
              </li>
              <li>
                <Link to="/manual" className="text-white/80 hover:text-white underline underline-offset-2">
                  Log manual activity
                </Link>
                <span className="text-white/40 ml-1">(/manual)</span>
              </li>
              <li>
                <Link to="/manual" className="text-white/80 hover:text-white underline underline-offset-2">
                  Edit manual activity
                </Link>
                <span className="text-white/40 ml-1">(/manual/:sessionId/edit after creating one)</span>
              </li>
              <li>
                <Link to="/sessions" className="text-white/80 hover:text-white underline underline-offset-2">
                  Session detail
                </Link>
                <span className="text-white/40 ml-1">(/sessions, then open any session → /sessions/:id)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
              Monetization
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <span className="text-white/80">Lap charts preview (FREE)</span>
                <span className="text-white/40 ml-1">(Open session as FREE user → charts show teaser)</span>
              </li>
              <li>
                <Link to="/upgrade" className="text-white/80 hover:text-white underline underline-offset-2">
                  Upgrade page
                </Link>
                <span className="text-white/40 ml-1">(/upgrade)</span>
              </li>
              <li>
                <Link to="/agent" className="text-white/80 hover:text-white underline underline-offset-2">
                  Agent page
                </Link>
                <span className="text-white/40 ml-1">(/agent)</span>
              </li>
              <li>
                <span className="text-white/80">Agent download (PRO)</span>
                <span className="text-white/40 ml-1">(/agent when PRO → Download button)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
              Community
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/community" className="text-white/80 hover:text-white underline underline-offset-2">
                  Discussions list
                </Link>
                <span className="text-white/40 ml-1">(/community)</span>
              </li>
              <li>
                <span className="text-white/80">Create post</span>
                <span className="text-white/40 ml-1">(Community → New discussion)</span>
              </li>
              <li>
                <span className="text-white/80">Comment</span>
                <span className="text-white/40 ml-1">(Open discussion → add comment)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
              Leaderboards / Challenges
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/leaderboards" className="text-white/80 hover:text-white underline underline-offset-2">
                  Leaderboard page
                </Link>
                <span className="text-white/40 ml-1">(/leaderboards)</span>
              </li>
              <li>
                <Link to="/challenges" className="text-white/80 hover:text-white underline underline-offset-2">
                  Join challenge
                </Link>
                <span className="text-white/40 ml-1">(/challenges)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
              System
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/settings" className="text-white/80 hover:text-white underline underline-offset-2">
                  Settings — status block
                </Link>
                <span className="text-white/40 ml-1">(/settings → System Status section)</span>
              </li>
            </ul>
          </section>
        </nav>
      </div>
    </div>
  );
}
