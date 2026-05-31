import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Loader2,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { GlassCard } from "@/components/GlassCard";
import { TopNav } from "@/components/TopNav";
import { roadmap as roadmapApi } from "@/services/api";

type Milestone = {
  step?: number;
  skill?: string;
  focus?: string;
  credits_needed?: number;
  estimated_weeks?: number;
  description?: string;
  recommended_mentors?: any[];
};

type RoadmapResponse = {
  goal?: string;
  source_skills?: string[];
  milestones?: Milestone[];
  growth_projection?: GrowthPoint[];
};

type GrowthPoint = {
  month: string;
  skill: number;
};

function errorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Could not generate a roadmap from your recent swaps.";
}

export const Route = createFileRoute("/_app/ai")({
  head: () => ({ meta: [{ title: "AI Center - SkillSwap X" }] }),
  component: AICenter,
});

function AICenter() {
  const [goal, setGoal] = useState("");
  const [sourceSkills, setSourceSkills] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [growthData, setGrowthData] = useState<GrowthPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSource, setLoadingSource] = useState("");
  const [error, setError] = useState("");
  const [customGoal, setCustomGoal] = useState("");

  const fetchRoadmap = useCallback(async (selectedGoal?: string, source = "recent_swaps") => {
    setLoading(true);
    setLoadingSource(selectedGoal ? "custom_goal" : source);
    setError("");
    try {
      const response = (await roadmapApi.generate(selectedGoal, source)) as RoadmapResponse;
      setGoal(response?.goal || "");
      setSourceSkills(response?.source_skills || []);
      setMilestones(response?.milestones || []);
      setGrowthData(response?.growth_projection || []);
      if (selectedGoal) {
        setCustomGoal("");
      }
    } catch (requestError: unknown) {
      setGoal("");
      setSourceSkills([]);
      setMilestones([]);
      setGrowthData([]);
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
      setLoadingSource("");
    }
  }, []);

  // Do NOT auto-fetch on mount — new users have no swap history and will get a 422.
  // They should manually click "Refresh from recent swaps" or enter a custom goal.

  return (
    <>
      <TopNav title="AI Recommendation Center" />
      <div className="space-y-6 px-4 py-6 md:px-8">
        <GlassCard variant="strong" className="relative overflow-hidden">
          <div
            className="absolute -right-12 -top-16 size-64 rounded-full bg-primary/30 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -bottom-12 -left-12 size-64 rounded-full bg-accent/30 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" /> Your AI coach
              </div>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                Your <span className="text-gradient">next 90 days</span>,
                mapped.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Your learning roadmap is generated from the skills you received
                in your most recent accepted and completed swaps, or from a custom goal.
              </p>
            </div>

            {/* Custom goal input field */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center mt-2 max-w-2xl w-full">
              <input
                type="text"
                placeholder="Type a custom learning goal (e.g. Learn React Performance, French conversation)..."
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm text-foreground outline-none focus:border-primary/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customGoal.trim()) {
                    void fetchRoadmap(customGoal.trim());
                  }
                }}
              />
              <button
                type="button"
                disabled={loading || !customGoal.trim()}
                onClick={() => void fetchRoadmap(customGoal.trim())}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                Generate
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => void fetchRoadmap(undefined, "recent_swaps")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/10 disabled:opacity-50 cursor-pointer"
              >
                {loadingSource === "recent_swaps" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Refresh from recent swaps
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void fetchRoadmap(undefined, "my_skills")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/10 disabled:opacity-50 cursor-pointer"
              >
                {loadingSource === "my_skills" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Target className="size-4" />
                )}
                Refresh from My Skills
              </button>
              {sourceSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sourceSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {error && (
          <GlassCard>
            <div className="text-sm font-semibold">
              Roadmap not available yet
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </GlassCard>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4 text-accent" /> Learning roadmap
              {goal && (
                <>
                  : <span className="text-gradient font-semibold">{goal}</span>
                </>
              )}
            </div>
            {loading ? (
              <div className="grid place-items-center py-20">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="mt-2 text-xs text-muted-foreground">
                  Reviewing your recent swaps...
                </span>
              </div>
            ) : (
              <ol className="mt-5 space-y-4">
                {milestones.map((milestone, index) => (
                  <li
                    key={milestone.step || index}
                    className="relative flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 font-display text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                            Milestone {milestone.step || index + 1} • {milestone.estimated_weeks || 2} weeks
                          </div>
                          <div className="text-sm font-semibold text-foreground mt-0.5">
                            {milestone.skill || milestone.focus}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-emerald-300 font-medium whitespace-nowrap bg-emerald-500/10 rounded-full px-2.5 py-0.5 border border-emerald-500/10">
                        +{milestone.credits_needed || 5} credits
                      </div>
                    </div>

                    {milestone.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed pl-12">
                        {milestone.description}
                      </p>
                    )}

                    {milestone.recommended_mentors && milestone.recommended_mentors.length > 0 && (
                      <div className="mt-2 pl-12">
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Recommended Mentors</div>
                        <div className="flex flex-wrap gap-2">
                          {milestone.recommended_mentors.map((m: any) => (
                            <Link
                              key={m.user_id}
                              to="/profile/$userId"
                              params={{ userId: String(m.user_id) }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10 transition"
                            >
                              <img src={m.avatar_url} alt="" className="size-4 rounded-full" />
                              <span>{m.name}</span>
                              <span className="text-[8px] px-1 bg-primary/20 text-primary rounded font-semibold">{m.trust_tier}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
                {!milestones.length && !error && (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Your roadmap will appear after your first accepted skill
                    swap.
                  </div>
                )}
              </ol>
            )}
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-primary" /> Projected skill
              growth
            </div>
            <div className="mt-3 h-48">
              <ResponsiveContainer>
                <LineChart data={growthData}>
                  <CartesianGrid
                    stroke="oklch(1 0 0 / 0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.22 0.04 265)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="skill"
                    stroke="oklch(0.70 0.18 255)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "oklch(0.62 0.22 295)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {!growthData.length && (
              <p className="text-center text-xs text-muted-foreground">
                Load a roadmap to see your backend projection.
              </p>
            )}
          </GlassCard>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Personalized for you
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Rocket,
                title: "Practice your newest skill",
                reason: "Turn your recent swap into a consistent habit.",
              },
              {
                icon: Target,
                title: "Book your next milestone",
                reason: "Find a mentor aligned with your roadmap.",
              },
              {
                icon: Sparkles,
                title: "Build on your progress",
                reason: "Your path refreshes as your skill swaps evolve.",
              },
            ].map((recommendation) => (
              <GlassCard key={recommendation.title} whileHover={{ y: -3 }}>
                <recommendation.icon className="size-5 text-primary" />
                <div className="mt-3 text-sm font-semibold">
                  {recommendation.title}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {recommendation.reason}
                </p>
                <button className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Explore <ArrowRight className="size-3" />
                </button>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
