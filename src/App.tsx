import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { Layout } from "./components/Layout";
import { LoadingState } from "./components/LoadingState";
import { categories } from "./lib/constants";
import { isSupabaseConfigured, requireSupabase, supabaseConfigError } from "./lib/supabaseClient";
import {
  friendlyError,
  loadAppData,
  normalizeUsername,
  validateUsername,
  uploadPublicImage,
} from "./lib/supabaseData";
import {
  playActivitySound,
  playErrorSound,
  playFollowSound,
  playPostCreatedSound,
  playRateSound,
  setHapticsEnabled,
  setSoundEffectsEnabled,
  triggerHaptic,
} from "./lib/sounds";
import type {
  AppNotice,
  ActivityNotification,
  ActivityType,
  AgeGateInput,
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
    soundEffectsEnabled: true,
    hapticsEnabled: true,
    usernameUpdatedAt: null,
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
  loadError: string;
  onRetryLoad: () => void;
  unreadActivityCount: number;
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
  loadError,
  onRetryLoad,
  unreadActivityCount,
  notice,
  onClearNotice,
}: LayoutGuardProps) {
  if (loadError) {
    return <LoadTroubleScreen onRetry={onRetryLoad} />;
  }

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
      unreadActivityCount={unreadActivityCount}
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

function LoadTroubleScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="auth-screen">
      <section className="auth-card">
        <img src="/icons/icon.svg" alt="" />
        <p className="eyebrow">Loading issue</p>
        <h1>Vybz had trouble loading.</h1>
        <p className="muted-copy">Tap to retry.</p>
        <div className="stack">
          <button className="primary-button" type="button" onClick={onRetry}>
            Retry
          </button>
          <Link className="secondary-button" to="/login">
            Go to login
          </Link>
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
  loadError: string;
  onRetryLoad: () => void;
};

