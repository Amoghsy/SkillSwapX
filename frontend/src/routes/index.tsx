import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight, Coins, Users, Radio, ShieldCheck,
  Star, Brain, Globe2, Zap, Check,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { useTicker } from "@/hooks/useTicker";
import { LineChart, Line, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useState, useEffect } from "react";
import { skills as skillsApi, circles as circlesApi } from "@/services/api";

const weeklyActivity = [
  { d: "Mon", taught: 2, learned: 1 },
  { d: "Tue", taught: 1, learned: 2 },
  { d: "Wed", taught: 3, learned: 1 },
  { d: "Thu", taught: 2, learned: 3 },
  { d: "Fri", taught: 1, learned: 2 },
  { d: "Sat", taught: 4, learned: 1 },
  { d: "Sun", taught: 2, learned: 2 },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillSwap X — Learn anything by teaching what you know" },
      { name: "description", content: "An AI-powered peer-to-peer skill exchange. Trade skills, earn credits, join Skill Circles, build a verified portfolio." },
      { property: "og:title", content: "SkillSwap X" },
      { property: "og:description", content: "Trade skills with mentors worldwide. AI-matched, credit-based, community-powered." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [circles, setCircles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    circlesApi.list().then(data => {
      if (data) setCircles(data.slice(0, 6));
    }).catch(() => {});

    skillsApi.search({ limit: 15 }).then(data => {
      if (data && data.results) {
        const uniqueList: any[] = [];
        const seen = new Set();
        for (const r of data.results) {
          const userIdStr = String(r.user_id);
          if (!seen.has(userIdStr)) {
            seen.add(userIdStr);
            uniqueList.push({
              id: userIdStr,
              name: r.user_name,
              avatar: r.avatar_url || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(r.user_name)}&backgroundColor=3b82f6,8b5cf6,06b6d4`,
            });
          }
          if (uniqueList.length >= 6) break;
        }
        setUsers(uniqueList);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <Nav />
      <Hero users={users} />
      <Ecosystem />
      <Circles circles={circles} />
      <LiveActivity />
      <Stats />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground">S</div>
          <div className="font-display text-base font-semibold">SkillSwap <span className="text-gradient">X</span></div>
        </Link>
        <nav aria-label="Primary" className="hidden gap-7 text-sm text-muted-foreground md:flex">
          <a href="#ecosystem" className="hover:text-foreground">Ecosystem</a>
          <a href="#circles" className="hover:text-foreground">Circles</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline-block">Log in</Link>
          <Link to="/signup" className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-primary to-accent px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-lg">
            Get started <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero({ users }: { users: any[] }) {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-mesh" />
      <div aria-hidden className="absolute inset-0 -z-10 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-12 md:py-28">
        <div className="md:col-span-7">
          <motion.div
            initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground"
          >
            <Sparkles className="size-3.5 text-primary" />
            AI-matched skill exchange · 184k learners
          </motion.div>
          <motion.h1
            initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
          >
            Learn anything
            <br />by <span className="text-gradient">teaching</span> what you know.
          </motion.h1>
          <motion.p
            initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-5 max-w-xl text-balance text-base text-muted-foreground md:text-lg"
          >
            SkillSwap X turns your skills into credits, your credits into learning, and your network
            into a verified portfolio. AI matches you with the right mentor — instantly.
          </motion.p>
          <motion.div
            initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_20px_60px_-20px_oklch(0.7_0.18_255/0.55)]">
              Start swapping <ArrowRight className="size-4" />
            </Link>
            <Link to="/marketplace" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10">
              Browse skills
            </Link>
          </motion.div>
          <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-300" /> Verified mentors</span>
            <span className="inline-flex items-center gap-2"><Brain className="size-4 text-primary" /> AI roadmap</span>
            <span className="inline-flex items-center gap-2"><Globe2 className="size-4 text-accent" /> 96 countries</span>
          </div>
        </div>
        <div className="relative md:col-span-5">
          <HeroVisual users={users} />
        </div>
      </div>
    </section>
  );
}

function HeroVisual({ users }: { users: any[] }) {
  const ticker = useTicker(2800);
  return (
    <div className="relative mx-auto aspect-[5/6] max-w-md">
      <motion.div
        initial={false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
        className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-primary/20 via-violet/15 to-cyan-glow/10 blur-2xl"
        aria-hidden
      />
      <GlassCard variant="strong" className="relative h-full overflow-hidden p-0">
        <div className="bg-mesh p-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              AI matching · live
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Trust 92</div>
          </div>
          <div className="mt-6">
            <div className="text-xs text-muted-foreground">Today's match</div>
            <div className="mt-1 font-display text-2xl font-semibold">React Performance &harr; Mandarin</div>
            <div className="mt-1 text-xs text-muted-foreground">12 credits / hr · 4.9★ · Berlin</div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {users.length > 0 ? (
              users.slice(0, 6).map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2"
                >
                  <img src={u.avatar} alt="" className="mx-auto size-9 rounded-full ring-1 ring-white/10" />
                  <div className="mt-1 truncate text-center text-[10px]">{u.name.split(" ")[0]}</div>
                </motion.div>
              ))
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-2 animate-pulse h-16 w-full" />
              ))
            )}
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Activity · last 7d</span>
              <span className="text-emerald-300">+18%</span>
            </div>
            <div className="h-16">
              <ResponsiveContainer>
                <AreaChart data={weeklyActivity}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.70 0.18 255)" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="oklch(0.70 0.18 255)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="taught" stroke="oklch(0.70 0.18 255)" fill="url(#g1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </GlassCard>
      <motion.div
        className="absolute -left-6 top-10 hidden w-44 md:block"
        animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <GlassCard className="p-3">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-amber-300" />
            <div className="text-xs">+12 credits</div>
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">Maya · Design Systems</div>
        </GlassCard>
      </motion.div>
      <motion.div
        className="absolute -right-4 bottom-16 hidden w-48 md:block"
        animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <GlassCard className="p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Live feed</div>
          <ul className="mt-1 space-y-1 text-xs">
            {ticker.slice(0, 3).map((t, i) => (
              <li key={t + i} className="line-clamp-1 text-muted-foreground">· {t}</li>
            ))}
          </ul>
        </GlassCard>
      </motion.div>
    </div>
  );
}

function Ecosystem() {
  const items = [
    { icon: Coins, title: "Earn skill credits", desc: "Every hour you teach earns credits that never expire and never get devalued." },
    { icon: Brain, title: "AI matches mentors", desc: "Tell us your goal — we route you to the right human, instantly, with context." },
    { icon: Users, title: "Join Skill Circles", desc: "Small communities that meet weekly. Local, global, async, live — your call." },
    { icon: ShieldCheck, title: "Verified portfolio", desc: "Sessions, reviews, and trust signals compound into a portable reputation." },
  ];
  return (
    <section id="ecosystem" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-primary">The ecosystem</div>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">A flywheel that compounds your skills.</h2>
          <p className="mt-3 text-muted-foreground">No subscriptions. No gatekeepers. Just a credit you earn by teaching and spend by learning.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {items.map((it, i) => (
            <motion.div key={it.title} initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <GlassCard className="h-full">
                <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20"><it.icon className="size-5 text-primary" /></div>
                <div className="mt-4 font-display text-lg font-semibold">{it.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Circles({ circles }: { circles: any[] }) {
  return (
    <section id="circles" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex items-end justify-between">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-accent">Skill Circles</div>
            <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Small rooms. Big momentum.</h2>
            <p className="mt-3 text-muted-foreground">Weekly meetups, async chats, live workshops. Discover circles forming near you and across the world.</p>
          </div>
          <Link to="/circles" className="hidden text-sm text-primary hover:underline md:inline">Browse all →</Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {circles.slice(0, 6).map((c) => {
            const cover = c.cover || "from-blue-500/30 to-violet-500/20";
            const membersCount = c.member_count || c.members || 0;
            return (
              <GlassCard key={c.id} whileHover={{ y: -4 }} className={`overflow-hidden p-0`}>
                <Link to="/circles/$id" params={{ id: String(c.id) }}>
                  <div className={`relative h-32 bg-gradient-to-br ${cover} bg-mesh`}>
                    {c.live && (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-200 backdrop-blur">
                        <Radio className="size-3 animate-pulse" /> LIVE
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 p-5">
                    <div className="font-display text-lg font-semibold">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{c.topic || c.description}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{parseInt(membersCount).toLocaleString()}</span>
                      <span>· {c.weekly_schedule || "Weekly"}</span>
                    </div>
                  </div>
                </Link>
              </GlassCard>
            );
          })}
          {circles.length === 0 && (
            <div className="col-span-3 py-6 text-center text-xs text-muted-foreground">No active circles found.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function LiveActivity() {
  const ticker = useTicker(2400);
  return (
    <section className="border-t border-white/5 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-cyan-glow">Live network</div>
          <h2 className="mt-3 font-display text-4xl font-semibold">Always something happening.</h2>
          <p className="mt-3 max-w-md text-muted-foreground">A pulse from mentors and learners around the world — every minute, every time zone.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">96 countries</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">12 languages</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">9.8k sessions / week</span>
          </div>
        </div>
        <GlassCard variant="strong" className="h-80 overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Live feed</div>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> realtime</span>
          </div>
          <ul className="space-y-2">
            {ticker.map((t, i) => (
              <motion.li
                key={t + i}
                initial={false} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm"
              >
                <span className="size-2 rounded-full bg-primary animate-pulse-ring" />
                <span className="flex-1">{t}</span>
                <span className="text-[10px] text-muted-foreground">just now</span>
              </motion.li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { v: "184k+", l: "Active learners" },
    { v: "9.8k", l: "Sessions / week" },
    { v: "12", l: "Languages" },
    { v: "4.9★", l: "Avg rating" },
  ];
  return (
    <section className="border-t border-white/5 py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="font-display text-4xl font-semibold text-gradient md:text-5xl">{s.v}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { name: "Maya Lin", role: "Designer · Berlin", quote: "I taught design systems and learned Mandarin — same week. The credit model just works." },
    { name: "Diego Alvarez", role: "ML Engineer · CDMX", quote: "My RAG workshop pays for my piano lessons. SkillSwap turned my hobby into an economy." },
    { name: "Hana Park", role: "Yoga Instructor · Seoul", quote: "I've built a circle of 200 people that meets weekly. It's the most fulfilling thing I do online." },
  ];
  return (
    <section className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-5">
        <h2 className="font-display text-4xl font-semibold md:text-5xl">Loved by makers, mentors, and lifelong learners.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map((t) => (
            <GlassCard key={t.name} className="h-full">
              <div className="flex items-center gap-1 text-amber-300">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/90">"{t.quote}"</p>
              <div className="mt-5 text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.role}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    { name: "Explore", price: "Free", desc: "Earn and spend credits forever.", features: ["Unlimited swaps", "Join 3 circles", "AI matchmaking", "Basic portfolio"], cta: "Start free" },
    { name: "Pro", price: "$12", suffix: "/mo", desc: "For serious learners and mentors.", features: ["Unlimited circles", "Verified badge", "Advanced analytics", "Priority matching", "Live workshops"], cta: "Go Pro", featured: true },
    { name: "Teams", price: "$8", suffix: "/seat", desc: "For schools, bootcamps, & companies.", features: ["Org analytics", "SSO & SCIM", "Custom circles", "API access", "Dedicated success"], cta: "Talk to sales" },
  ];
  return (
    <section id="pricing" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-primary">Pricing</div>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Pay with credits — or upgrade.</h2>
          <p className="mt-3 text-muted-foreground">The economy is free. Pro and Teams unlock power tools, analytics, and verification.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <GlassCard key={t.name} variant={t.featured ? "strong" : "default"} glow={t.featured ? "primary" : "none"} className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-semibold">{t.name}</div>
                {t.featured && <span className="rounded-full bg-gradient-to-r from-primary to-accent px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Most loved</span>}
              </div>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-display text-4xl font-semibold">{t.price}</span>
                {t.suffix && <span className="pb-1 text-sm text-muted-foreground">{t.suffix}</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="size-4 text-emerald-300" /> {f}</li>
                ))}
              </ul>
              <button className={`mt-6 rounded-xl px-4 py-2.5 text-sm font-semibold ${t.featured ? "bg-gradient-to-r from-primary to-accent text-primary-foreground" : "border border-white/10 bg-white/5 hover:bg-white/10"}`}>
                {t.cta}
              </button>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "How do skill credits work?", a: "You earn 1 credit per hour taught. Spend them on any session, any time, with any mentor." },
    { q: "Is there a fee?", a: "The credit economy is free forever. Pro and Teams add power tools — verification, analytics, and priority matching." },
    { q: "How are mentors verified?", a: "Trust scores compound from session reviews, portfolio links, and identity checks. Verified mentors get a badge." },
    { q: "What about safety?", a: "We monitor abuse and fraud signals continuously and route flagged behavior to a 24/7 moderation team." },
  ];
  return (
    <section id="faq" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-3xl px-5">
        <h2 className="font-display text-3xl font-semibold md:text-4xl">Frequently asked</h2>
        <div className="mt-8 divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03]">
          {faqs.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <span className="text-sm font-semibold">{f.q}</span>
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent font-display font-bold text-primary-foreground">S</div>
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} SkillSwap X · Built for learners.</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Trust & Safety</a><a href="#">Brand</a>
        </div>
      </div>
    </footer>
  );
}
