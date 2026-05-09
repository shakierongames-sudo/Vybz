import type { CSSProperties } from "react";
import type { VybzProfile } from "../lib/types";

type AvatarProps = {
  profile: VybzProfile;
  size?: "sm" | "md" | "lg";
};

export function Avatar({ profile, size = "md" }: AvatarProps) {
  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`avatar avatar--${size}`}
      style={{ "--avatar-color": profile.vibeColor } as CSSProperties}
      aria-label={`${profile.displayName}'s avatar`}
    >
      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" loading="lazy" /> : <span>{initials}</span>}
    </div>
  );
}
