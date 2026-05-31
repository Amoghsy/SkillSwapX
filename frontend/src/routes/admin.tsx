import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { GlassCard } from "@/components/GlassCard";
const now = Date.now();
const iso = (offsetMin: number) => new Date(now + offsetMin * 60_000).toISOString();

const adminKpis = {
  mau: 184_212, dau: 42_900, sessions: 9_847, revenue: 218_400, flagged: 23, fraud: 4,
};
const adminTrend = Array.from({ length: 14 }, (_, i) => ({
  d: `D${i+1}`,
  users: 30_000 + Math.round(Math.random() * 18_000),
  sessions: 6_000 + Math.round(Math.random() * 4_000),
}));
const adminFlags = [
  { id:"f1", user:"@anon_42", reason:"Suspicious credit transfer", severity:"high", at: iso(-30) },
  { id:"f2", user:"@nightowl", reason:"Reported by 3 users · spam", severity:"med", at: iso(-180) },
  { id:"f3", user:"@deal_hunt", reason:"Duplicate accounts detected", severity:"high", at: iso(-360) },
  { id:"f4", user:"@yoga_zen", reason:"Profile content review", severity:"low", at: iso(-900) },
];
import { Users, Activity, DollarSign, AlertTriangle, ShieldAlert, Search, ArrowLeft } from "lucide-react";
import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console · SkillSwap X" },
      { name: "description", content: "Operational dashboard for SkillSwap X — growth, trust & safety, and account moderation." },
    ],
  }),
  component: Admin,
});

const Kpi = ({ icon: Icon, label, value, delta }: { icon: any; label: string; value: string; delta: string }) => (
  <GlassCard className="relative overflow-hidden">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <Icon className="size-4 text-primary" />
    </div>
    <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    <div className="mt-1 text-xs text-emerald-300">{delta}</div>
  </GlassCard>
);

function Admin() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="border-b border-white/5 bg-sidebar/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-8">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Back to app
          </Link>
          <div className="ml-2 flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground"><ShieldAlert className="size-4" /></div>
            <div>
              <div className="font-display text-sm font-semibold">SkillSwap <span className="text-gradient">X</span> · Admin</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trust, safety &amp; growth</div>
            </div>
          </div>
        </div>
      </div>

      <TopNav title="Admin Console" />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={Users} label="MAU" value={adminKpis.mau.toLocaleString()} delta="+12.4% MoM" />
          <Kpi icon={Activity} label="Sessions / day" value={adminKpis.sessions.toLocaleString()} delta="+6.1% WoW" />
          <Kpi icon={DollarSign} label="Revenue (mo)" value={`$${(adminKpis.revenue/1000).toFixed(0)}k`} delta="+18% MoM" />
          <Kpi icon={AlertTriangle} label="Flagged" value={String(adminKpis.flagged)} delta={`${adminKpis.fraud} confirmed fraud`} />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Growth · last 14 days</div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Users</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" /> Sessions</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={adminTrend}>
                  <defs>
                    <linearGradient id="u" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.70 0.18 255)" stopOpacity={0.5} /><stop offset="100%" stopColor="oklch(0.70 0.18 255)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.62 0.22 295)" stopOpacity={0.4} /><stop offset="100%" stopColor="oklch(0.62 0.22 295)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="d" tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip contentStyle={{ background: "oklch(0.22 0.04 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="users" stroke="oklch(0.70 0.18 255)" fill="url(#u)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sessions" stroke="oklch(0.62 0.22 295)" fill="url(#s)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert className="size-4 text-red-400" /> Trust monitor</div>
            <div className="mt-3 space-y-3">
              {[
                { l: "Account takeover risk", v: "Low", c: "text-emerald-300" },
                { l: "Spam reports (24h)", v: "12", c: "text-amber-300" },
                { l: "Identity verifications", v: "98.4%", c: "text-emerald-300" },
                { l: "Credit anomaly score", v: "0.21", c: "text-emerald-300" },
              ].map((r) => (
                <div key={r.l} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm">
                  <span className="text-muted-foreground">{r.l}</span>
                  <span className={`font-semibold ${r.c}`}>{r.v}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="mb-3 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm font-semibold">Flagged accounts</div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Search users…" className="h-9 w-64 rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none focus:border-primary/50" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-white/5">
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Reason</th>
                  <th className="py-2 pr-3">Severity</th>
                  <th className="py-2 pr-3">Reported</th>
                  <th className="py-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminFlags.map((f) => (
                  <tr key={f.id} className="border-b border-white/5">
                    <td className="py-3 pr-3 font-medium">{f.user}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{f.reason}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${f.severity === "high" ? "bg-red-500/15 text-red-300" : f.severity === "med" ? "bg-amber-500/15 text-amber-300" : "bg-white/10 text-muted-foreground"}`}>{f.severity}</span>
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(f.at))} ago</td>
                    <td className="py-3 pr-3 text-right">
                      <button className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5">Review</button>
                      <button className="ml-1 rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-200">Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
