import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";
import { BlockButton } from "../components/BlockButton";
import { EmptyState } from "../components/EmptyState";
import { PostCard } from "../components/PostCard";
import { ReportModal } from "../components/ReportModal";
import { categories, moods } from "../lib/constants";
import type { PostVisibility, PostWithMeta, UpdatePostInput, VybzProfile } from "../lib/types";

type PostDetailProps = {
  posts: PostWithMeta[];
  currentUser: VybzProfile;
  blockedProfileIds: string[];
  onRate: (postId: string, value: number) => Promise<void>;
  onReportPost: (postId: string, reason: string, details: string) => Promise<void>;
  onBlockToggle: (profileId: string, isBlocked: boolean) => Promise<void>;
  onUpdatePost: (postId: string, input: UpdatePostInput) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
};

export function PostDetail({
  posts,
  currentUser,
  blockedProfileIds,
  onRate,
  onReportPost,
  onBlockToggle,
  onUpdatePost,
  onDeletePost,
}: PostDetailProps) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const post = posts.find((item) => item.id === postId);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [category, setCategory] = useState(post?.category ?? categories[0]);
  const [mood, setMood] = useState(post?.mood ?? moods[0]);
  const [visibility, setVisibility] = useState<PostVisibility>(post?.visibility ?? "public");
  const [ratingEnabled, setRatingEnabled] = useState(post?.ratingEnabled ?? true);
  const [dailyVibe, setDailyVibe] = useState(post?.dailyVibe ?? false);

  useEffect(() => {
    if (!post) return;

    setCaption(post.caption);
    setCategory(post.category);
    setMood(post.mood);
    setVisibility(post.visibility);
    setRatingEnabled(post.ratingEnabled);
    setDailyVibe(post.dailyVibe);
  }, [post]);

  const isOwnPost = post?.authorId === currentUser.id;
  const isBlocked = Boolean(post && blockedProfileIds.includes(post.authorId));

  const canView = useMemo(() => {
    if (!post) return false;
    if (isOwnPost || currentUser.isAdmin) return true;

    return (
      post.status === "active" &&
      post.author.status === "active" &&
      post.visibility === "public" &&
      !isBlocked
    );
  }, [currentUser.isAdmin, isBlocked, isOwnPost, post]);

  if (!post || !canView) {
    return (
      <EmptyState
        title="Moment unavailable"
        body="This moment is private, moderated, blocked, or no longer available."
        action={
          <Link className="secondary-button" to="/feed">
            Back to feed
          </Link>
        }
      />
    );
  }

  const handleEdit = async (event: FormEvent) => {
    event.preventDefault();
    await onUpdatePost(post.id, {
      caption,
      category,
      mood,
      visibility,
      ratingEnabled,
      dailyVibe,
    });
  };

  const handleDelete = async () => {
    await onDeletePost(post.id);
    navigate("/feed");
  };

  return (
    <section className="content-stack">
      <PostCard
        post={post}
        currentUser={currentUser}
        onRate={onRate}
        onDelete={isOwnPost ? handleDelete : undefined}
        onReportClick={() => setIsReportOpen(true)}
      />

      <div className="detail-actions">
        {!isOwnPost ? (
          <>
            <BlockButton isBlocked={isBlocked} onToggle={() => onBlockToggle(post.authorId, isBlocked)} />
            <button type="button" className="danger-button" onClick={() => setIsReportOpen(true)}>
              Report
            </button>
          </>
        ) : null}
      </div>

      {isOwnPost ? (
        <form className="form-card stack" onSubmit={handleEdit}>
          <label className="field">
            <span>Edit caption</span>
            <textarea rows={5} value={caption} onChange={(event) => setCaption(event.target.value)} />
          </label>
          <div className="field-grid">
            <label className="field">
              <span>Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Mood</span>
              <select value={mood} onChange={(event) => setMood(event.target.value)}>
                {moods.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Visibility</span>
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as PostVisibility)}>
              <option value="public">Public</option>
              <option value="followers">Followers</option>
            </select>
          </label>
          <label className="toggle-row">
            <span>
              <strong>Rating enabled</strong>
              <small>Let others rate this vibe</small>
            </span>
            <input
              type="checkbox"
              checked={ratingEnabled}
              onChange={(event) => setRatingEnabled(event.target.checked)}
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Daily vibe</strong>
              <small>Count this toward today's score</small>
            </span>
            <input
              type="checkbox"
              checked={dailyVibe}
              onChange={(event) => setDailyVibe(event.target.checked)}
            />
          </label>
          <div className="form-card__footer">
            <button className="secondary-button" type="button" onClick={handleDelete}>
              <Trash2 size={18} aria-hidden="true" />
              Delete
            </button>
            <button className="primary-button" type="submit">
              <Save size={18} aria-hidden="true" />
              Save
            </button>
          </div>
        </form>
      ) : null}

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={async (reason, details) => {
          await onReportPost(post.id, reason, details);
          setIsReportOpen(false);
        }}
      />
    </section>
  );
}
