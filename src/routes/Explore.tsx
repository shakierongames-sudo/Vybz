import { useMemo, useState } from "react";
import { Compass } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { PostCard } from "../components/PostCard";
import type { PostWithMeta, VybzProfile } from "../lib/types";

type ExploreProps = {
  categories: string[];
  posts: PostWithMeta[];
  currentUser: VybzProfile;
  onRate: (postId: string, value: number) => Promise<void>;
};

function isToday(dateValue: string) {
  return new Date(dateValue).toDateString() === new Date().toDateString();
}

export function Explore({ categories, posts, currentUser, onRate }: ExploreProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const activeCategories = ["All", ...categories];

  const publicPosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.status === "active" &&
          post.visibility === "public" &&
          (selectedCategory === "All" || post.category === selectedCategory),
      ),
    [posts, selectedCategory],
  );

  const trendingToday = useMemo(
    () =>
      [...publicPosts]
        .filter((post) => isToday(post.createdAt))
        .sort((a, b) => b.averageRating * b.ratingCount - a.averageRating * a.ratingCount)
        .slice(0, 4),
    [publicPosts],
  );

  const mostRatedToday = useMemo(
    () =>
      [...publicPosts]
        .filter((post) => isToday(post.createdAt))
        .sort((a, b) => b.ratingCount - a.ratingCount)
        .slice(0, 4),
    [publicPosts],
  );

  const newPublicMoments = useMemo(
    () => [...publicPosts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 8),
    [publicPosts],
  );

  return (
    <section className="content-stack">
      <div className="category-rail" aria-label="Explore categories">
        {activeCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-filter ${selectedCategory === category ? "is-active" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <Compass size={20} aria-hidden="true" />
          <span>{publicPosts.length}</span>
          <small>public moments</small>
        </div>
        <div className="stat-tile">
          <span>{trendingToday[0]?.averageRating.toFixed(1) ?? "0.0"}</span>
          <small>top today</small>
        </div>
      </div>

      <ExploreSection title="Trending Today" posts={trendingToday} currentUser={currentUser} onRate={onRate} />
      <ExploreSection title="Most Rated Today" posts={mostRatedToday} currentUser={currentUser} onRate={onRate} />
      <ExploreSection title="New Public Moments" posts={newPublicMoments} currentUser={currentUser} onRate={onRate} />
    </section>
  );
}

type ExploreSectionProps = {
  title: string;
  posts: PostWithMeta[];
  currentUser: VybzProfile;
  onRate: (postId: string, value: number) => Promise<void>;
};

function ExploreSection({ title, posts, currentUser, onRate }: ExploreSectionProps) {
  return (
    <section className="content-stack">
      <h2 className="section-title">{title}</h2>
      {posts.length ? (
        <div className="post-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUser={currentUser} onRate={onRate} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing here yet" body="Fresh public moments will appear here." />
      )}
    </section>
  );
}
