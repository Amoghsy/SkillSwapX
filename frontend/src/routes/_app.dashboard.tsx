import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { GlassCard } from "@/components/GlassCard";
import { CreditWallet } from "@/components/CreditWallet";
import { SkillRadar } from "@/components/charts/SkillRadar";
import { WeeklyBars } from "@/components/charts/WeeklyBars";
import { ActivityHeatmap } from "@/components/charts/ActivityHeatmap";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { MentorCard } from "@/components/MentorCard";
import { CircleCard } from "@/components/CircleCard";
import { useApp } from "@/lib/store";
import { useTicker } from "@/hooks/useTicker";
import { Sparkles, CalendarClock, Radio, ArrowRight, Brain, Target, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { sessions, swaps, skills, circles } from "@/services/api";


export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · SkillSwap X" }] }),
  component: Dashboard,
});

function Dashboard() {
  const user = useApp((s) => s.user);
  const swapRefreshTick = useApp((s) => s.swapRefreshTick);
  const ticker = useTicker(3000);
  const [mounted, setMounted] = useState(false);
  
  // Dynamic API state
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [activeSwaps, setActiveSwaps] = useState<any[]>([]);
  const [suggestedMentors, setSuggestedMentors] = useState<any[]>([]);
  const [nearbyCircles, setNearbyCircles] = useState<any[]>([]);
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // 1. Fetch sessions
        const sessionsData = await sessions.list().catch(() => []);
        const mappedSessions = (sessionsData || [])
          .filter((s: any) => s.attendance === "scheduled")
          .map((s: any) => {
            const isMentor = String(s.mentor_id) === String(user?.id);
            return {
              id: String(s.id),
              with: String(isMentor ? s.learner_id : s.mentor_id),
              withName: isMentor ? s.learner_name : s.mentor_name,
              withAvatar: isMentor ? s.learner_avatar : s.mentor_avatar,
              skill: s.skill_taught || "Skill Session",
              startsAt: s.start_time,
              duration: parseInt(s.duration_minutes) || 60,
              kind: "1:1",
              status: "upcoming",
            };
          });
        setUpcomingSessions(mappedSessions);

        // 2. Fetch swaps
        const swapsData = await swaps.list().catch(() => []);
        const mappedSwaps = (swapsData || []).map((sw: any) => ({
          id: String(sw.id),
          status: sw.status,
          credits: sw.credits_locked,
          skillRequested: sw.skill_requested,
          skillOffered: sw.skill_offered,
          withName: String(sw.sender_id) === String(user?.id) ? sw.receiver_name : sw.sender_name,
        }));
        setActiveSwaps(mappedSwaps);

        // 3. Fetch suggested mentors via skills.search
        const mentorsData = await skills.search({ limit: 10 }).catch(() => null);
        const uniqueMentors: any[] = [];
        const seenUserIds = new Set();
        
        for (const m of (mentorsData?.results || [])) {
          const userIdStr = String(m.user_id);
          if (userIdStr !== String(user?.id) && !seenUserIds.has(userIdStr)) {
            seenUserIds.add(userIdStr);
            uniqueMentors.push({
              id: userIdStr,
              name: m.user_name,
              handle: m.user_name.toLowerCase().replace(/\s+/g, ""),
              avatar: m.avatar_url || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(m.user_name)}&backgroundColor=3b82f6,8b5cf6,06b6d4`,
              bio: m.description || "Top peer mentor on SkillSwap X.",
              location: m.location || "Online",
              trust: parseFloat(m.trust_score) || 50,
              reputation: Math.round((parseFloat(m.trust_score) / 20) * 10) / 10 || 4.5,
              verified: m.trust_tier === "Gold" || m.trust_tier === "Mentor Elite",
              online: true,
              skills: [{ name: m.skill_name, level: m.proficiency === "Advanced" ? 5 : 3, category: m.category }],
            });
          }
          if (uniqueMentors.length >= 3) break;
        }
        setSuggestedMentors(uniqueMentors);

        // 4. Fetch nearby circles
        const circlesData = await circles.list().catch(() => []);
        const mappedCircles = (circlesData || []).slice(0, 2).map((c: any) => ({
          id: String(c.id),
          name: c.name,
          topic: c.topic || c.description,
          members: parseInt(c.members_count || c.members || 1),
          activity: 85,
          location: c.location || "Online",
          cadence: c.weekly_schedule || "Weekly",
          cover: c.cover || "from-blue-500/30 to-violet-500/20",
          live: false,
          mentors: [],
        }));
        setNearbyCircles(mappedCircles);

        // 5. Fetch AI Recommendations from DB/Gemini
        const recsData = await skills.recommendations().catch(() => []);
        setAiRecs(recsData || []);

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      loadDashboardData();
    }
  }, [user, swapRefreshTick]);

  if (!user) return null;

  const hour = mounted ? new Date().getHours() : 9;
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <TopNav title="Dashboard" />
      <div className="space-y-6 px-4 py-6 md:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-display text-3xl font-semibold md:text-4xl">{greet}, <span className="text-gradient">{user.name.split(" ")[0]}</span></h2>
          <p className="mt-1 text-sm text-muted-foreground">Welcome to your SkillSwap X center. Trade skills, grow your portfolio.</p>
        </motion.div>

        {loading ? (
          <div className="grid h-60 place-items-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Gathering your network stream...</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Left column */}
            <div className="space-y-5 lg:col-span-8">
              {/* AI recommendations */}
              <GlassCard variant="strong">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2"><Sparkles className="size-4 text-primary" /><span className="text-xs uppercase tracking-widest text-muted-foreground">AI recommendations</span></div>
                  <Link to="/ai" className="text-xs text-primary hover:underline">Open AI Center →</Link>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {aiRecs.map((r, i) => (
                    <motion.div key={r.title || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">{r.tag}</div>
                        <div className="mt-1 text-sm font-semibold leading-snug">{r.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{r.reason}</div>
                      </div>
                      <Link to="/marketplace" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
                        Explore swap <ArrowRight className="size-3" />
                      </Link>
                    </motion.div>
                  ))}
                  {aiRecs.length === 0 && (
                    <div className="col-span-3 py-6 text-center text-xs text-muted-foreground">AI recommendations will update as you teach and learn skills.</div>
                  )}
                </div>
              </GlassCard>

              {/* Upcoming + Active swaps */}
              <div className="grid gap-5 md:grid-cols-2">
                <GlassCard>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Upcoming sessions</div>
                    <CalendarClock className="size-4 text-muted-foreground" />
                  </div>
                  <ul className="mt-3 space-y-3">
                    {upcomingSessions.map((s) => {
                      const avatar = s.withAvatar || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(s.withName)}&backgroundColor=3b82f6,8b5cf6,06b6d4`;
                      return (
                        <li key={s.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                          <img src={avatar} className="size-10 rounded-full ring-1 ring-white/10" alt="" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{s.skill}</div>
                            <div className="text-xs text-muted-foreground">with {s.withName} · {s.kind}</div>
                          </div>
                          <div className="text-right text-xs">
                            <div>{mounted ? format(new Date(s.startsAt), "p") : ""}</div>
                            <div className="text-muted-foreground">{mounted ? format(new Date(s.startsAt), "MMM d") : ""}</div>
                          </div>
                        </li>
                      );
                    })}
                    {upcomingSessions.length === 0 && (
                      <div className="py-6 text-center text-xs text-muted-foreground">No upcoming sessions. Schedule one in the marketplace!</div>
                    )}
                  </ul>
                </GlassCard>

                <GlassCard>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Active swaps</div>
                    <Target className="size-4 text-muted-foreground" />
                  </div>
                  {activeSwaps.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {activeSwaps.slice(0, 3).map((sw) => (
                        <li key={sw.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs">
                          <div>
                            <div className="font-semibold text-foreground">{sw.skillRequested} &harr; {sw.skillOffered}</div>
                            <div className="text-muted-foreground mt-0.5">with {sw.withName}</div>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 font-medium uppercase text-[9px] ${sw.status === "accepted" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                            {sw.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                        <div><ProgressRing value={0} label="React" /></div>
                        <div><ProgressRing value={0} label="Mandarin" /></div>
                        <div><ProgressRing value={0} label="Piano" /></div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="text-center">0 sessions</div>
                        <div className="text-center">0 sessions</div>
                        <div className="text-center">0 sessions</div>
                      </div>
                    </>
                  )}
                </GlassCard>
              </div>

              {/* Weekly activity */}
              <GlassCard>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Weekly activity</div>
                    <div className="text-xs text-muted-foreground">Hours taught vs learned</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Taught</span>
                    <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" /> Learned</span>
                  </div>
                </div>
                <div className="mt-3"><WeeklyBars /></div>
              </GlassCard>

              {/* Suggested mentors */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">Suggested mentors</div>
                  <Link to="/marketplace" className="text-xs text-primary hover:underline">Browse all →</Link>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {suggestedMentors.map((u, i) => <MentorCard key={`mentor-${u.id}-${i}`} user={u} />)}
                  {suggestedMentors.length === 0 && (
                    <div className="col-span-3 py-6 text-center text-xs text-muted-foreground">No recommendations available yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5 lg:col-span-4">
              <CreditWallet />

              <GlassCard>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Skill analytics</div>
                  <Brain className="size-4 text-muted-foreground" />
                </div>
                <SkillRadar />
              </GlassCard>

              <GlassCard>
                <div className="text-sm font-semibold">Consistency heatmap</div>
                <div className="mt-3"><ActivityHeatmap /></div>
              </GlassCard>

              <GlassCard>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">Live in your network</div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> realtime</span>
                </div>
                <ul className="space-y-2">
                  {ticker.slice(0, 4).map((t, i) => (
                    <li key={t + i} className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-xs text-muted-foreground">· {t}</li>
                  ))}
                </ul>
              </GlassCard>

              <div>
                <div className="mb-3 text-sm font-semibold">Nearby circles</div>
                <div className="space-y-3">
                  {nearbyCircles.map((c) => <CircleCard key={c.id} circle={c} />)}
                  {nearbyCircles.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground">No active circles near you.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

