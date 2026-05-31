import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/GlassCard";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import {
  errorMessage,
  saveSocialOnboarding,
  type SocialResult,
} from "@/lib/social-auth";
import { useApp } from "@/lib/store";
import { auth } from "@/services/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in - SkillSwap X" }] }),
  component: Login,
});

function Login() {
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const githubCallbackStarted = useRef(false);
  const navigate = useNavigate();
  const setUser = useApp((s) => s.setUser);

  const finishSocialAuth = useCallback(
    async (result: SocialResult, label: string) => {
      if (result.exists && result.user) {
        setUser(result.user);
        toast.success(`Successfully signed in with ${label}.`);
        await navigate({ to: "/dashboard" });
        return;
      }

      saveSocialOnboarding(result);
      toast.info(`${label} verified. Complete your account details.`);
      await navigate({ to: "/signup" });
    },
    [navigate, setUser],
  );

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setSubmitting(true);
      setError(null);
      try {
        await finishSocialAuth(await auth.google(credential), "Google");
      } catch (error: unknown) {
        setError(errorMessage(error, "Google sign-in failed."));
      } finally {
        setSubmitting(false);
      }
    },
    [finishSocialAuth],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const providerError = params.get("error");
    if ((!code && !providerError) || githubCallbackStarted.current) return;
    githubCallbackStarted.current = true;
    window.history.replaceState({}, "", "/login");

    if (providerError) {
      setError(
        params.get("error_description") ||
          "GitHub authorization was cancelled.",
      );
      return;
    }

    const expectedState = sessionStorage.getItem("github_oauth_state");
    const verifier = sessionStorage.getItem("github_code_verifier");
    const redirectUri = sessionStorage.getItem("github_redirect_uri");
    sessionStorage.removeItem("github_oauth_state");
    sessionStorage.removeItem("github_code_verifier");
    sessionStorage.removeItem("github_redirect_uri");

    if (!state || state !== expectedState || !verifier || !redirectUri) {
      setError(
        "GitHub sign-in session is invalid or expired. Please try again.",
      );
      return;
    }

    setSubmitting(true);
    void auth
      .github(code, redirectUri, verifier)
      .then((result) => finishSocialAuth(result, "GitHub"))
      .catch((error: unknown) => {
        // 409 means the email is already registered under a different auth method
        const msg = error && typeof error === "object" && "status" in error && (error as any).status === 409
          ? "This GitHub email is already linked to an account. Please sign in with your original method (email/password or Google) instead."
          : errorMessage(error, "GitHub sign-in failed.");
        setError(msg);
      })
      .finally(() => setSubmitting(false));
  }, [finishSocialAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await auth.login(username, pw);
      if (data?.user) setUser(data.user);
      toast.success("Welcome back to SkillSwap X!");
      await navigate({ to: "/dashboard" });
    } catch (error: unknown) {
      setError(
        errorMessage(error, "Invalid email or password. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background bg-mesh px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground">
            S
          </div>
          <span className="font-display font-semibold">
            SkillSwap <span className="text-gradient">X</span>
          </span>
        </Link>
        <GlassCard variant="strong" className="space-y-5 p-8">
          <div>
            <h1 className="font-display text-2xl font-semibold">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick up where you left off.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-200"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <SocialAuthButtons onGoogleCredential={handleGoogleCredential} />
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-white/10" /> or with email{" "}
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-xs text-muted-foreground">
                Username or Email
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username or email"
                className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Password</span>
              <input
                type="password"
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="********"
                className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none focus:border-primary/50"
              />
              <PasswordMeter pw={pw} />
            </label>
            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="accent-primary" /> Remember me
              </label>
              <Link to="/forgot" className="text-primary hover:underline">
                Forgot?
              </Link>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}

function PasswordMeter({ pw }: { pw: string }) {
  const score = Math.min(
    4,
    [/.{8,}/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length,
  );
  const labels = ["Too short", "Weak", "Fair", "Strong", "Excellent"];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < score ? "bg-gradient-to-r from-primary to-accent" : "bg-white/10"}`}
          />
        ))}
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">
        {pw ? labels[score] : "Use 8+ chars, mixed case, and a symbol"}
      </div>
    </div>
  );
}
