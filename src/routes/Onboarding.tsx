import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { requireSupabase } from "../lib/supabaseClient";
import { getImageSizeHint, normalizeUsername, validateImage, validateUsername } from "../lib/supabaseData";
import type { ProfileInput, SaveProfileResult, VybzProfile } from "../lib/types";

type OnboardingProps = {
  currentUser: VybzProfile;
  loading: boolean;
  requiresAgeConfirmation?: boolean;
  onSave: (input: ProfileInput, avatarFile?: File | null) => Promise<SaveProfileResult>;
};

const colorOptions = ["#39FF88", "#25D9FF", "#FFE84A", "#F43F5E"];

function getAge(dateValue: string) {
  const birthDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

export function Onboarding({ currentUser, loading, requiresAgeConfirmation, onSave }: OnboardingProps) {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [vibeColor, setVibeColor] = useState(currentUser.vibeColor);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [authRequiresAgeConfirmation, setAuthRequiresAgeConfirmation] = useState(false);
  const [message, setMessage] = useState("");
  const [imageHint, setImageHint] = useState("");
  const navigate = useNavigate();
  const effectiveRequiresAgeConfirmation = requiresAgeConfirmation ?? authRequiresAgeConfirmation;
  const age = dateOfBirth ? getAge(dateOfBirth) : 0;
  const isAgeAllowed = Boolean(dateOfBirth) && age >= 13;
  const ageGateMessage =
    effectiveRequiresAgeConfirmation && dateOfBirth && !isAgeAllowed
      ? "Sorry, you must be at least 13 years old to use Vybz."
      : "";
  const canSave =
    !loading && (!effectiveRequiresAgeConfirmation || (Boolean(dateOfBirth) && isAgeAllowed && ageConfirmed));

  useEffect(() => {
    setDisplayName(currentUser.displayName);
    setUsername(currentUser.username);
    setBio(currentUser.bio);
    setVibeColor(currentUser.vibeColor);
    setAvatarPreview(currentUser.avatarUrl);
  }, [currentUser]);

  useEffect(() => {
    if (typeof requiresAgeConfirmation === "boolean") return;

    let active = true;
    requireSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (!active) return;
        setAuthRequiresAgeConfirmation(data.user?.user_metadata?.age_gate_passed !== true);
      })
      .catch(() => {
        if (active) setAuthRequiresAgeConfirmation(true);
      });

    return () => {
      active = false;
    };
  }, [requiresAgeConfirmation]);

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

    if (effectiveRequiresAgeConfirmation && !isAgeAllowed) {
      setMessage("Sorry, you must be at least 13 years old to use Vybz.");
      return;
    }

    if (effectiveRequiresAgeConfirmation && !ageConfirmed) {
      setMessage("Confirm you are at least 13 and agree to the Community Guidelines.");
      return;
    }

    const checkedAt = new Date().toISOString();
    const ageGate = effectiveRequiresAgeConfirmation
      ? {
          ageGatePassed: true,
          ageGateCheckedAt: checkedAt,
          termsAcceptedAt: checkedAt,
        }
      : undefined;

    try {
      const result = await onSave(
        {
          username,
          displayName,
          bio,
          vibeColor,
          publicScoreEnabled: currentUser.publicScoreEnabled,
          soundEffectsEnabled: currentUser.soundEffectsEnabled,
          hapticsEnabled: currentUser.hapticsEnabled,
          ageGate,
        },
        avatarFile,
      );

      if (result.ok) {
        navigate("/feed");
        return;
      }

      setMessage(result.message ?? "Profile save failed.");
    } catch {
      setMessage("Profile save failed.");
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
        {effectiveRequiresAgeConfirmation ? (
          <>
            <label className="field">
              <span>Date of birth</span>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                required
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong>13+ confirmation</strong>
                <small>I confirm I am at least 13 years old and agree to the Community Guidelines.</small>
              </span>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(event) => setAgeConfirmed(event.target.checked)}
              />
            </label>
          </>
        ) : null}
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
        {message || ageGateMessage ? <p className="form-message">{message || ageGateMessage}</p> : null}
        <button className="primary-button" type="submit" disabled={!canSave}>
          <CheckCircle2 size={18} aria-hidden="true" />
          {loading ? "Saving..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}
