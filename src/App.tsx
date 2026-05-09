import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { Layout } from "./components/Layout";
import { LoadingState } from "./components/LoadingState";
import { categories } from "./lib/constants";
import { isSupabaseConfigured, requireSupabase, supabaseConfigError } from "./lib/supabaseClient";
import {
  friendlyError,
  loadAppData,
  normalizeUsername,
  uploadPublicImage,
} from "./lib/supabaseData";
import type {
  AppNotice,
  Block,
  CreatePostInput,
  Follow,
  PostStatus,
  PostWithMeta,
  ProfileInput,
  Rating,
  Report,
  ReportStatus,
  UpdatePostInput,
  UserStatus,
  VybzProfile,
} from "./lib/types";
import { AdminModeration } from "./routes/AdminModeration";
import { CreatePost } from "./routes/CreatePost";
import { Explore } from "./routes/Explore";
import { Feed } from "./routes/Feed";
import { Login } from "./routes/Login";
import { Onboarding } from "./routes/Onboarding";
import { PostDetail } from "./routes/PostDetail";
import { Profile } from "./routes/Profile";
import { Settings } from "./routes/Settings";
import { Stars } from "./routes/Stars";
import { Welcome } from "./routes/Welcome";

function createPlaceholderProfile(session: Session | null): VybzProfile {
  const now = new Date().toISOString();
  const emailName = session?.user.email?.split("@")[0] ?? "";

  return {
    id: session?.user.id ?? "",
    username: normalizeUsername(emailName) || "new_vyber",
    displayName: emailName || "New Vyber",
    bio: "",
    avatarUrl: null,
    vibeColor: "#39FF88",
    status: "active",
    isAdmin: false,
    publicScoreEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

type LayoutGuardProps = {
  session: Session | null;
  profile: VybzProfile | null;
  currentUser: VybzProfile;
  authReady: boolean;
  dataLoading: boolean;
  profileReady: boolean;
  requireProfile: boolean;
  notice: AppNotice | null;
  onClearNotice: () => void;
};

function LayoutGuard({
  session,
  profile,
  currentUser,
  authReady,
  dataLoading,
  profileReady,
  requireProfile,
  notice,
  onClearNotice,
}: LayoutGuardProps) {
  if (!authReady || dataLoading || !profileReady) {
    return <LoadingState />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && !profile) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <Layout
      currentUser={currentUser}
      isSupabaseConfigured={isSupabaseConfigured}
      notice={notice}
      onClearNotice={onClearNotice}
    />
  );
}

function MissingEnvScreen() {
  return (
    <main className="auth-screen">
      <section className="auth-card">
        <img src="/icons/icon.svg" alt="" />
        <p className="eyebrow">Setup needed</p>
        <h1>Connect Supabase</h1>
        <p className="muted-copy">{supabaseConfigError}</p>
        <div className="settings-list">
          <div className="settings-row">
            <span>
              <strong>VITE_SUPABASE_URL</strong>
              <small>Required at build time</small>
            </span>
          </div>
          <div className="settings-row">
            <span>
              <strong>VITE_SUPABASE_ANON_KEY</strong>
              <small>Required at build time</small>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

type RootRouteProps = {
  session: Session | null;
  profile: VybzProfile | null;
  authReady: boolean;
  dataLoading: boolean;
  profileReady: boolean;
};

function RootRoute({ session, profile, authReady, dataLoading, profileReady }: RootRouteProps) {
  if (!authReady || dataLoading || !profileReady) {
    return <LoadingState />;
  }

  if (session && profile) {
    return <Navigate to="/feed" replace />;
  }

  if (session && !profile) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Welcome />;
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<VybzProfile | null>(null);
  const [profiles, setProfiles] = useState<VybzProfile[]>([]);
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [notice, setNotice] = useState<AppNotice | null>(null);
  const [profileLoadedForUserId, setProfileLoadedForUserId] = useState<string | null>(null);

  const currentUser = profile ?? createPlaceholderProfile(session);
  const profileReady = !session?.user.id || profileLoadedForUserId === session.user.id;

  const refreshData = async (userId = session?.user.id) => {
    if (!userId || !isSupabaseConfigured) return;

    setDataLoading(true);
    try {
      const data = await loadAppData(userId);
      setProfile(data.profile);
      setProfiles(data.profiles);
      setPosts(data.posts);
      setRatings(data.ratings);
      setFollows(data.follows);
      setBlocks(data.blocks);
      setReports(data.reports);
      setProfileLoadedForUserId(userId);
    } catch (error) {
      setNotice({ tone: "error", message: friendlyError(error) });
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      return;
    }

    const client = requireSupabase();
    client.auth.getSession().then(({ data, error }) => {
      if (error) {
        setNotice({ tone: "error", message: friendlyError(error) });
      }

      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setProfiles([]);
        setPosts([]);
        setRatings([]);
        setFollows([]);
        setBlocks([]);
        setReports([]);
        setProfileLoadedForUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user.id) {
      setProfileLoadedForUserId(null);
      refreshData(session.user.id);
    }
  }, [session?.user.id]);

  const blockedProfileIds = useMemo(() => blocks.map((block) => block.blockedId), [blocks]);
  const blockedProfiles = useMemo(
    () => profiles.filter((item) => blockedProfileIds.includes(item.id)),
    [blockedProfileIds, profiles],
  );
  const feedPosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.status === "active" &&
          post.visibility === "public" &&
          post.author.status === "active" &&
          !blockedProfileIds.includes(post.authorId),
      ),
    [blockedProfileIds, posts],
  );
  const accessiblePosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.authorId === currentUser.id ||
          currentUser.isAdmin ||
          !blockedProfileIds.includes(post.authorId),
      ),
    [blockedProfileIds, currentUser.id, currentUser.isAdmin, posts],
  );

  const withAction = async (action: () => Promise<void>, successMessage?: string) => {
    setActionLoading(true);
    setNotice(null);

    try {
      await action();
      if (successMessage) {
        setNotice({ tone: "success", message: successMessage });
      }
    } catch (error) {
      setNotice({ tone: "error", message: friendlyError(error) });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) await refreshData(data.user.id);

      return { ok: true };
    } catch (error) {
      return { ok: false, message: friendlyError(error) };
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await requireSupabase().auth.signUp({ email, password });
      if (error) throw error;

      if (!data.session) {
        return {
          ok: true,
          message: "Check your email to confirm your account, then log in.",
        };
      }

      return { ok: true, needsOnboarding: true };
    } catch (error) {
      return { ok: false, message: friendlyError(error) };
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfile = async (input: ProfileInput, avatarFile?: File | null) => {
    if (!session?.user.id) return false;
    let saved = false;

    await withAction(async () => {
      const avatarUrl = avatarFile
        ? await uploadPublicImage("avatars", session.user.id, avatarFile)
        : profile?.avatarUrl ?? null;
      const { error } = await requireSupabase().from("profiles").upsert(
        {
          id: session.user.id,
          username: input.username,
          display_name: input.displayName.trim(),
          bio: input.bio.trim(),
          avatar_url: avatarUrl,
          vibe_color: input.vibeColor,
          public_score_enabled: input.publicScoreEnabled,
        },
        { onConflict: "id" },
      );

      if (error) throw error;
      await refreshData(session.user.id);
      saved = true;
    }, "Profile saved.");

    return saved;
  };

  const handleCreatePost = async (input: CreatePostInput) => {
    if (!session?.user.id) return null;
    let createdPostId: string | null = null;

    await withAction(async () => {
      const imageUrl = await uploadPublicImage("post-images", session.user.id, input.imageFile);
      const { data, error } = await requireSupabase()
        .from("posts")
        .insert({
          author_id: session.user.id,
          caption: input.caption.trim(),
          body: input.caption.trim(),
          image_url: imageUrl,
          category: input.category,
          mood: input.mood,
          visibility: input.visibility,
          rating_enabled: input.ratingEnabled,
          daily_vibe: input.dailyVibe,
          status: "active",
        })
        .select("id")
        .single();

      if (error) throw error;
      createdPostId = data.id;
      await refreshData(session.user.id);
    }, "Moment posted.");

    return createdPostId;
  };

  const handleUpdatePost = async (postId: string, input: UpdatePostInput) => {
    await withAction(async () => {
      const { error } = await requireSupabase()
        .from("posts")
        .update({
          caption: input.caption.trim(),
          body: input.caption.trim(),
          category: input.category,
          mood: input.mood,
          visibility: input.visibility,
          rating_enabled: input.ratingEnabled,
          daily_vibe: input.dailyVibe,
        })
        .eq("id", postId);

      if (error) throw error;
      await refreshData();
    }, "Moment updated.");
  };

  const handleDeletePost = async (postId: string) => {
    await withAction(async () => {
      const { error } = await requireSupabase().from("posts").delete().eq("id", postId);
      if (error) throw error;
      await refreshData();
    }, "Moment deleted.");
  };

  const handleRatePost = async (postId: string, value: number) => {
    if (!session?.user.id) return;
    const post = posts.find((item) => item.id === postId);

    if (!post || post.authorId === session.user.id || !post.ratingEnabled) {
      return;
    }

    if (blockedProfileIds.includes(post.authorId)) {
      setNotice({ tone: "error", message: "This post is unavailable." });
      return;
    }

    await withAction(async () => {
      const { error } = await requireSupabase().from("ratings").upsert(
        {
          post_id: postId,
          user_id: session.user.id,
          value,
        },
        { onConflict: "post_id,user_id" },
      );

      if (error) throw error;
      await refreshData(session.user.id);
    });
  };

  const handleReportPost = async (postId: string, reason: string, details: string) => {
    if (!session?.user.id) return;
    const post = posts.find((item) => item.id === postId);

    await withAction(async () => {
      const { error } = await requireSupabase().from("reports").insert({
        reporter_id: session.user.id,
        reported_post_id: postId,
        reported_user_id: post?.authorId ?? null,
        reason,
        details,
        status: "open",
      });

      if (error) throw error;
      await refreshData(session.user.id);
    }, "Report sent.");
  };

  const handleReportUser = async (profileId: string, reason: string, details: string) => {
    if (!session?.user.id) return;

    await withAction(async () => {
      const { error } = await requireSupabase().from("reports").insert({
        reporter_id: session.user.id,
        reported_post_id: null,
        reported_user_id: profileId,
        reason,
        details,
        status: "open",
      });

      if (error) throw error;
      await refreshData(session.user.id);
    }, "Report sent.");
  };

  const handleBlockToggle = async (profileId: string, isBlocked: boolean) => {
    if (!session?.user.id || profileId === session.user.id) return;

    await withAction(async () => {
      const client = requireSupabase();
      const result = isBlocked
        ? await client.from("blocks").delete().eq("blocker_id", session.user.id).eq("blocked_id", profileId)
        : await client.from("blocks").upsert(
            {
              blocker_id: session.user.id,
              blocked_id: profileId,
            },
            { onConflict: "blocker_id,blocked_id" },
          );

      if (result.error) throw result.error;

      if (!isBlocked) {
        await client.from("follows").delete().eq("follower_id", session.user.id).eq("following_id", profileId);
      }

      await refreshData(session.user.id);
    }, isBlocked ? "User unblocked." : "User blocked.");
  };

  const handleFollowToggle = async (profileId: string, isFollowing: boolean) => {
    if (!session?.user.id || profileId === session.user.id) return;

    await withAction(async () => {
      const result = isFollowing
        ? await requireSupabase()
            .from("follows")
            .delete()
            .eq("follower_id", session.user.id)
            .eq("following_id", profileId)
        : await requireSupabase().from("follows").upsert(
            {
              follower_id: session.user.id,
              following_id: profileId,
            },
            { onConflict: "follower_id,following_id" },
          );

      if (result.error) throw result.error;
      await refreshData(session.user.id);
    }, isFollowing ? "Unfollowed." : "Following.");
  };

  const recordModerationAction = async (action: string, targetPostId?: string, targetProfileId?: string) => {
    if (!session?.user.id) return;

    await requireSupabase().from("moderation_actions").insert({
      admin_id: session.user.id,
      action,
      target_post_id: targetPostId ?? null,
      target_profile_id: targetProfileId ?? null,
    });
  };

  const handlePostStatusChange = async (postId: string, status: PostStatus) => {
    if (!currentUser.isAdmin) return;

    await withAction(async () => {
      const { error } = await requireSupabase().from("posts").update({ status }).eq("id", postId);
      if (error) throw error;
      await recordModerationAction(`post_${status}`, postId);
      await refreshData();
    }, "Post status updated.");
  };

  const handleUserStatusChange = async (profileId: string, status: UserStatus) => {
    if (!currentUser.isAdmin || profileId === currentUser.id) return;

    await withAction(async () => {
      const { error } = await requireSupabase().from("profiles").update({ status }).eq("id", profileId);
      if (error) throw error;
      await recordModerationAction(`user_${status}`, undefined, profileId);
      await refreshData();
    }, "User status updated.");
  };

  const handleReportStatusChange = async (reportId: string, status: ReportStatus) => {
    if (!currentUser.isAdmin) return;

    await withAction(async () => {
      const { error } = await requireSupabase().from("reports").update({ status }).eq("id", reportId);
      if (error) throw error;
      await recordModerationAction(`report_${status}`);
      await refreshData();
    }, "Report updated.");
  };

  const handleLogout = async () => {
    await withAction(async () => {
      const { error } = await requireSupabase().auth.signOut();
      if (error) throw error;
    });
  };

  const handleDeleteAccountRequest = async () => {
    if (!session?.user.id) return;

    await withAction(async () => {
      const { error } = await requireSupabase().from("delete_account_requests").upsert(
        {
          user_id: session.user.id,
          status: "open",
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;
    }, "Deletion request sent.");
  };

  const sharedLayoutProps = {
    session,
    profile,
    currentUser,
    authReady,
    dataLoading,
    profileReady,
    notice,
    onClearNotice: () => setNotice(null),
  };

  if (!isSupabaseConfigured) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<MissingEnvScreen />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RootRoute
              session={session}
              profile={profile}
              authReady={authReady}
              dataLoading={dataLoading}
              profileReady={profileReady}
            />
          }
        />
        <Route
          path="/login"
          element={
            <Login
              session={session}
              hasProfile={profileReady && Boolean(profile)}
              loading={actionLoading}
              onLogin={handleLogin}
              onSignUp={handleSignUp}
            />
          }
        />
        <Route
          element={<LayoutGuard {...sharedLayoutProps} requireProfile={false} />}
        >
          <Route
            path="/onboarding"
            element={
              profile ? (
                <Navigate to="/feed" replace />
              ) : (
                <Onboarding
                  currentUser={currentUser}
                  loading={actionLoading}
                  onSave={handleSaveProfile}
                />
              )
            }
          />
        </Route>
        <Route element={<LayoutGuard {...sharedLayoutProps} requireProfile />}>
          <Route
            path="/feed"
            element={
              <Feed
                posts={feedPosts}
                currentUser={currentUser}
                onRate={handleRatePost}
                onDeletePost={handleDeletePost}
                onReportPost={handleReportPost}
              />
            }
          />
          <Route
            path="/explore"
            element={
              <Explore
                categories={categories}
                posts={feedPosts}
                currentUser={currentUser}
                onRate={handleRatePost}
              />
            }
          />
          <Route
            path="/post"
            element={
              <CreatePost
                categories={categories}
                loading={actionLoading}
                onCreate={handleCreatePost}
              />
            }
          />
          <Route
            path="/post/:postId"
            element={
              <PostDetail
                posts={accessiblePosts}
                currentUser={currentUser}
                blockedProfileIds={blockedProfileIds}
                onRate={handleRatePost}
                onReportPost={handleReportPost}
                onBlockToggle={handleBlockToggle}
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
              />
            }
          />
          <Route
            path="/stars"
            element={<Stars currentUser={currentUser} posts={accessiblePosts} ratings={ratings} />}
          />
          <Route
            path="/me"
            element={
              <Profile
                profiles={profiles}
                posts={accessiblePosts}
                currentUser={currentUser}
                blockedProfileIds={blockedProfileIds}
                follows={follows}
                onRate={handleRatePost}
                onDeletePost={handleDeletePost}
                onFollowToggle={handleFollowToggle}
                onBlockToggle={handleBlockToggle}
                onReportUser={handleReportUser}
              />
            }
          />
          <Route
            path="/profile/:profileId"
            element={
              <Profile
                profiles={profiles}
                posts={accessiblePosts}
                currentUser={currentUser}
                blockedProfileIds={blockedProfileIds}
                follows={follows}
                onRate={handleRatePost}
                onDeletePost={handleDeletePost}
                onFollowToggle={handleFollowToggle}
                onBlockToggle={handleBlockToggle}
                onReportUser={handleReportUser}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <Settings
                currentUser={currentUser}
                blockedProfiles={blockedProfiles}
                isSupabaseConfigured={isSupabaseConfigured}
                loading={actionLoading}
                onSaveProfile={handleSaveProfile}
                onUnblock={(profileId) => handleBlockToggle(profileId, true)}
                onLogout={handleLogout}
                onDeleteAccountRequest={handleDeleteAccountRequest}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <AdminModeration
                currentUser={currentUser}
                posts={accessiblePosts}
                profiles={profiles}
                reports={reports}
                onPostStatusChange={handlePostStatusChange}
                onUserStatusChange={handleUserStatusChange}
                onReportStatusChange={handleReportStatusChange}
              />
            }
          />
        </Route>
        <Route path="*" element={<Navigate to={session ? "/feed" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
