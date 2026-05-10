import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Send } from "lucide-react";
import { moods } from "../lib/constants";
import { getImageSizeHint, validateImage } from "../lib/supabaseData";
import type { CreatePostInput, PostVisibility } from "../lib/types";

type CreatePostProps = {
  categories: string[];
  loading: boolean;
  onCreate: (input: CreatePostInput) => Promise<string | null>;
};

export function CreatePost({ categories, loading, onCreate }: CreatePostProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [mood, setMood] = useState(moods[0]);
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [ratingEnabled, setRatingEnabled] = useState(true);
  const [dailyVibe, setDailyVibe] = useState(false);
  const [message, setMessage] = useState("");
  const [imageHint, setImageHint] = useState("");
  const navigate = useNavigate();

  const handleImageChange = (file: File | undefined) => {
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setMessage(validationError);
      setImageHint("");
      return;
    }

    setMessage("");
    setImageHint(getImageSizeHint(file));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!imageFile) {
      setMessage("Choose an image first.");
      return;
    }

    const postId = await onCreate({
      imageFile,
      caption,
      category,
      mood,
      visibility,
      ratingEnabled,
      dailyVibe,
    });

    if (postId) {
      navigate(`/post/${postId}`);
    }
  };

  return (
    <form className="form-card stack" onSubmit={handleSubmit}>
      <label className="image-picker">
        {imagePreview ? (
          <img src={imagePreview} alt="" decoding="async" />
        ) : (
          <span>
            <ImagePlus size={28} aria-hidden="true" />
            Choose image
          </span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(event) => handleImageChange(event.target.files?.[0])}
        />
      </label>
      {imageHint ? <p className="muted-copy">{imageHint}</p> : null}
      <label className="field">
        <span>Caption</span>
        <textarea
          rows={5}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Add a moment..."
          maxLength={280}
        />
      </label>
      <div className="field-grid">
        <label className="field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Mood</span>
          <select value={mood} onChange={(event) => setMood(event.target.value)}>
            {moods.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Visibility</span>
        <select value={visibility} onChange={(event) => setVisibility(event.target.value as PostVisibility)}>
          <option value="public">Public</option>
          <option value="followers">Followers</option>
        </select>
      </label>
      <label className="toggle-row">
        <span>
          <strong>Rating enabled</strong>
          <small>Let others rate this vibe</small>
        </span>
        <input
          type="checkbox"
          checked={ratingEnabled}
          onChange={(event) => setRatingEnabled(event.target.checked)}
        />
      </label>
      <label className="toggle-row">
        <span>
          <strong>Daily vibe</strong>
          <small>Count this toward today's score</small>
        </span>
        <input
          type="checkbox"
          checked={dailyVibe}
          onChange={(event) => setDailyVibe(event.target.checked)}
        />
      </label>
      {message ? <p className="form-message">{message}</p> : null}
      <div className="form-card__footer">
        <span>{280 - caption.length} left</span>
        <button className="primary-button" type="submit" disabled={loading}>
          <Send size={18} aria-hidden="true" />
          {loading ? "Uploading..." : "Post vibe"}
        </button>
      </div>
    </form>
  );
}
