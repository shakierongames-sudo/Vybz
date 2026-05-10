import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { normalizeUsername, validateImage } from "../lib/supabaseData";
import type { ProfileInput, VybzProfile } from "../lib/types";

type SettingsProps = {
  currentUser: VybzProfile;
  blockedProfiles: VybzProfile[];
  isSupabaseConfigured: boolean;
  loading: boolean;
  onSaveProfile: (input: ProfileInput, avatarFile?: File | null) => Promise<boolean>;
  onUnblock: (profileId: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onDeleteAccountRequest: () => Promise<void>;
};

export function Settings({
  currentUser,
  blockedProfiles,
  isSupabaseConfigured,
  loading,
  onSaveProfile,
  onUnblock,
  onLogout,
  onDeleteAccountRequest,
}: SettingsProps) {
  const [username, setUsername] = useState(currentUser.username);
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio);
  const [vibeColor, setVibeColor] = useState(currentUser.vibeColor);
  const [publicScoreEnabled, setPublicScoreEnabled] = useState(currentUser.publicScoreEnabled);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setUsername(currentUser.username);
    setDisplayName(currentUser.displayName);
    setBio(currentUser.bio);
    setVibeColor(currentUser.vibeColor);
    setPublicScoreEnabled(currentUser.publicScoreEnabled);
    setAvatarPreview(currentUser.avatarUrl);
  }, [currentUser]);

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setMessage("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    const saved = await onSaveProfile(
      {
        username,
        displayName,
        bio,
        vibeColor,
        publicScoreEnabled,
      },
      avatarFile,
    );

    if (saved) {
      setMessage("Profile updated.");
      setAvatarFile(null);
    }
  };

  return (
    <section className="content-stack">
      <form className="form-card stack" onSubmit={handleSubmit}>
        <div className="profile-preview">
          <Avatar profile={{ ...currentUser, avatarUrl: avatarPreview, displayName, username, vibeColor }} size="lg" />
          <span>
            <strong>{displayName}</strong>
            <small>@{username}</small>
          </span>
        </div>
        <label className="field">
          <span>Username</span>
          <input value={username} onChange={(event) => setUsername(normalizeUsername(event.target.value))} />
        </label>
        <label className="field">
          <span>Display name</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        <label className="field">
          <span>Bio</span>
          <textarea rows={4} value={bio} onChange={(event) => setBio(event.target.value)} />
        </label>
        <label className="field">
          <span>Avatar</span>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(event) => handleAvatarChange(event.target.files?.[0])}
          />
        </label>
        <label className="field">
          <span>Vibe color</span>
          <input type="color" value={vibeColor} onChange={(event) => setVibeColor(event.target.value)} />
        </label>
        <label className="toggle-row">
          <span>
            <strong>Public score</strong>
            <small>Show your public average on your profile</small>
          </span>
          <input
            type="checkbox"
            checked={publicScoreEnabled}
            onChange={(event) => setPublicScoreEnabled(event.target.checked)}
          />
        </label>
        {message ? <p className="form-message">{message}</p> : null}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save settings"}
        </button>
      </form>

      <div className="settings-list">
        <div className="settings-row">
          <span>
            <strong>Supabase</strong>
            <small>{isSupabaseConfigured ? "Configured" : "Missing environment variables"}</small>
          </span>
          <span className={`connection-dot ${isSupabaseConfigured ? "is-live" : ""}`}>
            {isSupabaseConfigured ? "Live" : "Setup"}
          </span>
        </div>
        {currentUser.isAdmin ? (
          <Link className="settings-row" to="/admin">
            <span>
              <strong>Admin / Moderation</strong>
              <small>Reports, posts, and users</small>
            </span>
            <ShieldCheck size={20} aria-hidden="true" />
          </Link>
        ) : null}
        <button type="button" className="settings-row" onClick={onLogout}>
          <span>
            <strong>Log out</strong>
            <small>End this session</small>
          </span>
          <LogOut size={20} aria-hidden="true" />
        </button>
      </div>

      <section className="moderation-section">
        <h2>Blocked users</h2>
        {blockedProfiles.length ? (
          blockedProfiles.map((profile) => (
            <div key={profile.id} className="moderation-row">
              <span>
                <strong>{profile.displayName}</strong>
                <small>@{profile.username}</small>
              </span>
              <button type="button" className="ghost-button" onClick={() => onUnblock(profile.id)}>
                Unblock
              </button>
            </div>
          ))
        ) : (
          <p className="muted-copy">No blocked users.</p>
        )}
      </section>

      <section className="moderation-section">
        <h2>Account</h2>
        <button type="button" className="settings-row" onClick={onDeleteAccountRequest}>
          <span>
            <strong>Request account deletion</strong>
            <small>Creates an admin review request</small>
          </span>
          <Trash2 size={20} aria-hidden="true" />
        </button>
        <button type="button" className="settings-row" onClick={() => window.location.reload()}>
          <span>
            <strong>Refresh app</strong>
            <small>Reload the latest data</small>
          </span>
          <RefreshCw size={20} aria-hidden="true" />
        </button>
      </section>
    </section>
  );
}
