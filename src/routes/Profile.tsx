import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Flag, Settings } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { BlockButton } from "../components/BlockButton";
import { EmptyState } from "../components/EmptyState";
import { PostCard } from "../components/PostCard";
import { ReportModal } from "../components/ReportModal";
import type { Follow, PostWithMeta, VybzProfile } from "../lib/types";

type ProfileProps = {
  profiles: VybzProfile[];
  posts: PostWithMeta[];
  currentUser: VybzProfile;
  blockedProfileIds: string[];
  follows: Follow[];
  onRate: (postId: string, value: number) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onFollowToggle: (profileId: string, isFollowing: boolean) => Promise<void>;
  onBlockToggle: (profileId: string, isBlocked: boolean) => Promise<void>;
  onReportUser: (profileId: string, reason: string, details: string) => Promise<void>;
};

export function Profile({
  profiles,
  posts,
  currentUser,
  blockedProfileIds,
  follows,
  onRate,
  onDeletePost,
  onFollowToggle,
  onBlockToggle,
  onReportUser,
}: ProfileProps) {
  const { profileId } = useParams();
  const profile = profiles.find((item) => item.id === (profileId ?? currentUser.id));
  const [isReportOpen, setIsReportOpen] = useState(false);
  const isOwnProfile = profile?.id === currentUser.id;
  const isBlocked = Boolean(profile && blockedProfileIds.includes(profile.id));
  const isFollowing = Boolean(
    profile && follows.some((follow) => follow.followingId === profile.id),
  );

  const canView = useMemo(() => {
    if (!profile) return false;
    if (isOwnProfile || currentUser.isAdmin) return true;

    return profile.status === "active" && !isBlocked;
  }, [currentUser.isAdmin, isBlocked, isOwnProfile, profile]);

  if (!profile || !canView) {
    return (
      <EmptyState
        title="Profile unavailable"
        body="This profile is blocked, moderated, or unavailable."
        action={
          <Link className="secondary-button" to="/feed">
            Back to feed
          </Link>
        }
      />
    );
  }

  const visiblePosts = posts.filter((post) => {
    if (post.authorId !== profile.id) return false;
    if (isOwnProfile || currentUser.isAdmin) return post.status !== "removed";
    return post.status === "active";
  });
  const publicAverage =
    profile.publicScoreEnabled && visiblePosts.length
      ? visiblePosts.reduce((total, post) => total + post.averageRating, 0) / visiblePosts.length
      : 0;

  return (
    <section className="content-stack">
      <div className="profile-card">
        <Avatar profile={profile} size="lg" />
        <div className="profile-card__copy">
          <p className="eyebrow">{profile.isAdmin ? "admin" : profile.status}</p>
          <h2>{profile.displayName}</h2>
          <p className="profile-card__username">@{profile.username}</p>
          {profile.bio ? <p className="profile-card__bio">{profile.bio}</p> : null}
          {profile.publicScoreEnabled ? (
            <p className="profile-card__score">
              {publicAverage ? `${publicAverage.toFixed(1)} public vibe` : "No public vibe yet"}
            </p>
          ) : null}
        </div>
        <div className="profile-card__actions">
          {isOwnProfile ? (
            <Link to="/settings" className="icon-button" aria-label="Open settings">
              <Settings size={19} aria-hidden="true" />
            </Link>
          ) : (
            <>
              <button
                type="button"
                className="ghost-button"
                onClick={() => onFollowToggle(profile.id, isFollowing)}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
              <BlockButton isBlocked={isBlocked} onToggle={() => onBlockToggle(profile.id, isBlocked)} />
            </>
          )}
        </div>
      </div>

      {!isOwnProfile ? (
        <button type="button" className="danger-button" onClick={() => setIsReportOpen(true)}>
          <Flag size={18} aria-hidden="true" />
          Report user
        </button>
      ) : null}

      {visiblePosts.length ? (
        <div className="post-list">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onRate={onRate}
              onDelete={isOwnProfile ? onDeletePost : undefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No posts yet"
          body={isOwnProfile ? "Post your first vibe." : "This profile has not shared a public vibe yet."}
          action={
            isOwnProfile ? (
              <Link className="primary-button" to="/post">
                Create post
              </Link>
            ) : undefined
          }
        />
      )}

      <ReportModal
        isOpen={isReportOpen}
        title="Report user"
        onClose={() => setIsReportOpen(false)}
        onSubmit={async (reason, details) => {
          await onReportUser(profile.id, reason, details);
          setIsReportOpen(false);
        }}
      />
    </section>
  );
}
