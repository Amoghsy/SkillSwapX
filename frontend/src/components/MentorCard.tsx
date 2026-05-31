import { GlassCard } from "./GlassCard";
import { AvailabilityDot } from "./AvailabilityDot";
import { TrustBadge } from "./TrustBadge";
import { Star, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";

export type UserType = {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  online: boolean;
  verified: boolean;
  skills: { name: string }[];
  reputation: number;
  trust: number;
};

export function MentorCard({ user }: { user: UserType }) {
  const navigate = useNavigate();
  return (
    <GlassCard whileHover={{ y: -3 }} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={user.avatar} alt="" className="size-12 rounded-2xl ring-1 ring-white/10" />
          <span className="absolute -bottom-1 -right-1"><AvailabilityDot online={user.online} /></span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link to="/profile/$userId" params={{ userId: user.id }} className="truncate text-sm font-semibold hover:underline">
              {user.name}
            </Link>
            {user.verified && <span className="text-[10px] uppercase tracking-wider text-cyan-glow">Verified</span>}
          </div>
          <p className="line-clamp-1 text-xs text-muted-foreground">{user.bio}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {user.skills.slice(0, 3).map((s) => (
          <span key={s.name} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px]">
            {s.name}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 text-amber-300"><Star className="size-3.5 fill-current" /> {user.reputation}</span>
        <TrustBadge score={user.trust} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/5 cursor-pointer"
          onClick={() => {
            localStorage.setItem("active_chat_title", user.name);
            navigate({ to: "/chat" });
          }}
        >
          <MessageCircle className="size-3.5" /> Message
        </Button>
        <Button
          size="sm"
          className="bg-gradient-to-r from-primary to-accent text-primary-foreground cursor-pointer"
          onClick={() => {
            navigate({ to: "/marketplace", search: { q: user.name } as any });
          }}
        >
          Book
        </Button>
      </div>
    </GlassCard>
  );
}
