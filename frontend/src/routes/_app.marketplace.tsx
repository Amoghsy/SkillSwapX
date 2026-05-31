import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { SkillCard } from "@/components/SkillCard";
export type SkillCategory =
  | "Engineering" | "Design" | "Data" | "Business"
  | "Languages" | "Music" | "Wellness" | "Marketing"
  | "Photography" | "Writing" | "Finance" | "Crafts";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { skills } from "@/services/api";

export const Route = createFileRoute("/_app/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace · SkillSwap X" }, { name: "description", content: "Discover mentors and skills. Filter by category, level, and credits." }] }),
  component: Marketplace,
});

const CATS: ("All" | SkillCategory)[] = ["All", "Engineering", "Design", "Data", "Languages", "Music", "Wellness", "Marketing", "Photography", "Writing", "Finance", "Crafts", "Business"];

const mapCategoryToDb = (cat: string) => {
  if (cat === "All") return "";
  if (cat === "Engineering" || cat === "Data") return "Technology";
  if (cat === "Design" || cat === "Photography" || cat === "Crafts") return "Arts & Design";
  if (cat === "Wellness") return "Health & Fitness";
  if (cat === "Writing") return "Soft Skills";
  return cat;
};

function Marketplace() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [onlyAvail, setOnlyAvail] = useState(false);
  
  // Dynamic API state
  const [results, setResults] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch search results from DB
  useEffect(() => {
    let active = true;
    async function performSearch() {
      try {
        setLoading(true);
        const mappedCat = mapCategoryToDb(cat);
        const searchData = await skills.search({
          q: q,
          category: mappedCat,
        });
        if (!active) return;
        
        if (searchData && searchData.results) {
          setResults(searchData.results);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Marketplace search failed:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    performSearch();
    return () => {
      active = false;
    };
  }, [q, cat]);

  // Fetch trending
  useEffect(() => {
    skills.search({ limit: 4 }).then((data: any) => {
      if (data && data.results) {
        setTrending(data.results.slice(0, 4));
      }
    }).catch((err: any) => console.error("Failed to load trending skills:", err));
  }, []);

  return (
    <>
      <TopNav title="Marketplace" />
      <div className="space-y-6 px-4 py-6 md:px-8">
        <GlassCard variant="strong" className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search skills"
                placeholder="Search skills, tags, mentors…"
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none focus:border-primary/50 text-foreground"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10 cursor-pointer"><Sparkles className="size-4 text-primary" /> AI Smart filter</button>
            <button onClick={() => setOnlyAvail((v) => !v)} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm cursor-pointer ${onlyAvail ? "border-primary/50 bg-primary/15 text-foreground" : "border-white/10 bg-white/5"}`}><SlidersHorizontal className="size-4" /> Available now</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs cursor-pointer ${cat === c ? "border-primary/60 bg-gradient-to-r from-primary/30 to-accent/30 text-foreground" : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"}`}>
                {c}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Trending */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Trending this week</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {trending.map((s) => <SkillCard key={s.listing_id || s.id} skill={s} />)}
            {trending.length === 0 && (
              <div className="col-span-4 py-6 text-center text-xs text-muted-foreground">No trending skills found.</div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{results.length} results</h2>
            <span className="text-xs text-muted-foreground">Sorted by trust score</span>
          </div>

          {loading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : results.length === 0 ? (
            <GlassCard className="grid place-items-center py-16 text-center">
              <p className="text-sm text-muted-foreground">No skills match. Try clearing filters.</p>
            </GlassCard>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((s) => <SkillCard key={s.listing_id || s.id} skill={s} />)}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

