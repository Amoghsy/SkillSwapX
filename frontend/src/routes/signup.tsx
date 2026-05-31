import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { auth, skills } from "@/services/api";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account · SkillSwap X" }] }),
  component: Signup,
});

const STEPS = ["Account", "Skills", "Interests", "Goals", "Availability"] as const;

const SKILL_OPTS = ["React", "Python", "Design", "Mandarin", "French", "Jazz Piano", "Yoga", "Photography", "Writing", "Marketing", "Finance", "Ceramics", "Data Viz", "Rust", "AI/ML"];
const INTEREST_OPTS = ["AI", "Languages", "Music", "Wellness", "Crafts", "Startups", "Photography", "Writing"];
const GOAL_OPTS = ["Career switch", "Side income", "Hobby mastery", "Build a portfolio", "Mentor others"];
const AVAIL_OPTS = ["Mornings", "Lunch", "Evenings", "Weekends", "Async only"];

function Signup() {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Record<string, string[]>>({ skills: [], interests: [], goals: [], availability: [] });
  
  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  
  const navigate = useNavigate();
  const progress = ((step + 1) / STEPS.length) * 100;

  const setUser = useApp((s) => s.setUser);

  // OAuth prefill states
  const [oauthProvider, setOauthProvider] = useState<string | null>(null);
  const [oauthId, setOauthId] = useState<string | null>(null);
  const [oauthAvatarUrl, setOauthAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const provider = localStorage.getItem("oauth_prefill_provider");
    const prefillEmail = localStorage.getItem("oauth_prefill_email");
    const prefillName = localStorage.getItem("oauth_prefill_name");
    const prefillOauthId = localStorage.getItem("oauth_prefill_oauth_id");
    const prefillAvatar = localStorage.getItem("oauth_prefill_avatar_url");

    if (provider && prefillOauthId) {
      setOauthProvider(provider);
      setOauthId(prefillOauthId);
      if (prefillEmail) setEmail(prefillEmail);
      if (prefillName) {
        setName(prefillName);
        setUsername(prefillName.toLowerCase().replace(/[^a-z0-9]/g, ""));
      }
      if (prefillAvatar) setOauthAvatarUrl(prefillAvatar);
      // Auto-populate password since OAuth is pre-authenticated
      setPassword("oauth_bypass_secure_pwd_123!");
    }
  }, []);

  // Fetch available skills from DB to map selected skills to actual IDs
  useEffect(() => {
    skills.list().then(data => {
      if (data) setAvailableSkills(data);
    }).catch((err: any) => console.error("Failed to load skills list:", err));
  }, []);

  const toggle = (key: string, v: string) =>
    setPicks((p) => ({ ...p, [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] }));

  const handleRegister = async () => {
    if (!name || !username || !email || !password || !location) {
      setError("Please fill out all fields on the first step.");
      setStep(0);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // 1. Register user
      const data = await auth.register(
        name,
        username,
        email,
        password === "oauth_bypass_secure_pwd_123!" ? null : password,
        location,
        oauthProvider,
        oauthId,
        oauthAvatarUrl
      );

      if (data && data.user) {
        setUser(data.user);
      }

      // Cleanup prefilled items
      localStorage.removeItem("oauth_prefill_provider");
      localStorage.removeItem("oauth_prefill_name");
      localStorage.removeItem("oauth_prefill_email");
      localStorage.removeItem("oauth_prefill_oauth_id");
      localStorage.removeItem("oauth_prefill_avatar_url");

      // 2. Try to link selected teach skills
      for (const skillName of picks.skills) {
        const match = availableSkills.find(
          (s: any) =>
            s.skill_name.toLowerCase().includes(skillName.toLowerCase()) ||
            skillName.toLowerCase().includes(s.skill_name.toLowerCase())
        );

        if (match) {
          try {
            await skills.addUserSkill({
              skill_id: match.id,
              type: "teach",
              proficiency: "Intermediate",
              credit_rate: 10,
              session_format: "online",
              description: `I teach ${match.skill_name} at an intermediate level.`,
            });
          } catch (skillErr) {
            console.error("Failed to add user skill:", skillName, skillErr);
          }
        }
      }

      // 3. Redirect to dashboard
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err?.message || "Registration failed. Please check your credentials.");
      setStep(0);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background bg-mesh px-5 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground">S</div>
          <span className="font-display font-semibold">SkillSwap <span className="text-gradient">X</span></span>
        </Link>
        <GlassCard variant="strong" className="p-8">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {step + 1} of {STEPS.length} · {STEPS[step]}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full bg-gradient-to-r from-primary to-accent" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 90, damping: 18 }} />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-200"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}
              className="mt-7"
            >
              {step === 0 && (
                <Account
                  name={name} setName={setName}
                  username={username} setUsername={setUsername}
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  location={location} setLocation={setLocation}
                />
              )}
              {step === 1 && <Picker title="Pick the skills you can teach" subtitle="Choose 2–5. You can always add more." opts={SKILL_OPTS} value={picks.skills} onToggle={(v) => toggle("skills", v)} />}
              {step === 2 && <Picker title="What are you curious about?" subtitle="We'll route the right circles your way." opts={INTEREST_OPTS} value={picks.interests} onToggle={(v) => toggle("interests", v)} />}
              {step === 3 && <Picker title="What are you optimizing for?" subtitle="Pick one or more." opts={GOAL_OPTS} value={picks.goals} onToggle={(v) => toggle("goals", v)} />}
              {step === 4 && <Picker title="When are you usually free?" subtitle="We'll suggest mentors in your slots." opts={AVAIL_OPTS} value={picks.availability} onToggle={(v) => toggle("availability", v)} />}
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || submitting}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm disabled:opacity-40 cursor-pointer"
            ><ArrowLeft className="size-4" /> Back</button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground cursor-pointer"
              >Continue <ArrowRight className="size-4" /></button>
            ) : (
              <button
                disabled={submitting}
                onClick={handleRegister}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Entering...
                  </>
                ) : (
                  <>
                    Enter SkillSwap <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </GlassCard>
        <p className="mt-5 text-center text-xs text-muted-foreground">Already a member? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
      </motion.div>
    </div>
  );
}

function Account({
  name, setName,
  username, setUsername,
  email, setEmail,
  password, setPassword,
  location, setLocation
}: any) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl font-semibold">Create your account</h2>
      <p className="text-sm text-muted-foreground">Start earning credits within minutes.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label="Full name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Username" placeholder="jane" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Field label="Email" placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Location" placeholder="Bengaluru, IN" className="md:col-span-2" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
    </div>
  );
}

function Field({ label, className = "", ...p }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <input {...p} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-primary/50 text-foreground" />
    </label>
  );
}

function Picker({ title, subtitle, opts, value, onToggle }: { title: string; subtitle: string; opts: string[]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {opts.map((o) => {
          const active = value.includes(o);
          return (
            <button key={o} onClick={() => onToggle(o)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-primary/60 bg-gradient-to-r from-primary/30 to-accent/30 text-foreground" : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"}`}>
              {active && <Check className="size-3.5" />} {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

