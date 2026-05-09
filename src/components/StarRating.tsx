import { useEffect, useState } from "react";
import { Star } from "lucide-react";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  label?: string;
  compact?: boolean;
};

export function StarRating({
  value,
  onChange,
  readOnly = false,
  label = "Rate vibe",
  compact = false,
}: StarRatingProps) {
  const [glowingStar, setGlowingStar] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;

    const timeout = window.setTimeout(() => setMessage(""), 1300);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const handleClick = (nextValue: number) => {
    if (readOnly || !onChange) return;

    onChange(nextValue);
    setGlowingStar(nextValue);
    setMessage("Vibe rated.");
    window.setTimeout(() => setGlowingStar(null), 420);
  };

  return (
    <div className={`star-rating ${compact ? "star-rating--compact" : ""}`}>
      <div className="star-rating__buttons" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= value;
          const isGlowing = glowingStar === star;

          return (
            <button
              key={star}
              type="button"
              className={`star-rating__button ${filled ? "is-filled" : ""} ${
                isGlowing ? "is-glowing" : ""
              }`}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              aria-pressed={filled}
              disabled={readOnly}
              onClick={() => handleClick(star)}
            >
              <Star size={compact ? 18 : 26} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {message ? <span className="star-rating__message">{message}</span> : null}
    </div>
  );
}
