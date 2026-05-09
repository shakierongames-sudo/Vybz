import { imageRules } from "./constants";
import { requireSupabase } from "./supabaseClient";
import type {
  Block,
  Follow,
  PostWithMeta,
  Rating,
  Report,
  UserStatus,
  VybzPost,
  VybzProfile,
} from "./types";

type ProfileRow = {
  id: string;
  username?: string | null;
  handle?: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  vibe_color: string | null;
  status: UserStatus | "blocked";
  is_admin: boolean | null;
  public_score_enabled: boolean | null;
  created_at: string;
  updated_at: string;
};

type PostRow = {
  id: string;
  author_id: string;
  caption: string | null;
  body?: string | null;
  image_url: string | null;
  category: string | null;
  mood: string | null;
  visibility: "public" | "followers" | null;
  rating_enabled: boolean | null;
  daily_vibe: boolean | null;
  status: "active" | "under_review" | "removed";
  created_at: string;
  updated_at: string;
};

type RatingRow = {
  id: string;
  post_id: string;
  user_id: string;
  value: number;
  created_at: string;
  updated_at: string;
};

type ReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_post_id: string | null;
  reason: string;
  details: string | null;
  status: "open" | "reviewing" | "dismissed" | "resolved";
  created_at: string;
};

type FollowRow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

type BlockRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

export type AppData = {
  profile: VybzProfile | null;
  profiles: VybzProfile[];
  posts: PostWithMeta[];
  ratings: Rating[];
  follows: Follow[];
  blocks: Block[];
  reports: Report[];
};

export function normalizeUsername(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

export function friendlyError(error: unknown) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);

  if (message.includes("profiles_username_key") || message.toLowerCase().includes("duplicate")) {
    return "That username is already taken.";
  }

  if (message.toLowerCase().includes("invalid login")) {
    return "Email or password did not match.";
  }

  if (message.toLowerCase().includes("row-level security")) {
    return "You do not have permission to do that.";
  }

  return message || "Something went wrong. Please try again.";
}

export function validateImage(file: File) {
  if (!imageRules.types.includes(file.type)) {
    return "Use a JPG, PNG, or WebP image.";
  }

  if (file.size > imageRules.maxBytes) {
    return "Images must be 5MB or smaller.";
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!imageRules.extensions.includes(extension)) {
    return "Use a JPG, PNG, or WebP image.";
  }

  return "";
}

export async function uploadPublicImage(bucket: "avatars" | "post-images", userId: string, file: File) {
  const validationError = validateImage(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const client = requireSupabase();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}

function mapProfile(row: ProfileRow): VybzProfile {
  return {
    id: row.id,
    username: row.username ?? row.handle ?? "vybz",
    displayName: row.display_name ?? "Vybz user",
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url,
    vibeColor: row.vibe_color ?? "#39FF88",
    status: row.status === "blocked" ? "suspended" : row.status,
    isAdmin: Boolean(row.is_admin),
    publicScoreEnabled: row.public_score_enabled ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPost(row: PostRow): VybzPost {
  return {
    id: row.id,
    authorId: row.author_id,
    caption: row.caption ?? row.body ?? "",
    imageUrl: row.image_url ?? "",
    category: row.category ?? "Daily",
    mood: row.mood ?? "Glowy",
    visibility: row.visibility ?? "public",
    ratingEnabled: row.rating_enabled ?? true,
    dailyVibe: row.daily_vibe ?? false,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRating(row: RatingRow): Rating {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    value: row.value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reportedUserId: row.reported_user_id,
    reportedPostId: row.reported_post_id,
    reason: row.reason,
    details: row.details ?? "",
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapFollow(row: FollowRow): Follow {
  return {
    followerId: row.follower_id,
    followingId: row.following_id,
    createdAt: row.created_at,
  };
}

function mapBlock(row: BlockRow): Block {
  return {
    blockerId: row.blocker_id,
    blockedId: row.blocked_id,
    createdAt: row.created_at,
  };
}

export async function loadAppData(userId: string): Promise<AppData> {
  const client = requireSupabase();
  const profileResult = await client
    .from("profiles")
    .select(
      "id,username,handle,display_name,bio,avatar_url,vibe_color,status,is_admin,public_score_enabled,created_at,updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (!profileResult.data) {
    return {
      profile: null,
      profiles: [],
      posts: [],
      ratings: [],
      follows: [],
      blocks: [],
      reports: [],
    };
  }

  const profile = mapProfile(profileResult.data as ProfileRow);

  const [profilesResult, postsResult, followsResult, blocksResult] = await Promise.all([
    client
      .from("profiles")
      .select(
        "id,username,handle,display_name,bio,avatar_url,vibe_color,status,is_admin,public_score_enabled,created_at,updated_at",
      )
      .order("display_name"),
    client
      .from("posts")
      .select(
        "id,author_id,caption,body,image_url,category,mood,visibility,rating_enabled,daily_vibe,status,created_at,updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(120),
    client.from("follows").select("follower_id,following_id,created_at").eq("follower_id", userId),
    client.from("blocks").select("blocker_id,blocked_id,created_at").eq("blocker_id", userId),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (postsResult.error) throw postsResult.error;
  if (followsResult.error) throw followsResult.error;
  if (blocksResult.error) throw blocksResult.error;

  const profiles = ((profilesResult.data ?? []) as ProfileRow[]).map(mapProfile);
  const postRows = ((postsResult.data ?? []) as PostRow[]).filter((row) => row.image_url);
  const postIds = postRows.map((post) => post.id);
  const ratingsResult = postIds.length
    ? await client
        .from("ratings")
        .select("id,post_id,user_id,value,created_at,updated_at")
        .in("post_id", postIds)
    : { data: [], error: null };

  if (ratingsResult.error) throw ratingsResult.error;

  const reportsResult = profile.isAdmin
    ? await client
        .from("reports")
        .select(
          "id,reporter_id,reported_user_id,reported_post_id,reason,details,status,created_at",
        )
        .in("status", ["open", "reviewing"])
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (reportsResult.error) throw reportsResult.error;

  const ratings = ((ratingsResult.data ?? []) as RatingRow[]).map(mapRating);
  const follows = ((followsResult.data ?? []) as FollowRow[]).map(mapFollow);
  const blocks = ((blocksResult.data ?? []) as BlockRow[]).map(mapBlock);
  const reports = ((reportsResult.data ?? []) as ReportRow[]).map(mapReport);
  const profileMap = new Map(profiles.map((item) => [item.id, item]));
  profileMap.set(profile.id, profile);

  const posts = postRows
    .map((row) => {
      const post = mapPost(row);
      const postRatings = ratings.filter((rating) => rating.postId === post.id);
      const averageRating = postRatings.length
        ? postRatings.reduce((sum, rating) => sum + rating.value, 0) / postRatings.length
        : 0;

      return {
        ...post,
        author: profileMap.get(post.authorId) ?? profile,
        averageRating,
        ratingCount: postRatings.length,
        myRating: postRatings.find((rating) => rating.userId === userId)?.value,
      };
    })
    .filter((post) => post.author.status === "active" || post.authorId === userId || profile.isAdmin);

  return {
    profile,
    profiles,
    posts,
    ratings,
    follows,
    blocks,
    reports,
  };
}
