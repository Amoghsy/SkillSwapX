import { createFileRoute, Link } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot")({
  head: () => ({ meta: [{ title: "Reset password · SkillSwap X" }] }),
  component: Forgot,
});

function Forgot() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background bg-mesh px-5">
      <div className="w-full max-w-md">
        <Link to="/login" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="size-3.5" /> Back to sign in</Link>
        <GlassCard variant="strong" className="space-y-4 p-8">
          <h1 className="font-display text-2xl font-semibold">Reset your password</h1>
          <p className="text-sm text-muted-foreground">We'll email you a secure link.</p>
          <input type="email" placeholder="you@example.com" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-primary/50" />
          <button className="w-full rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground">Send reset link</button>
        </GlassCard>
      </div>
    </div>
  );
}
