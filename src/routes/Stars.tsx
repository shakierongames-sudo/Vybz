import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Trophy } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { StarRating } from "../components/StarRating";
import type { ActivityNotification, PostWithMeta, Rating, VybzProfile } from "../lib/types";

type StarsProps = {
  currentUser: VybzProfile;
  posts: PostWithMeta[];
  ratings: Rating[];
  activityNotifications: ActivityNotification[];
  profiles: VybzProfile[];
  unreadActivityCount: number;
  onActivityOpen: () => void;
  onMarkAllActivityRead: () => Promise<void>;
};

function isToday(dateValue: string) {
  return new Date(dateValue).toDateString() === new Date().toDateString();
}

function formatActivityTime(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

export function Stars({
  currentUser,
  posts,
  ratings,
  activityNotifications,
  profiles,
  unreadActivityCount,
  onActivityOpen,
  onMarkAllActivityRead,
}: StarsProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "activity">("stats");
  const openedActivity = useRef(false);
  const myPosts = posts.filter((post) => post.authorId === currentUser.id);
  const myPostIds = new Set(myPosts.map((post) => post.id));
  const receivedRatings = ratings.filter((rating) => myPostIds.has(rating.postId));
  const totalRatingsReceived = receivedRatings.length;
  const averagePostRating =
    totalRatingsReceived > 0
      ? receivedRatings.reduce((total, rating) => total + rating.value, 0) / totalRatingsReceived
      : 0;
  const bestRatedPost = [...myPosts].sort((a, b) => b.averageRating - a.averageRating)[0];
  const mostRatedPost = [...myPosts].sort((a, b) => b.ratingCount - a.ratingCount)[0];
  const dailyRatings = receivedRatings.filter((rating) => isToday(rating.createdAt));
  const dailyVibeScore =
    dailyRatings.length > 0
      ? dailyRatings.reduce((total, rating) => total + rating.value, 0) / dailyRatings.length
      : 0;
  const categoryBreakdown = myPosts.reduce<Record<string, { count: number; average: number }>>((acc, post) => {
    const existing = acc[post.category] ?? { count: 0, average: 0 };
    const nextCount = existing.count + post.ratingCount;
    const nextTotal = existing.average * existing.count + post.averageRating * post.ratingCount;

    acc[post.category] = {
      count: nextCount,
      average: nextCount ? nextTotal / nextCount : 0,
    };

    return acc;
  }, {});

  useEffect(() => {
    if (activeTab === "activity" && !openedActivity.current) {
      onActivityOpen();
      openedActivity.current = true;
    }

    if (activeTab === "stats") {
      openedActivity.current = false;
    }
  }, [activeTab, onActivityOpen]);

  const findActivityLink = (item: ActivityNotification) => {
    if (item.postId) return `/post/${item.postId}`;
    if (item.actorId && profiles.some((profile) => profile.id === item.actorId)) return `/profile/${item.actorId}`;
    return "/stars";
  };

  return (
    <section className="content-stack">
      <div className="segmented-control" role="tablist" aria-label="Stars sections">
        <button
          type="button"
          className={activeTab === "stats" ? "is-active" : ""}
          onClick={() => setActiveTab("stats")}
        >
          Stats
        </button>
        <button
          type="button"
          className={activeTab === "activity" ? "is-active" : ""}
          onClick={() => setActiveTab("activity")}
        >
          Activity
          {unreadActivityCount ? <span>{unreadActivityCount}</span> : null}
        </button>
      </div>

      {activeTab === "stats" ? (
        <StatsPanel
          myPosts={myPosts}
          totalRatingsReceived={totalRatingsReceived}
          averagePostRating={averagePostRating}
          dailyVibeScore={dailyVibeScore}
          bestRatedPost={bestRatedPost}
          mostRatedPost={mostRatedPost}
          categoryBreakdown={categoryBreakdown}
        />
      ) : (
        <section className="content-stack">
          <div className="activity-toolbar">
            <span>
              <Bell size={18} aria-hidden="true" />
              {unreadActivityCount ? `${unreadActivityCount} unread` : "All caught up"}
            </span>
            <button
              type="button"
              className="ghost-button"
              onClick={onMarkAllActivityRead}
              disabled={!unreadActivityCount}
            >
              <CheckCheck size={17} aria-hidden="true" />
              Mark all read
            </button>
          </div>
          {activityNotifications.length ? (
            <div className="activity-list">
              {activityNotifications.map((item) => (
                <Link
                  key={item.id}
                  className={`activity-item ${item.readAt ? "" : "is-unread"}`}
                  to={findActivityLink(item)}
                >
                  <span className="activity-dot" aria-hidden="true" />
                  <span>
                    <strong>{item.title}</strong>
                    {item.body ? <small>{item.body}</small> : null}
                    <small>{formatActivityTime(item.createdAt)}</small>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No activity yet" body="Post a moment and let people rate the vibe." />
          )}
        </section>
      )}
    </section>
  );
}

type StatsPanelProps = {
  myPosts: PostWithMeta[];
  totalRatingsReceived: number;
  averagePostRating: number;
  dailyVibeScore: number;
  bestRatedPost?: PostWithMeta;
  mostRatedPost?: PostWithMeta;
  categoryBreakdown: Record<string, { count: number; average: number }>;
};

function StatsPanel({
  myPosts,
  totalRatingsReceived,
  averagePostRating,
  dailyVibeScore,
  bestRatedPost,
  mostRatedPost,
  categoryBreakdown,
}: StatsPanelProps) {
  if (!myPosts.length) {
    return (
      <EmptyState
        title="No ratings yet"
        body="Share your first post."
        action={
          <Link className="primary-button" to="/post">
            Post your first vibe
          </Link>
        }
      />
    );
  }

  return (
    <section className="content-stack">
      <div className="stat-grid">
        <div className="stat-tile">
          <Trophy size={20} aria-hidden="true" />
          <span>{totalRatingsReceived}</span>
          <small>ratings received</small>
        </div>
        <div className="stat-tile">
          <span>{averagePostRating ? averagePostRating.toFixed(1) : "0.0"}</span>
          <small>average post vibe</small>
        </div>
        <div className="stat-tile">
          <span>{dailyVibeScore ? dailyVibeScore.toFixed(1) : "0.0"}</span>
          <small>daily vibe score</small>
        </div>
        <div className="stat-tile">
          <span>{myPosts.length}</span>
          <small>moments posted</small>
        </div>
      </div>

      {bestRatedPost ? (
        <Link className="highlight-row" to={`/post/${bestRatedPost.id}`}>
          <span>
            <strong>Best-rated post</strong>
            <small>{bestRatedPost.caption || bestRatedPost.category}</small>
          </span>
          <StarRating value={Math.round(bestRatedPost.averageRating)} readOnly compact />
        </Link>
      ) : null}

      {mostRatedPost ? (
        <Link className="highlight-row" to={`/post/${mostRatedPost.id}`}>
          <span>
            <strong>Most-rated post</strong>
            <small>{mostRatedPost.caption || mostRatedPost.category}</small>
          </span>
          <span className="status-chip">{mostRatedPost.ratingCount} vibes</span>
        </Link>
      ) : null}

      <section className="moderation-section">
        <h2>Category breakdown</h2>
        {totalRatingsReceived ? (
          Object.entries(categoryBreakdown).map(([category, item]) => (
            <div key={category} className="rating-row">
              <span>
                <strong>{category}</strong>
                <small>{item.count} ratings received</small>
              </span>
              <StarRating value={Math.round(item.average)} readOnly compact />
            </div>
          ))
        ) : (
          <p className="muted-copy">No ratings yet. Share your first post.</p>
        )}
      </section>
    </section>
  );
}
