import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { LoadingState } from "../components/LoadingState";
import { requireSupabase } from "../lib/supabaseClient";
import { friendlyError } from "../lib/supabaseData";
import type { AgeGateInput } from "../lib/types";

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
  onSignUp: (email: string, password: string, ageGate: AgeGateInput) => Promise<AuthResult>;
};

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

export function Login({ session, hasProfile, loading, onLogin, onSignUp }: LoginProps) {
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(requestedMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionTarget, setSessionTarget] = useState<"idle" | "checking" | "feed" | "onboarding">("idle");
  const navigate = useNavigate();
  const isSignup = mode === "signup";
  const age = dateOfBirth ? getAge(dateOfBirth) : 0;
  const isAgeAllowed = Boolean(dateOfBirth) && age >= 13;
  const ageGateMessage =
    isSignup && dateOfBirth && !isAgeAllowed
      ? "Sorry, you must be at least 13 years old to use Vybz."
      : "";
  const canSubmit =
    Boolean(email) &&
    password.length >= 6 &&
    (!isSignup || (Boolean(dateOfBirth) && isAgeAllowed && ageConfirmed));

  useEffect(() => {
    setMode(requestedMode);
    setMessage("");
  }, [requestedMode]);

  useEffect(() => {
    if (!session || hasProfile) {
      setSessionTarget("idle");
      return;
    }

    let active = true;
    setSessionTarget("checking");
    requireSupabase()
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setMessage(friendlyError(error));
          setSessionTarget("idle");
          return;
        }

        setSessionTarget(data ? "feed" : "onboarding");
      });

    return () => {
      active = false;
    };
  }, [session, hasProfile]);

  if (session && hasProfile) {
    return <Navigate to="/feed" replace />;
  }

  if (sessionTarget === "feed") {
    return <Navigate to="/feed" replace />;
  }

  if (sessionTarget === "onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (sessionTarget === "checking") {
    return <LoadingState />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (isSignup && !isAgeAllowed) {
      setMessage("Sorry, you must be at least 13 years old to use Vybz.");
      return;
    }

    if (isSignup && !ageConfirmed) {
      setMessage("Confirm you are at least 13 and agree to the Community Guidelines.");
      return;
    }

    const checkedAt = new Date().toISOString();
    const result = isSignup
      ? await onSignUp(email, password, {
          ageGatePassed: true,
          ageGateCheckedAt: checkedAt,
          termsAcceptedAt: checkedAt,
        })
      : await onLogin(email, password);

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
        <Link to="/" aria-label="Vybz welcome">
          <img src="/icons/icon.svg" alt="" />
        </Link>
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
          {isSignup ? (
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
          {message || ageGateMessage ? <p className="form-message">{message || ageGateMessage}</p> : null}
          <button className="primary-button" type="submit" disabled={loading || !canSubmit}>
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
