import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { StarRating } from "../components/StarRating";
import type { PostWithMeta, Rating, VybzProfile } from "../lib/types";

type StarsProps = {
  currentUser: VybzProfile;
  posts: PostWithMeta[];
  ratings: Rating[];
};

function isToday(dateValue: string) {
  return new Date(dateValue).toDateString() === new Date().toDateString();
}

export function Stars({ currentUser, posts, ratings }: StarsProps) {
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

  if (!myPosts.length) {
    return <EmptyState title="No posts yet" body="Your private vibe analytics appear after you share a moment." />;
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
        {Object.entries(categoryBreakdown).map(([category, item]) => (
          <div key={category} className="rating-row">
            <span>
              <strong>{category}</strong>
              <small>{item.count} ratings received</small>
            </span>
            <StarRating value={Math.round(item.average)} readOnly compact />
          </div>
        ))}
      </section>
    </section>
  );
}
