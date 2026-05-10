import { Home, PlusCircle, Search, Star, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/feed", label: "Feed", icon: Home },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/post", label: "Post", icon: PlusCircle },
  { to: "/stars", label: "Stars", icon: Star },
  { to: "/me", label: "Me", icon: UserRound },
];

type BottomNavProps = {
  unreadActivityCount: number;
};

export function BottomNav({ unreadActivityCount }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const showBadge = tab.to === "/stars" && unreadActivityCount > 0;

        return (
          <NavLink key={tab.to} to={tab.to} className="bottom-nav__link">
            <span className="nav-icon-wrap">
              <Icon size={22} aria-hidden="true" />
              {showBadge ? <span className="nav-badge">{Math.min(unreadActivityCount, 9)}</span> : null}
            </span>
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
