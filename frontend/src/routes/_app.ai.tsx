import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { GlassCard } from "@/components/GlassCard";
import { Sparkles, Target, TrendingUp, Rocket, ArrowRight, Loader2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";
import { roadmap as roadmapApi } from "@/services/api";

const growthData = Array.from({ length: 12 }, (_, i) => ({ m: `M${i+1}`, skill: 30 + i * 6 + Math.round(Math.random() * 6) }));

export const Route = createFileRoute("/_app/ai")({
  head: () => ({ meta: [{ title: "AI Center · SkillSwap X" }] }),
  component: AICenter,
});

function AICenter() {
  const [goal, setGoal] = useState("React Performance & Advanced Systems");
  const [inputValue, setInputValue] = useState("React Performance & Advanced Systems");
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setGoal(inputValue);
    await fetchRoadmap(inputValue);
  };

  const fetchRoadmap = async (targetGoal: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await roadmapApi.generate(targetGoal);
      if (res && res.milestones) {
        setMilestones(res.milestones);
      } else {
        setMilestones([
          { step: 1, skill: "Fundamentals of " + targetGoal, credits_needed: 5 },
          { step: 2, skill: "Intermediate " + targetGoal, credits_needed: 10 },
          { step: 3, skill: "Advanced " + targetGoal, credits_needed: 15 },
        ]);
      }
    } catch (err: any) {
      console.error("Failed to generate roadmap:", err);
      // Fallback
      setMilestones([
        { step: 1, skill: "Fundamentals of " + targetGoal, credits_needed: 5 },
        { step: 2, skill: "Intermediate " + targetGoal, credits_needed: 10 },
        { step: 3, skill: "Advanced " + targetGoal, credits_needed: 15 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap(goal);
  }, []);

  return (
    <>
      <TopNav title="AI Recommendation Center" />
      <div className="space-y-6 px-4 py-6 md:px-8">
        <GlassCard variant="strong" className="relative overflow-hidden">
          <div className="absolute -right-12 -top-16 size-64 rounded-full bg-primary/30 blur-3xl" aria-hidden />
          <div className="absolute -bottom-12 -left-12 size-64 rounded-full bg-accent/30 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted-foreground"><Sparkles className="size-3.5 text-primary" /> Your AI coach</div>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">Your <span className="text-gradient">next 90 days</span>, mapped.</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">What is your learning goal? Tell your AI Coach to construct a personalized path instantly.</p>
            </div>
            
            <form onSubmit={handleGenerate} className="flex flex-col gap-3 sm:flex-row max-w-2xl">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter your custom goal (e.g. NextJS systems, Jazz improv)..."
                className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-primary/50 text-foreground"
              />
              <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50 cursor-pointer">
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Re-run analysis"} <ArrowRight className="size-4" />
              </button>
            </form>
          </div>
        </GlassCard>

        <div className="grid gap-5 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold"><Target className="size-4 text-accent" /> Learning roadmap: <span className="text-gradient font-semibold">{goal}</span></div>
            
            {loading ? (
              <div className="grid place-items-center py-20">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="mt-2 text-xs text-muted-foreground">Consulting your AI coach...</span>
              </div>
            ) : (
              <ol className="mt-5 space-y-4">
                {milestones.map((r, i) => (
                  <li key={r.step || i} className="relative grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 font-display font-semibold">{i + 1}</div>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-primary">Milestone {r.step || (i + 1)}</div>
                      <div className="text-sm font-medium">{r.skill || r.focus}</div>
                    </div>
                    <div className="text-xs text-emerald-300">+{r.credits_needed || 5} credits</div>
                  </li>
                ))}
                {milestones.length === 0 && (
                  <div className="py-6 text-center text-xs text-muted-foreground">Enter a goal above to map your journey!</div>
                )}
              </ol>
            )}
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="size-4 text-primary" /> Projected skill growth</div>
            <div className="mt-3 h-48">
              <ResponsiveContainer>
                <LineChart data={growthData}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="m" tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.22 0.04 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="skill" stroke="oklch(0.70 0.18 255)" strokeWidth={2.5} dot={{ r: 3, fill: "oklch(0.62 0.22 295)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Personalized for you</div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Rocket, title: "Lead a workshop on React Perf", reason: "You're top 5% in your circle." },
              { icon: Target, title: "Close your Languages gap", reason: "30 min/day with Sara → HSK 2 in 8 weeks." },
              { icon: Sparkles, title: "Try a new category: Data Viz", reason: "Explore charts and viz models." },
            ].map((r) => (
              <GlassCard key={r.title} whileHover={{ y: -3 }}>
                <r.icon className="size-5 text-primary" />
                <div className="mt-3 text-sm font-semibold">{r.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                <button className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">Explore <ArrowRight className="size-3" /></button>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
