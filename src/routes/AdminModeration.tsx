import { EmptyState } from "../components/EmptyState";
import type { PostStatus, PostWithMeta, Report, ReportStatus, UserStatus, VybzProfile } from "../lib/types";

type AdminModerationProps = {
  currentUser: VybzProfile;
  posts: PostWithMeta[];
  profiles: VybzProfile[];
  reports: Report[];
  onPostStatusChange: (postId: string, status: PostStatus) => Promise<void>;
  onUserStatusChange: (profileId: string, status: UserStatus) => Promise<void>;
  onReportStatusChange: (reportId: string, status: ReportStatus) => Promise<void>;
};

const userStatuses: UserStatus[] = ["active", "suspended", "banned"];

export function AdminModeration({
  currentUser,
  posts,
  profiles,
  reports,
  onPostStatusChange,
  onUserStatusChange,
  onReportStatusChange,
}: AdminModerationProps) {
  if (!currentUser.isAdmin) {
    return <EmptyState title="Admin only" body="Moderation tools are available to admin accounts." />;
  }

  return (
    <section className="content-stack">
      <div className="stat-grid">
        <div className="stat-tile">
          <span>{reports.length}</span>
          <small>open reports</small>
        </div>
        <div className="stat-tile">
          <span>{posts.filter((post) => post.status !== "active").length}</span>
          <small>flagged posts</small>
        </div>
      </div>

      <section className="moderation-section">
        <h2>Open reports</h2>
        {reports.length ? (
          reports.map((report) => {
            const post = posts.find((item) => item.id === report.reportedPostId);
            const reporter = profiles.find((profile) => profile.id === report.reporterId);
            const reportedUser = profiles.find((profile) => profile.id === report.reportedUserId);

            return (
              <article key={report.id} className="moderation-row moderation-row--stacked">
                <span>
                  <strong>{report.reason}</strong>
                  <small>
                    {reporter ? `@${reporter.username}` : "Unknown"} reported{" "}
                    {reportedUser ? `@${reportedUser.username}` : "a post"}
                  </small>
                  <small>{report.details || post?.caption || "No details added"}</small>
                </span>
                <div className="post-card__actions">
                  {post ? (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => onPostStatusChange(post.id, "removed")}
                    >
                      Remove post
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onReportStatusChange(report.id, "dismissed")}
                  >
                    Dismiss
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="muted-copy">No open reports.</p>
        )}
      </section>

      <section className="moderation-section">
        <h2>Posts</h2>
        {posts.map((post) => (
          <article key={post.id} className="moderation-row">
            <span>
              <strong>@{post.author.username}</strong>
              <small>{post.caption || post.category}</small>
            </span>
            <select
              value={post.status}
              onChange={(event) => onPostStatusChange(post.id, event.target.value as PostStatus)}
            >
              <option value="active">active</option>
              <option value="under_review">under_review</option>
              <option value="removed">removed</option>
            </select>
          </article>
        ))}
      </section>

      <section className="moderation-section">
        <h2>Users</h2>
        {profiles.map((profile) => (
          <article key={profile.id} className="moderation-row">
            <span>
              <strong>{profile.displayName}</strong>
              <small>@{profile.username} · {profile.isAdmin ? "admin" : "user"}</small>
            </span>
            <select
              value={profile.status}
              onChange={(event) => onUserStatusChange(profile.id, event.target.value as UserStatus)}
              disabled={profile.id === currentUser.id}
            >
              {userStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </article>
        ))}
      </section>
    </section>
  );
}
