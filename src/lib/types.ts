export type UserStatus = "active" | "suspended" | "banned";
export type PostStatus = "active" | "under_review" | "removed";
export type PostVisibility = "public" | "followers";
export type ReportStatus = "open" | "reviewing" | "dismissed" | "resolved";
export type ActivityType =
  | "post_rated"
  | "user_followed"
  | "post_created"
  | "post_milestone"
  | "post_removed"
  | "report_resolved"
  | "report_reviewed";

export type VybzProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  vibeColor: string;
  status: UserStatus;
  isAdmin: boolean;
  publicScoreEnabled: boolean;
  soundEffectsEnabled: boolean;
  hapticsEnabled: boolean;
  usernameUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VybzPost = {
  id: string;
  authorId: string;
  caption: string;
  imageUrl: string;
  category: string;
  mood: string;
  visibility: PostVisibility;
  ratingEnabled: boolean;
  dailyVibe: boolean;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
};

export type Rating = {
  id: string;
  postId: string;
  userId: string;
  value: number;
  createdAt: string;
  updatedAt: string;
};

export type Report = {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  reportedPostId: string | null;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: string;
};

export type Follow = {
  followerId: string;
  followingId: string;
  createdAt: string;
};

export type Block = {
  blockerId: string;
  blockedId: string;
  createdAt: string;
};

export type ActivityNotification = {
  id: string;
  userId: string;
  actorId: string | null;
  postId: string | null;
  type: ActivityType;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

export type PostWithMeta = VybzPost & {
  author: VybzProfile;
  averageRating: number;
  ratingCount: number;
  myRating?: number;
};

export type ProfileInput = {
  username: string;
  displayName: string;
  bio: string;
  vibeColor: string;
  publicScoreEnabled: boolean;
  soundEffectsEnabled?: boolean;
  hapticsEnabled?: boolean;
  ageGate?: AgeGateInput;
};

export type SaveProfileResult = {
  ok: boolean;
  message?: string;
};

export type AgeGateInput = {
  ageGatePassed: boolean;
  ageGateCheckedAt: string;
  termsAcceptedAt: string;
};

export type CreatePostInput = {
  imageFile: File;
  caption: string;
  category: string;
  mood: string;
  visibility: PostVisibility;
  ratingEnabled: boolean;
  dailyVibe: boolean;
};

export type UpdatePostInput = {
  caption: string;
  category: string;
  mood: string;
  visibility: PostVisibility;
  ratingEnabled: boolean;
  dailyVibe: boolean;
};

export type AppNotice = {
  tone: "success" | "error" | "info";
  message: string;
};
