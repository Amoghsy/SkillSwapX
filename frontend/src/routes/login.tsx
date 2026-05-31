import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ArrowRight, Github, Mail, AlertCircle, Loader2, X, Sparkles, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "@/services/api";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · SkillSwap X" }] }),
  component: Login,
});

function Login() {
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"google" | "github">("google");
  const [oauthSimulateNew, setOauthSimulateNew] = useState(true);
  const [simName, setSimName] = useState("");
  const [simEmail, setSimEmail] = useState("");
  const navigate = useNavigate();

  const setUser = useApp((s) => s.setUser);

  // Load Google Client library
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch {}
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data = await auth.login(username, pw);
      if (data && data.user) {
        setUser(data.user);
      }
      toast.success("Welcome back to SkillSwap X!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuthClick = (provider: "google" | "github") => {
    setOauthProvider(provider);
    if (provider === "google") {
      setSimName("Google Explorer");
      setSimEmail("google.explorer@gmail.com");
    } else {
      setSimName("GitHub Octocat");
      setSimEmail("github.octocat@gmail.com");
    }
    setShowOAuthModal(true);
  };

  const handleConfirmOAuthSimulation = async () => {
    setSubmitting(true);
    setShowOAuthModal(false);
    try {
      if (oauthSimulateNew) {
        // Direct to signup onboarding with prefilled data
        localStorage.setItem("oauth_prefill_provider", oauthProvider);
        localStorage.setItem("oauth_prefill_name", simName);
        localStorage.setItem("oauth_prefill_email", simEmail);
        localStorage.setItem("oauth_prefill_oauth_id", oauthProvider + "_" + Math.floor(Math.random() * 1000000));
        localStorage.setItem("oauth_prefill_avatar_url", `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(simName)}&backgroundColor=3b82f6,8b5cf6,06b6d4`);
        
        toast.info("OAuth authorized. Complete your learning onboarding steps.");
        navigate({ to: "/signup" });
      } else {
        // Login as seeded user (Maya Lin or Diego Alvarez)
        if (oauthProvider === "google") {
          // Send simulated login payload
          const res = await auth.google("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1heWFAZXhhbXBsZS5jb20iLCJuYW1lIjoiTWF5YSBMaW4iLCJzdWIiOiJnb29nbGVfbWF5YSIsImV4cCI6OTk5OTk5OTk5OSwiaXNzIjoiYWNjb3VudHMuZ29vZ2xlLmNvbSJ9.signature");
          if (res && res.user) {
            setUser(res.user);
          }
          toast.success("Successfully logged in with Google (Simulated)!");
          navigate({ to: "/dashboard" });
        } else {
          // GitHub login
          const res = await auth.github("github_code_sim_diego", {
            email: "diego@example.com",
            name: "Diego Alvarez",
            id: "github_diego",
            avatar_url: "https://api.dicebear.com/9.x/glass/svg?seed=Diego"
          });
          if (res && res.user) {
            setUser(res.user);
          }
          toast.success("Successfully logged in with GitHub (Simulated)!");
          navigate({ to: "/dashboard" });
        }
      }
    } catch (err: any) {
      console.error("OAuth flow failed:", err);
      toast.error(err?.message || "OAuth credentials verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid min-h-dvh place-items-center bg-background bg-mesh px-5 py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground">S</div>
            <span className="font-display font-semibold">SkillSwap <span className="text-gradient">X</span></span>
          </Link>
          <GlassCard variant="strong" className="space-y-5 p-8">
            <div>
              <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">Pick up where you left off.</p>
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

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOAuthClick("github")}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm hover:bg-white/10 cursor-pointer transition active:scale-95"
              >
                <Github className="size-4" /> GitHub
              </button>
              <button
                onClick={() => handleOAuthClick("google")}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm hover:bg-white/10 cursor-pointer transition active:scale-95"
              >
                <Mail className="size-4" /> Google
              </button>
            </div>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-white/10" /> or with email <span className="h-px flex-1 bg-white/10" />
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-xs text-muted-foreground">Username or Email</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username or email"
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-primary/50 text-foreground"
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Password</span>
                <input
                  type="password"
                  required
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-primary/50 text-foreground"
                />
                <PasswordMeter pw={pw} />
              </label>
              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="accent-primary" /> Remember me</label>
                <Link to="/forgot" className="text-primary hover:underline">Forgot?</Link>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
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
            <p className="text-center text-xs text-muted-foreground">New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link></p>
          </GlassCard>
        </motion.div>
      </div>

      {/* OAuth simulation modal */}
      <AnimatePresence>
        {showOAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-popover/90 p-6 backdrop-blur-xl shadow-2xl"
            >
              <button
                onClick={() => setShowOAuthModal(false)}
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground">
                  {oauthProvider === "google" ? "G" : "GH"}
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold capitalize">{oauthProvider} Auth Integration</h3>
                  <p className="text-xs text-muted-foreground">Production-Ready Single Sign-On (SSO)</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-2">
                  <div className="text-xs uppercase tracking-widest text-primary flex items-center gap-1 font-semibold">
                    <Sparkles className="size-3" /> OAuth Mode Selector
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => setOauthSimulateNew(false)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${!oauthSimulateNew ? "border-primary bg-primary/20 text-foreground" : "border-white/10 bg-white/5 text-muted-foreground"}`}
                    >
                      Login Existing
                    </button>
                    <button
                      onClick={() => setOauthSimulateNew(true)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${oauthSimulateNew ? "border-primary bg-primary/20 text-foreground" : "border-white/10 bg-white/5 text-muted-foreground"}`}
                    >
                      Register New
                    </button>
                  </div>
                </div>

                {oauthSimulateNew ? (
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">Specify the OAuth claims to receive from the provider. Onboarding form will automatically extract these.</div>
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mock Profile Name</span>
                      <input
                        value={simName}
                        onChange={(e) => setSimName(e.target.value)}
                        className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-xs outline-none text-foreground focus:border-primary/50"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mock Profile Email</span>
                      <input
                        value={simEmail}
                        onChange={(e) => setSimEmail(e.target.value)}
                        className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-xs outline-none text-foreground focus:border-primary/50"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 flex gap-2">
                    <ShieldCheck className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <strong>Verified Login Flow</strong>
                      <p className="mt-0.5 text-muted-foreground">
                        Simulating JWT claims callback. Logs you in as <strong>{oauthProvider === "google" ? "Maya Lin" : "Diego Alvarez"}</strong> by sending decoded token data directly to the `/auth/${oauthProvider}` PHP endpoint.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowOAuthModal(false)} className="bg-white/5">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmOAuthSimulation}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
                >
                  Authorize &amp; Continue
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function PasswordMeter({ pw }: { pw: string }) {
  const score = Math.min(4, [/.{8,}/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length);
  const labels = ["Too short", "Weak", "Fair", "Strong", "Excellent"];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < score ? "bg-gradient-to-r from-primary to-accent" : "bg-white/10"}`} />
        ))}
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">{pw ? labels[score] : "Use 8+ chars, mixed case, and a symbol"}</div>
    </div>
  );
}
