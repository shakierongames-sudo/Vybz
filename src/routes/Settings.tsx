import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { getImageSizeHint, normalizeUsername, validateImage, validateUsername } from "../lib/supabaseData";
import type { ProfileInput, SaveProfileResult, VybzProfile } from "../lib/types";

type SettingsProps = {
  currentUser: VybzProfile;
  blockedProfiles: VybzProfile[];
  hasOpenDeletionRequest: boolean;
  isSupabaseConfigured: boolean;
  loading: boolean;
  onSaveProfile: (input: ProfileInput, avatarFile?: File | null) => Promise<SaveProfileResult>;
  onUnblock: (profileId: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onDeleteAccountRequest: () => Promise<void>;
};

function daysUntilUsernameChange(usernameUpdatedAt: string | null) {
  if (!usernameUpdatedAt) return 0;

  const nextChange = Date.parse(usernameUpdatedAt) + 30 * 24 * 60 * 60 * 1000;
  const remaining = nextChange - Date.now();

  return remaining > 0 ? Math.ceil(remaining / (24 * 60 * 60 * 1000)) : 0;
}

export function Settings({
  currentUser,
  blockedProfiles,
  hasOpenDeletionRequest,
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
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(currentUser.soundEffectsEnabled);
  const [hapticsEnabled, setHapticsEnabled] = useState(currentUser.hapticsEnabled);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl);
  const [message, setMessage] = useState("");
  const [imageHint, setImageHint] = useState("");
  const usernameCooldownDays = daysUntilUsernameChange(currentUser.usernameUpdatedAt);
  const usernameChanged = username !== currentUser.username;

  useEffect(() => {
    setUsername(currentUser.username);
    setDisplayName(currentUser.displayName);
    setBio(currentUser.bio);
    setVibeColor(currentUser.vibeColor);
    setPublicScoreEnabled(currentUser.publicScoreEnabled);
    setSoundEffectsEnabled(currentUser.soundEffectsEnabled);
    setHapticsEnabled(currentUser.hapticsEnabled);
    setAvatarPreview(currentUser.avatarUrl);
  }, [currentUser]);

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setMessage(validationError);
      setImageHint("");
      return;
    }

    setMessage("");
    setImageHint(getImageSizeHint(file));
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    const usernameError = validateUsername(username);
    if (usernameError) {
      setMessage(usernameError);
      return;
    }

    if (!displayName.trim()) {
      setMessage("Add a display name.");
      return;
    }

    if (usernameChanged && usernameCooldownDays > 0) {
      setMessage(`Username can only be changed once every 30 days. Try again in ${usernameCooldownDays} days.`);
      return;
    }

    const result = await onSaveProfile(
      {
        username,
        displayName,
        bio,
        vibeColor,
        publicScoreEnabled,
        soundEffectsEnabled,
        hapticsEnabled,
      },
      avatarFile,
    );

    if (result.ok) {
      setMessage("Profile updated.");
      setAvatarFile(null);
      return;
    }

    setMessage(result.message ?? "Profile save failed.");
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
          {usernameChanged && usernameCooldownDays > 0 ? (
            <small>Username changes unlock again in {usernameCooldownDays} days.</small>
          ) : null}
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
        {imageHint ? <p className="muted-copy">{imageHint}</p> : null}
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
        <label className="toggle-row">
          <span>
            <strong>Sound effects</strong>
            <small>Play short Vybz sounds for actions</small>
          </span>
          <input
            type="checkbox"
            checked={soundEffectsEnabled}
            onChange={(event) => setSoundEffectsEnabled(event.target.checked)}
          />
        </label>
        <label className="toggle-row">
          <span>
            <strong>Haptics</strong>
            <small>Use light vibration on supported phones</small>
          </span>
          <input
            type="checkbox"
            checked={hapticsEnabled}
            onChange={(event) => setHapticsEnabled(event.target.checked)}
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
        {hasOpenDeletionRequest ? <p className="muted-copy">Account deletion request sent.</p> : null}
        <button type="button" className="settings-row" onClick={onDeleteAccountRequest}>
          <span>
            <strong>Request account deletion</strong>
            <small>
              {hasOpenDeletionRequest ? "You already have an open deletion request." : "Creates an admin review request"}
            </small>
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
