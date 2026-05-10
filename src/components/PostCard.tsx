import { Link } from "react-router-dom";
import { Clock, MessageCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { CategoryPill } from "./CategoryPill";
import { PostImage } from "./PostImage";
import { StarRating } from "./StarRating";
import type { PostWithMeta, VybzProfile } from "../lib/types";

type PostCardProps = {
  post: PostWithMeta;
  currentUser: VybzProfile;
  onRate: (postId: string, value: number) => void;
  onDelete?: (postId: string) => void;
  onReportClick?: (postId: string) => void;
};

function formatMoment(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

export function PostCard({ post, currentUser, onRate, onDelete, onReportClick }: PostCardProps) {
  const isOwnPost = post.authorId === currentUser.id;
  const canRate = !isOwnPost && currentUser.status === "active" && post.ratingEnabled;
  const statusLabel = post.status.replace("_", " ");

  return (
    <article className="post-card">
      <header className="post-card__header">
        <Link to={`/profile/${post.author.id}`} className="profile-link">
          <Avatar profile={post.author} />
          <span>
            <strong>{post.author.displayName}</strong>
            <small>@{post.author.username}</small>
          </span>
        </Link>
        <div className="post-card__meta">
          {isOwnPost && post.status !== "active" ? <span className="status-chip">{statusLabel}</span> : null}
          <CategoryPill label={post.category} />
        </div>
      </header>

      <Link to={`/post/${post.id}`} className="post-card__body">
        <PostImage src={post.imageUrl} />
        {post.caption ? <p>{post.caption}</p> : null}
      </Link>

      <div className="post-card__vibe-row">
        <div>
          <strong>{post.averageRating ? post.averageRating.toFixed(1) : "New"}</strong>
          <span>{post.ratingCount === 1 ? "1 vibe" : `${post.ratingCount} vibes`}</span>
        </div>
        {post.ratingEnabled ? (
          <StarRating
            value={post.myRating ?? Math.round(post.averageRating)}
            onChange={canRate ? (value) => onRate(post.id, value) : undefined}
            readOnly={!canRate}
            compact
          />
        ) : (
          <span>Ratings off</span>
        )}
      </div>

      <footer className="post-card__footer">
        <span>
          <Clock size={15} aria-hidden="true" />
          {formatMoment(post.createdAt)}
        </span>
        <div className="post-card__actions">
          {onReportClick && !isOwnPost ? (
            <button type="button" className="text-button" onClick={() => onReportClick(post.id)}>
              <MessageCircle size={16} aria-hidden="true" />
              Report
            </button>
          ) : null}
          {isOwnPost && onDelete ? (
            <button type="button" className="text-button danger-text" onClick={() => onDelete(post.id)}>
              <Trash2 size={16} aria-hidden="true" />
              Delete
            </button>
          ) : (
            <MoreHorizontal size={18} aria-hidden="true" className="muted-icon" />
          )}
        </div>
      </footer>
    </article>
  );
}
