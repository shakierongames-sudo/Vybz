import { useState } from "react";

type PostImageProps = {
  src: string;
};

export function PostImage({ src }: PostImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const separator = src.includes("?") ? "&" : "?";
  const imageSrc = retry ? `${src}${separator}retry=${retry}` : src;

  if (failed) {
    return (
      <button
        type="button"
        className="post-image-frame post-image-frame--failed"
        onClick={(event) => {
          event.preventDefault();
          setLoaded(false);
          setFailed(false);
          setRetry(Date.now());
        }}
      >
        Image failed to load. Tap to retry.
      </button>
    );
  }

  return (
    <span className={`post-image-frame ${loaded ? "is-loaded" : ""}`}>
      <span className="image-skeleton" aria-hidden="true" />
      <img
        className="post-card__image"
        src={imageSrc}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
