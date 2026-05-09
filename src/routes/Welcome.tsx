import { Link } from "react-router-dom";
import { ArrowRight, LogIn, Star } from "lucide-react";

export function Welcome() {
  return (
    <main className="welcome-screen">
      <section className="welcome-hero">
        <img className="welcome-hero__logo" src="/icons/icon.svg" alt="Vybz logo" />
        <p className="eyebrow">Social pulse check</p>
        <h1>Vybz</h1>
        <p>Post the moment. Rate the feeling. Keep the day glowing.</p>
        <div className="welcome-hero__actions">
          <Link className="primary-button" to="/login?mode=signup">
            Sign up
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className="secondary-button" to="/login">
            Log in
            <LogIn size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="welcome-strip" aria-label="Vibe meter">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={22} aria-hidden="true" />
        ))}
      </section>
    </main>
  );
}
