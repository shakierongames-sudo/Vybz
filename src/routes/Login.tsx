import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

type AuthResult = {
  ok: boolean;
  message?: string;
  needsOnboarding?: boolean;
};

type LoginProps = {
  session: Session | null;
  hasProfile: boolean;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<AuthResult>;
  onSignUp: (email: string, password: string) => Promise<AuthResult>;
};

export function Login({ session, hasProfile, loading, onLogin, onSignUp }: LoginProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  if (session && hasProfile) {
    return <Navigate to="/feed" replace />;
  }

  if (session && !hasProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    const result =
      mode === "login" ? await onLogin(email, password) : await onSignUp(email, password);

    if (!result.ok) {
      setMessage(result.message ?? "Please try again.");
      return;
    }

    if (result.needsOnboarding) {
      navigate("/onboarding");
      return;
    }

    if (result.message) {
      setMessage(result.message);
      return;
    }

    navigate("/feed");
  };

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <img src="/icons/icon.svg" alt="" />
        <p className="eyebrow">{mode === "login" ? "Welcome back" : "Join the pulse"}</p>
        <h1>{mode === "login" ? "Sign in to Vybz" : "Create Vybz account"}</h1>
        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </label>
          {message ? <p className="form-message">{message}</p> : null}
          <button className="primary-button" type="submit" disabled={loading}>
            {mode === "login" ? <LogIn size={18} aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}
            {loading ? "Working..." : mode === "login" ? "Log in" : "Sign up"}
          </button>
          <button className="secondary-button" type="button" disabled>
            Google sign-in coming soon
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setMode((current) => (current === "login" ? "signup" : "login"));
              setMessage("");
            }}
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
          </button>
          <Link className="text-button" to="/">
            Back to welcome
          </Link>
        </form>
      </section>
    </main>
  );
}
