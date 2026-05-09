import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { PostCard } from "../components/PostCard";
import { ReportModal } from "../components/ReportModal";
import type { PostWithMeta, VybzProfile } from "../lib/types";

type FeedProps = {
  posts: PostWithMeta[];
  currentUser: VybzProfile;
  onRate: (postId: string, value: number) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onReportPost: (postId: string, reason: string, details: string) => Promise<void>;
};

export function Feed({ posts, currentUser, onRate, onDeletePost, onReportPost }: FeedProps) {
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  return (
    <section className="content-stack">
      <div className="feed-composer-link">
        <span>What is the vibe right now?</span>
        <Link to="/post" className="icon-button" aria-label="Create post">
          <Plus size={22} aria-hidden="true" />
        </Link>
      </div>

      {posts.length ? (
        <div className="post-list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onRate={onRate}
              onDelete={onDeletePost}
              onReportClick={setReportPostId}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No moments yet"
          body="The feed will light up when public posts are available."
          action={
            <Link className="primary-button" to="/post">
              Create one
            </Link>
          }
        />
      )}

      <ReportModal
        isOpen={Boolean(reportPostId)}
        onClose={() => setReportPostId(null)}
        onSubmit={async (reason, details) => {
          if (reportPostId) await onReportPost(reportPostId, reason, details);
          setReportPostId(null);
        }}
      />
    </section>
  );
}
