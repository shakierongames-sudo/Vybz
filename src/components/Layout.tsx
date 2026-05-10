import { Link, Outlet, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { Avatar } from "./Avatar";
import type { AppNotice, VybzProfile } from "../lib/types";

type LayoutProps = {
  currentUser: VybzProfile;
  isSupabaseConfigured: boolean;
  unreadActivityCount: number;
  notice?: AppNotice | null;
  onClearNotice?: () => void;
};

const titles: Record<string, string> = {
  "/feed": "Feed",
  "/explore": "Explore",
  "/post": "Create",
  "/stars": "Stars",
  "/me": "Profile",
  "/settings": "Settings",
  "/admin": "Moderation",
};

export function Layout({
  currentUser,
  isSupabaseConfigured,
  unreadActivityCount,
  notice,
  onClearNotice,
}: LayoutProps) {
  const location = useLocation();
  const title = titles[location.pathname] ?? "Vybz";
  const isOnboarding = location.pathname === "/onboarding";
  const homePath = isOnboarding ? "/onboarding" : "/feed";

  return (
    <div className="app-frame">
      <main className="app-shell">
        <header className="top-bar">
          <Link to={homePath} className="brand-mark" aria-label="Vybz home">
            <img src="/icons/icon.svg" alt="" />
            <span>Vybz</span>
          </Link>
          <div className="top-bar__right">
            <span className={`connection-dot ${isSupabaseConfigured ? "is-live" : ""}`}>
              {isSupabaseConfigured ? "Live" : "Setup"}
            </span>
            <Link to="/settings" className="icon-button" aria-label="Open settings">
              <Settings size={20} aria-hidden="true" />
            </Link>
            <Link to="/me" aria-label="Open profile">
              <Avatar profile={currentUser} size="sm" />
            </Link>
          </div>
        </header>
        <section className="screen-heading">
          <p className="eyebrow">{currentUser.status === "active" ? "Today's pulse" : currentUser.status}</p>
          <h1>{title}</h1>
        </section>
        {notice ? (
          <button type="button" className={`notice notice--${notice.tone}`} onClick={onClearNotice}>
            {notice.message}
          </button>
        ) : null}
        <Outlet />
      </main>
      {isOnboarding ? null : <BottomNav unreadActivityCount={unreadActivityCount} />}
    </div>
  );
}