function RootRoute({
  session,
  profile,
  authReady,
  dataLoading,
  profileReady,
  loadError,
  onRetryLoad,
}: RootRouteProps) {
  if (loadError) {
    return <LoadTroubleScreen onRetry={onRetryLoad} />;
  }

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
  const [activityNotifications, setActivityNotifications] = useState<ActivityNotification[]>([]);
  const [notice, setNotice] = useState<AppNotice | null>(null);
  const [loadError, setLoadError] = useState("");
  const [profileLoadedForUserId, setProfileLoadedForUserId] = useState<string | null>(null);

  const currentUser = profile ?? createPlaceholderProfile(session);
  const profileReady = !session?.user.id || profileLoadedForUserId === session.user.id;
  const isRestrictedUser = currentUser.status !== "active";
  const restrictedMessage = "Your account is restricted.";
  const unreadActivityCount = activityNotifications.filter((item) => !item.readAt).length;

  const refreshData = async (userId = session?.user.id) => {
    if (!userId || !isSupabaseConfigured) return;

    setDataLoading(true);
    setLoadError("");
    try {
      const data = await loadAppData(userId);
      setProfile(data.profile);
      setProfiles(data.profiles);
      setPosts(data.posts);
      setRatings(data.ratings);
      setFollows(data.follows);
      setBlocks(data.blocks);
      setReports(data.reports);
      setActivityNotifications(data.activityNotifications);
      setProfileLoadedForUserId(userId);
    } catch (error) {
      const message = friendlyError(error);
      setLoadError(message);
      setNotice({ tone: "error", message });
      playErrorSound();
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
    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          const message = friendlyError(error);
          setLoadError(message);
          setNotice({ tone: "error", message });
        }

        setSession(data.session);
        setAuthReady(true);
      })
      .catch((error) => {
        const message = friendlyError(error);
        setLoadError(message);
        setNotice({ tone: "error", message });
        setAuthReady(true);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoadError("");
      if (!nextSession) {
        setProfile(null);
        setProfiles([]);
        setPosts([]);
        setRatings([]);
        setFollows([]);
        setBlocks([]);
        setReports([]);
        setActivityNotifications([]);
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

  useEffect(() => {
    setSoundEffectsEnabled(currentUser.soundEffectsEnabled);
    setHapticsEnabled(currentUser.hapticsEnabled);
  }, [currentUser.soundEffectsEnabled, currentUser.hapticsEnabled]);

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
      playErrorSound();
    } finally {
      setActionLoading(false);
    }
  };

  const createActivityNotification = async (input: {
    userId: string;
    actorId?: string | null;
    postId?: string | null;
    type: ActivityType;
    title: string;
    body?: string | null;
    dedupeKey: string;
  }) => {
    try {
      const { error } = await requireSupabase().from("activity_notifications").upsert(
        {
          user_id: input.userId,
          actor_id: input.actorId ?? null,
          post_id: input.postId ?? null,
          type: input.type,
          title: input.title,
          body: input.body ?? null,
          dedupe_key: input.dedupeKey,
        },
        { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
      );

      if (error) throw error;
      return true;
    } catch (error) {
      console.warn("Activity notification failed", error);
      return false;
    }
  };

  const createRatingMilestoneNotification = async (post: PostWithMeta) => {
    try {
      const { count, error } = await requireSupabase()
        .from("ratings")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post.id);

      if (error) throw error;
      if (!count || ![5, 10, 25].includes(count)) return;

      await createActivityNotification({
        userId: post.authorId,
        actorId: session?.user.id ?? null,
        postId: post.id,
        type: "post_milestone",
        title: `Your ${post.category} post got ${count} ratings.`,
        body: "The vibe is picking up.",
        dedupeKey: `post_milestone:${post.id}:${count}`,
      });
    } catch (error) {
      console.warn("Activity notification failed", error);
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
      playErrorSound();
      return { ok: false, message: friendlyError(error) };
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, ageGate: AgeGateInput) => {
    setActionLoading(true);
    try {
      const { data, error } = await requireSupabase().auth.signUp({
        email,
        password,
        options: {
          data: {
            age_gate_passed: ageGate.ageGatePassed,
            age_gate_checked_at: ageGate.ageGateCheckedAt,
            terms_accepted_at: ageGate.termsAcceptedAt,
          },
        },
      });
      if (error) throw error;

      if (!data.session) {
        return {
          ok: true,
          message: "Check your email to confirm your account, then log in.",
        };
      }

      return { ok: true, needsOnboarding: true };
    } catch (error) {
      playErrorSound();
      return { ok: false, message: friendlyError(error) };
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfile = async (input: ProfileInput, avatarFile?: File | null) => {
    if (!session?.user.id) return false;
    let saved = false;
    const nextUsername = normalizeUsername(input.username);
    const usernameError = validateUsername(nextUsername);

    if (usernameError) {
      setNotice({ tone: "error", message: usernameError });
      playErrorSound();
      return false;
    }

    await withAction(async () => {
      const avatarUrl = avatarFile
        ? await uploadPublicImage("avatars", session.user.id, avatarFile)
        : profile?.avatarUrl ?? null;
      const { error } = await requireSupabase().from("profiles").upsert(
        {
          id: session.user.id,
          username: nextUsername,
          display_name: input.displayName.trim(),
          bio: input.bio.trim(),
          avatar_url: avatarUrl,
          vibe_color: input.vibeColor,
          public_score_enabled: input.publicScoreEnabled,
          sound_effects_enabled: input.soundEffectsEnabled ?? profile?.soundEffectsEnabled ?? true,
          haptics_enabled: input.hapticsEnabled ?? profile?.hapticsEnabled ?? true,
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

    if (isRestrictedUser) {
      setNotice({ tone: "error", message: restrictedMessage });
      playErrorSound();
      return null;
    }

    let createdPostId: string | null = null;

    await withAction(async () => {
      let imageUrl = "";

      try {
        imageUrl = await uploadPublicImage("post-images", session.user.id, input.imageFile);
      } catch (error) {
        console.warn("Image upload failed", error);
        throw new Error("Image upload failed");
      }

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

      if (error || !data) {
        console.warn("Post save failed", error);
        throw new Error("Post save failed");
      }

      createdPostId = data.id;
      await createActivityNotification({
        userId: session.user.id,
        actorId: session.user.id,
        postId: data.id,
        type: "post_created",
        title: "Your post is live.",
        body: `${input.category} moment is ready for ratings.`,
        dedupeKey: `post_created:${data.id}`,
      });
      await refreshData(session.user.id);
      playPostCreatedSound();
      triggerHaptic(18);
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

    if (isRestrictedUser) {
      setNotice({ tone: "error", message: restrictedMessage });
      playErrorSound();
      return;
    }

    const post = posts.find((item) => item.id === postId);

    if (!post || post.authorId === session.user.id || !post.ratingEnabled) {
      return;
    }

    if (blockedProfileIds.includes(post.authorId)) {
      setNotice({ tone: "error", message: "This post is unavailable." });
      playErrorSound();
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
      await createActivityNotification({
        userId: post.authorId,
        actorId: session.user.id,
        postId,
        type: "post_rated",
        title: `${currentUser.displayName} rated your ${post.category} post.`,
        body: "Your post got a new rating.",
        dedupeKey: `post_rated:${postId}:${session.user.id}`,
      });
      await createRatingMilestoneNotification(post);
      await refreshData(session.user.id);
      playRateSound();
      triggerHaptic(10);
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

    if (isRestrictedUser) {
      setNotice({ tone: "error", message: restrictedMessage });
      playErrorSound();
      return;
    }

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
      if (!isFollowing) {
        await createActivityNotification({
          userId: profileId,
          actorId: session.user.id,
          type: "user_followed",
          title: `${currentUser.displayName} followed you.`,
          body: "A new person is following your Vybz.",
          dedupeKey: `user_followed:${session.user.id}`,
        });
        playFollowSound();
        triggerHaptic(8);
      }
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
    const post = posts.find((item) => item.id === postId);

    await withAction(async () => {
      const { error } = await requireSupabase().from("posts").update({ status }).eq("id", postId);
      if (error) throw error;
      await recordModerationAction(`post_${status}`, postId);
      if (status === "removed" && post) {
        await createActivityNotification({
          userId: post.authorId,
          actorId: currentUser.id,
          postId,
          type: "post_removed",
          title: "Your post was removed.",
          body: "A moderation action was applied.",
          dedupeKey: `post_removed:${postId}`,
        });
      }
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
    const report = reports.find((item) => item.id === reportId);

    await withAction(async () => {
      const { error } = await requireSupabase().from("reports").update({ status }).eq("id", reportId);
      if (error) throw error;
      await recordModerationAction(`report_${status}`);
      if (report && (status === "resolved" || status === "dismissed")) {
        await createActivityNotification({
          userId: report.reporterId,
          actorId: currentUser.id,
          postId: report.reportedPostId,
          type: status === "resolved" ? "report_resolved" : "report_reviewed",
          title: status === "resolved" ? "Your report was resolved." : "Your report was reviewed.",
          body: "Thanks for helping keep Vybz safe.",
          dedupeKey: `report_${status}:${reportId}`,
        });
      }
      await refreshData();
    }, "Report updated.");
  };

  const handleActivityOpened = () => {
    if (unreadActivityCount > 0) {
      playActivitySound();
    }
  };

  const handleMarkAllActivityRead = async () => {
    if (!session?.user.id || unreadActivityCount === 0) return;

    await withAction(async () => {
      const { error } = await requireSupabase()
        .from("activity_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", session.user.id)
        .is("read_at", null);

      if (error) throw error;
      await refreshData(session.user.id);
    }, "Activity marked read.");
  };

  const handleLogout = async () => {
    await withAction(async () => {
      const { error } = await requireSupabase().auth.signOut();
      if (error) throw error;
    });
  };

  const handleRetryLoad = () => {
    setLoadError("");

    if (session?.user.id) {
      setProfileLoadedForUserId(null);
      refreshData(session.user.id);
      return;
    }

    window.location.reload();
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
    loadError,
    onRetryLoad: handleRetryLoad,
    unreadActivityCount,
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
              loadError={loadError}
              onRetryLoad={handleRetryLoad}
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
            element={
              <Stars
                currentUser={currentUser}
                posts={accessiblePosts}
                ratings={ratings}
                activityNotifications={activityNotifications}
                profiles={profiles}
                unreadActivityCount={unreadActivityCount}
                onActivityOpen={handleActivityOpened}
                onMarkAllActivityRead={handleMarkAllActivityRead}
              />
            }
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
              currentUser.isAdmin ? (
                <AdminModeration
                  currentUser={currentUser}
                  posts={accessiblePosts}
                  profiles={profiles}
                  reports={reports}
                  onPostStatusChange={handlePostStatusChange}
                  onUserStatusChange={handleUserStatusChange}
                  onReportStatusChange={handleReportStatusChange}
                />
              ) : (
                <Navigate to="/feed" replace />
              )
            }
          />
        </Route>
        <Route path="*" element={<Navigate to={session ? "/feed" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
