import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { getImageSizeHint, normalizeUsername, validateImage, validateUsername } from "../lib/supabaseData";
import type { ProfileInput, VybzProfile } from "../lib/types";

type OnboardingProps = {
  currentUser: VybzProfile;
  loading: boolean;
  onSave: (input: ProfileInput, avatarFile?: File | null) => Promise<boolean>;
};

const colorOptions = ["#39FF88", "#25D9FF", "#FFE84A", "#F43F5E"];

export function Onboarding({ currentUser, loading, onSave }: OnboardingProps) {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [vibeColor, setVibeColor] = useState(currentUser.vibeColor);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl);
  const [message, setMessage] = useState("");
  const [imageHint, setImageHint] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setDisplayName(currentUser.displayName);
    setUsername(currentUser.username);
    setBio(currentUser.bio);
    setVibeColor(currentUser.vibeColor);
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

    const saved = await onSave(
      {
        username,
        displayName,
        bio,
        vibeColor,
        publicScoreEnabled: currentUser.publicScoreEnabled,
        soundEffectsEnabled: currentUser.soundEffectsEnabled,
        hapticsEnabled: currentUser.hapticsEnabled,
      },
      avatarFile,
    );

    if (saved) {
      navigate("/feed");
    }
  };

  const previewProfile = {
    ...currentUser,
    displayName: displayName || "New Vyber",
    username: username || "username",
    bio,
    avatarUrl: avatarPreview,
    vibeColor,
  };

  return (
    <section className="content-stack">
      <div className="profile-preview">
        <Avatar profile={previewProfile} size="lg" />
        <div>
          <p className="eyebrow">Your profile</p>
          <h2>{previewProfile.displayName}</h2>
          <p>@{previewProfile.username}</p>
        </div>
      </div>

      <form className="form-card stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(normalizeUsername(event.target.value))}
            placeholder="lowercase_no_spaces"
            required
          />
        </label>
        <label className="field">
          <span>Display name</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
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
        <fieldset className="swatch-field">
          <legend>Vibe color</legend>
          <div>
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-swatch ${vibeColor === color ? "is-selected" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => setVibeColor(color)}
                aria-label={`Choose ${color}`}
              />
            ))}
          </div>
        </fieldset>
        {message ? <p className="form-message">{message}</p> : null}
        <button className="primary-button" type="submit" disabled={loading}>
          <CheckCircle2 size={18} aria-hidden="true" />
          {loading ? "Saving..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}
