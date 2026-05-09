import { Home, PlusCircle, Search, Star, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/feed", label: "Feed", icon: Home },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/post", label: "Post", icon: PlusCircle },
  { to: "/stars", label: "Stars", icon: Star },
  { to: "/me", label: "Me", icon: UserRound },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {tabs.map((tab) => {
        const Icon = tab.icon;

        return (
          <NavLink key={tab.to} to={tab.to} className="bottom-nav__link">
            <Icon size={22} aria-hidden="true" />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
