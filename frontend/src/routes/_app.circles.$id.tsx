import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { GlassCard } from "@/components/GlassCard";
import { Users, Activity, MapPin, CalendarClock, Radio, ArrowLeft, Loader2, Check } from "lucide-react";
import { circles } from "@/services/api";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/circles/$id")({
  loader: async ({ params }) => {
    try {
      const data = await circles.get(params.id);
      if (!data) throw notFound();
      return { circle: data };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.circle?.name ?? "Circle"} · SkillSwap X` }] }),
  notFoundComponent: () => <div className="grid min-h-dvh place-items-center text-muted-foreground"><Link to="/circles" className="text-primary hover:underline">Back to circles</Link></div>,
  component: CircleDetail,
});

function CircleDetail() {
  const { circle: initialCircle } = Route.useLoaderData() as { circle: any };
  const user = useApp((s) => s.user);
  const navigate = useNavigate();
  
  const [circle, setCircle] = useState(initialCircle);
  const [joining, setJoining] = useState(false);

  const mentors = (circle.members || [])
    .filter((m: any) => m.role === "mentor" || m.role === "admin")
    .map((m: any) => ({
      id: String(m.id),
      name: m.name,
      avatar: m.avatar_url || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(m.name)}&backgroundColor=3b82f6,8b5cf6,06b6d4`,
      location: "Online",
    }));

  const isJoined = (circle.members || []).some((m: any) => String(m.id) === String(user?.id));

  const handleToggleJoin = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    setJoining(true);
    try {
      if (isJoined) {
        // Leave
        await circles.leave(circle.id);
        toast.success(`Left ${circle.name}`);
      } else {
        // Join
        await circles.join(circle.id);
        toast.success(`Joined ${circle.name}! Welcome to the circle.`);
      }
      
      // Reload circle data
      const updated = await circles.get(circle.id);
      if (updated) setCircle(updated);
    } catch (err: any) {
      console.error("Circle join/leave failed:", err);
      toast.error(err?.message || "Operation failed. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const cover = circle.cover || "from-blue-500/30 to-violet-500/20";

  return (
    <>
      <TopNav title={circle.name} />
      <div className="space-y-6 px-4 py-6 md:px-8">
        <Link to="/circles" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Back to circles</Link>
        <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${cover} bg-mesh p-8`}>
          {circle.live && <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-red-500/30 px-3 py-1 text-[10px] font-semibold text-red-100 backdrop-blur"><Radio className="size-3 animate-pulse" /> LIVE NOW</span>}
          <h1 className="font-display text-4xl font-semibold">{circle.name}</h1>
          <p className="mt-2 max-w-xl text-foreground/90">{circle.topic || circle.description || "Discussion group"}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5"><Users className="size-4" /> {parseInt(circle.member_count || circle.members?.length || 0).toLocaleString()} members</span>
            <span className="inline-flex items-center gap-1.5"><Activity className="size-4" /> Activity 85/100</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {circle.location || "Online"}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-4" /> {circle.weekly_schedule || "Weekly schedule"}</span>
          </div>
          <button
            onClick={handleToggleJoin}
            disabled={joining}
            className={`mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 cursor-pointer transition ${
              isJoined 
                ? "border border-white/10 bg-white/5 hover:bg-white/10 text-foreground" 
                : "bg-foreground/95 text-background hover:bg-foreground"
            }`}
          >
            {joining ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isJoined ? (
              <>
                <Check className="size-4" /> Joined
              </>
            ) : (
              "Join circle"
            )}
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <div className="text-sm font-semibold">Upcoming events</div>
            <ul className="mt-3 space-y-3">
              {[
                { d: circle.weekly_schedule || "Thu, 7:00 PM", t: "Skill Circle — sync discussion session", h: circle.creator_name || "Community" },
                { d: "Sat, 11:00 AM", t: "Async project workshop", h: "Mentors" },
                { d: "Tue, 9:00 PM", t: "Show & tell — showcase your skills", h: "Community" },
              ].map((e) => (
                <li key={e.t} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="text-xs text-muted-foreground">{e.d}</div>
                  <div className="mt-0.5 text-sm font-medium">{e.t}</div>
                  <div className="text-xs text-muted-foreground">Hosted by {e.h}</div>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard>
            <div className="text-sm font-semibold">Mentors & Core Members</div>
            <ul className="mt-3 space-y-3">
              {mentors.map((m: any) => (
                <li key={m.id} className="flex items-center gap-3">
                  <img src={m.avatar} className="size-9 rounded-full ring-1 ring-white/10" alt="" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.location}</div>
                  </div>
                </li>
              ))}
              {mentors.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">No core mentors listed yet.</div>
              )}
            </ul>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="text-sm font-semibold">Recent chat</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="rounded-xl bg-white/[0.03] p-3"><span className="font-medium">Admin:</span> <span className="text-muted-foreground">Welcome to the circle! Connect, share tokens, and coordinate peer sessions.</span></li>
            <li className="rounded-xl bg-white/[0.03] p-3"><span className="font-medium">System:</span> <span className="text-muted-foreground">This circle met twice this week. Earn credits by leading sync sessions.</span></li>
          </ul>
        </GlassCard>
      </div>
    </>
  );
}

