import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { CircleCard } from "@/components/CircleCard";
import { GlassCard } from "@/components/GlassCard";
import { useEffect, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { circles } from "@/services/api";

export const Route = createFileRoute("/_app/circles")({
  head: () => ({ meta: [{ title: "Skill Circles · SkillSwap X" }] }),
  component: Circles,
});

const WEEK = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function Circles() {
  const [allCircles, setAllCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadCircles() {
      try {
        setLoading(true);
        const data = await circles.list();
        if (!active) return;
        if (data) {
          setAllCircles(data);
        }
      } catch (err) {
        console.error("Failed to load circles:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCircles();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <TopNav title="Skill Circles" />
      <div className="space-y-6 px-4 py-6 md:px-8">
        {loading ? (
          <div className="grid h-60 place-items-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            <GlassCard variant="strong" className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-primary">Featured</div>
                  <h2 className="mt-1 font-display text-2xl font-semibold">Find your people. Meet weekly.</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Discover circles forming around your interests — local, remote, async.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {allCircles.slice(0, 4).map((c) => <CircleCard key={c.id} circle={c} />)}
                {allCircles.length === 0 && (
                  <div className="col-span-2 py-6 text-center text-xs text-muted-foreground">No active skill circles yet.</div>
                )}
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="size-4 text-accent" /> This week</div>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {WEEK.map((d, i) => (
                  <div key={d} className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{d}</div>
                    <div className="mt-1 font-display text-base font-semibold">{14 + i}</div>
                    <div className="mt-1 text-[10px] text-primary">{[2,3,1,4,2,5,1][i]} live</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { time: "Thu · 7 PM", title: "Frontend Forge", live: true },
                  { time: "Fri · 6 PM", title: "Polyglots Café" },
                  { time: "Sat · 11 AM", title: "Bengaluru Builders" },
                ].map((e) => (
                  <div key={e.title} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm">
                    <div>
                      <div className="font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.time}</div>
                    </div>
                    {e.live && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-200">LIVE</span>}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {!loading && allCircles.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">All circles</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allCircles.map((c) => <CircleCard key={c.id} circle={c} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

