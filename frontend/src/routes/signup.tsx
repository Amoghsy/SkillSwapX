import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/GlassCard";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import {
  clearSocialOnboarding,
  errorMessage,
  loadSocialOnboarding,
  saveSocialOnboarding,
  type SocialResult,
} from "@/lib/social-auth";
import { useApp } from "@/lib/store";
import { auth, skills } from "@/services/api";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account - SkillSwap X" }] }),
  component: Signup,
});

const STEPS = [
  "Account",
  "Skills",
  "Interests",
  "Goals",
  "Availability",
] as const;
const SKILL_OPTS = [
  "React",
  "Python",
  "Design",
  "Mandarin",
  "French",
  "Jazz Piano",
  "Yoga",
  "Photography",
  "Writing",
  "Marketing",
  "Finance",
  "Ceramics",
  "Data Viz",
  "Rust",
  "AI/ML",
];
const INTEREST_OPTS = [
  "AI",
  "Languages",
  "Music",
  "Wellness",
  "Crafts",
  "Startups",
  "Photography",
  "Writing",
];
const GOAL_OPTS = [
  "Career switch",
  "Side income",
  "Hobby mastery",
  "Build a portfolio",
  "Mentor others",
];
const AVAIL_OPTS = ["Mornings", "Lunch", "Evenings", "Weekends", "Async only"];
type ApiSkill = { id: number; skill_name: string };

function Signup() {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Record<string, string[]>>({
    skills: [],
    interests: [],
    goals: [],
    availability: [],
  });
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [socialProvider, setSocialProvider] = useState<string | null>(null);
  const [onboardingToken, setOnboardingToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<ApiSkill[]>([]);
  const navigate = useNavigate();
  const setUser = useApp((s) => s.setUser);
  const progress = ((step + 1) / STEPS.length) * 100;

  const applySocialOnboarding = (result: SocialResult) => {
    if (!result.provider || !result.onboarding_token || !result.email) return;
    setSocialProvider(result.provider);
    setOnboardingToken(result.onboarding_token);
    setEmail(result.email);
    if (result.name) {
      setName(result.name);
      setUsername(
        result.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 50),
      );
    }
  };

  useEffect(() => {
    const onboarding = loadSocialOnboarding();
    if (onboarding) applySocialOnboarding(onboarding);
  }, []);

  useEffect(() => {
    skills
      .list()
      .then((data) => {
        if (data) setAvailableSkills(data);
      })
      .catch((error: unknown) =>
        console.error("Failed to load skills list:", error),
      );
  }, []);

  const toggle = (key: string, value: string) =>
    setPicks((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));

  const handleGoogleCredential = async (credential: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await auth.google(credential);
      if (result.exists && result.user) {
        setUser(result.user);
        toast.success("Successfully signed in with Google.");
        await navigate({ to: "/dashboard" });
        return;
      }
      saveSocialOnboarding(result);
      applySocialOnboarding(result);
      toast.info("Google verified. Complete your account details.");
    } catch (error: unknown) {
      setError(errorMessage(error, "Google sign-in failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (
      !name ||
      !username ||
      !email ||
      (!socialProvider && !password) ||
      !location
    ) {
      setError("Please fill out all fields on the first step.");
      setStep(0);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const data = await auth.register(
        name,
        username,
        email,
        socialProvider ? null : password,
        location,
        onboardingToken,
      );
      if (data?.user) setUser(data.user);
      clearSocialOnboarding();

      for (const skillName of picks.skills) {
        const match = availableSkills.find(
          (skill) =>
            skill.skill_name.toLowerCase().includes(skillName.toLowerCase()) ||
            skillName.toLowerCase().includes(skill.skill_name.toLowerCase()),
        );
        if (!match) continue;
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
      await navigate({ to: "/dashboard" });
    } catch (error: unknown) {
      setError(
        errorMessage(error, "Registration failed. Please check your details."),
      );
      setStep(0);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background bg-mesh px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground">
            S
          </div>
          <span className="font-display font-semibold">
            SkillSwap <span className="text-gradient">X</span>
          </span>
        </Link>
        <GlassCard variant="strong" className="p-8">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {step + 1} of {STEPS.length} - {STEPS[step]}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
            />
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
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="mt-7"
            >
              {step === 0 && (
                <Account
                  {...{
                    name,
                    setName,
                    username,
                    setUsername,
                    email,
                    setEmail,
                    password,
                    setPassword,
                    location,
                    setLocation,
                    socialProvider,
                    handleGoogleCredential,
                  }}
                />
              )}
              {step === 1 && (
                <Picker
                  title="Pick the skills you can teach"
                  subtitle="Choose 2-5. You can always add more."
                  opts={SKILL_OPTS}
                  value={picks.skills}
                  onToggle={(value) => toggle("skills", value)}
                />
              )}
              {step === 2 && (
                <Picker
                  title="What are you curious about?"
                  subtitle="We'll route the right circles your way."
                  opts={INTEREST_OPTS}
                  value={picks.interests}
                  onToggle={(value) => toggle("interests", value)}
                />
              )}
              {step === 3 && (
                <Picker
                  title="What are you optimizing for?"
                  subtitle="Pick one or more."
                  opts={GOAL_OPTS}
                  value={picks.goals}
                  onToggle={(value) => toggle("goals", value)}
                />
              )}
              {step === 4 && (
                <Picker
                  title="When are you usually free?"
                  subtitle="We'll suggest mentors in your slots."
                  opts={AVAIL_OPTS}
                  value={picks.availability}
                  onToggle={(value) => toggle("availability", value)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0 || submitting}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm disabled:opacity-40"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((current) => current + 1)}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Continue <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                disabled={submitting}
                onClick={handleRegister}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
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
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Already a member?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

type AccountProps = {
  name: string;
  setName: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  socialProvider: string | null;
  handleGoogleCredential: (credential: string) => Promise<void>;
};

function Account({
  name,
  setName,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  location,
  setLocation,
  socialProvider,
  handleGoogleCredential,
}: AccountProps) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl font-semibold">
        Create your account
      </h2>
      <p className="text-sm text-muted-foreground">
        {socialProvider
          ? `${socialProvider} verified. Add the remaining details for your new account.`
          : "Start earning credits within minutes."}
      </p>
      {!socialProvider && (
        <>
          <div className="pt-2">
            <SocialAuthButtons onGoogleCredential={handleGoogleCredential} />
          </div>
          <div className="flex items-center gap-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-white/10" /> or with email{" "}
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field
          label="Full name"
          placeholder="Jane Doe"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Field
          label="Username"
          placeholder="jane"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <Field
          label="Email"
          placeholder="you@example.com"
          type="email"
          value={email}
          readOnly={Boolean(socialProvider)}
          onChange={(event) => setEmail(event.target.value)}
        />
        {!socialProvider && (
          <Field
            label="Password"
            placeholder="********"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        )}
        <Field
          label="Location"
          placeholder="Bengaluru, IN"
          className="md:col-span-2"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  className = "",
  ...props
}: {
  label: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none focus:border-primary/50 read-only:opacity-70"
      />
    </label>
  );
}

function Picker({
  title,
  subtitle,
  opts,
  value,
  onToggle,
}: {
  title: string;
  subtitle: string;
  opts: string[];
  value: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {opts.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${value.includes(option) ? "border-primary/60 bg-gradient-to-r from-primary/30 to-accent/30 text-foreground" : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"}`}
          >
            {value.includes(option) && <Check className="size-3.5" />} {option}
          </button>
        ))}
      </div>
    </div>
  );
}
