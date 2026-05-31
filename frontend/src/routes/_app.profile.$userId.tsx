import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { GlassCard } from "@/components/GlassCard";
import { TrustBadge } from "@/components/TrustBadge";
import { SkillRadar } from "@/components/charts/SkillRadar";
import { AvailabilityDot } from "@/components/AvailabilityDot";
import { users, auth } from "@/services/api";
import { Star, MapPin, BadgeCheck, Award, Clock, MessageCircle } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/profile/$userId")({
  head: ({ params }) => ({ meta: [{ title: `Profile · SkillSwap X` }, { name: "description", content: `User profile for ${params.userId}` }] }),
  loader: async ({ params }) => {
    try {
      if (params.userId === "u_me" || params.userId === "me") {
        const data = await auth.me();
        if (!data) throw notFound();
        return { user: data, isMe: true };
      } else {
        const numericId = parseInt(params.userId);
        if (isNaN(numericId)) throw notFound();
        const data = await users.profile(String(numericId));
        if (!data) throw notFound();
        return { user: data, isMe: false };
      }
    } catch {
      throw notFound();
    }
  },
  notFoundComponent: () => <div className="grid min-h-dvh place-items-center"><p className="text-muted-foreground">User not found · <Link to="/marketplace" className="text-primary hover:underline">Browse Marketplace</Link></p></div>,
  component: Profile,
});

function Profile() {
  const { user: rawUser, isMe } = Route.useLoaderData() as { user: any; isMe: boolean };

  // Map database response to frontend compatible shape
  const user = {
    id: String(rawUser.id),
    name: rawUser.name,
    handle: rawUser.name.toLowerCase().replace(/\s+/g, ""),
    avatar: rawUser.avatar_url || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(rawUser.name)}&backgroundColor=3b82f6,8b5cf6,06b6d4`,
    bio: rawUser.bio || "This user hasn't written a bio yet.",
    location: rawUser.location || "Online",
    trust: parseFloat(rawUser.trust_score) || 50,
    reputation: Math.round((parseFloat(rawUser.stats?.avg_rating || rawUser.trust_score / 20) || 4.5) * 10) / 10,
    credits: parseInt(rawUser.credits) || 0,
    verified: rawUser.verification_status === "verified",
    online: true,
    skills: (rawUser.skills_offered || rawUser.skills || []).map((s: any) => ({
      name: s.skill_name || s.name,
      level: s.proficiency === "Advanced" ? 5 : s.proficiency === "Intermediate" ? 3 : 1,
    })),
  };

  return (
    <>
      <TopNav title="Profile" />
      <div className="px-4 py-6 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-mesh">
          <div className="h-40 bg-gradient-to-br from-primary/30 via-accent/20 to-cyan-glow/20" />
          <div className="-mt-12 flex flex-col items-start gap-5 px-6 pb-6 md:flex-row md:items-end">
            <div className="relative">
              <img src={user.avatar} className="size-24 rounded-3xl ring-4 ring-background" alt="" />
              <span className="absolute -bottom-1 -right-1"><AvailabilityDot online={user.online} /></span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-semibold">{user.name}</h1>
                {user.verified && <span className="inline-flex items-center gap-1 rounded-full bg-cyan-glow/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-glow"><BadgeCheck className="size-3" /> Verified mentor</span>}
              </div>
              <div className="text-sm text-muted-foreground">@{user.handle} · <MapPin className="-mt-0.5 inline size-3.5" /> {user.location}</div>
              <p className="mt-2 max-w-2xl text-sm text-foreground/90">{user.bio}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-amber-300"><Star className="size-3.5 fill-current" /> {user.reputation}</span>
                <TrustBadge score={user.trust} />
                {isMe && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-muted-foreground">{user.credits} credits</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 cursor-pointer"><MessageCircle className="size-4" /> Message</button>
              <button className="rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-2 text-sm font-semibold text-primary-foreground cursor-pointer">Book session</button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <GlassCard>
              <div className="text-sm font-semibold">Skill graph</div>
              <SkillRadar />
            </GlassCard>

            <GlassCard>
              <div className="text-sm font-semibold">Skill badges</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {user.skills.map((s: any) => (
                  <span key={s.name} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs">
                    <Award className="size-3.5 text-primary" /> {s.name}
                    <span className="text-[10px] text-muted-foreground">Lv {s.level}</span>
                  </span>
                ))}
                {user.skills.length === 0 && (
                  <div className="text-xs text-muted-foreground">No badges yet.</div>
                )}
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-sm font-semibold">Session history</div>
              <ul className="mt-3 divide-y divide-white/5">
                <li className="py-6 text-center text-sm text-muted-foreground">No public sessions completed yet.</li>
              </ul>
            </GlassCard>
          </div>

          <div className="space-y-5 lg:col-span-4">
            <GlassCard>
              <div className="text-sm font-semibold">Reviews</div>
              <div className="mt-3 space-y-3">
                {[
                  { who: "Noah B.", text: "Calm, structured, deeply technical. Walked me through Raft step by step." },
                  { who: "Elena R.", text: "Helped me sharpen my essay outline in 45 minutes. Highly recommend." },
                  { who: "Aiko T.", text: "Patient and curious — a real mentor." },
                ].map((r) => (
                  <div key={r.who} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <div className="flex items-center gap-1 text-amber-300"><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /></div>
                    <p className="mt-1 text-xs text-foreground/90">"{r.text}"</p>
                    <div className="mt-1 text-[10px] text-muted-foreground">— {r.who}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-sm font-semibold">Achievements</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["Architect", "Polyglot", "10x Mentor", "Streak 30", "First Circle", "Top 1%"].map((a) => (
                  <div key={a} className="rounded-xl border border-white/5 bg-gradient-to-br from-primary/10 to-accent/10 p-3 text-center">
                    <Award className="mx-auto size-5 text-primary" />
                    <div className="mt-1 text-[10px] text-muted-foreground">{a}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
}

