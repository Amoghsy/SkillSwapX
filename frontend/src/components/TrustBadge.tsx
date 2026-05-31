import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrustBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 90 ? "from-emerald-400/30 to-emerald-500/10 text-emerald-300"
    : score >= 75 ? "from-blue-400/30 to-violet-500/10 text-blue-200"
    : "from-amber-400/30 to-amber-500/10 text-amber-200";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-gradient-to-r px-2.5 py-1 text-xs font-medium", tone, className)}>
      <ShieldCheck className="size-3.5" aria-hidden />
      Trust {score}
    </span>
  );
}
