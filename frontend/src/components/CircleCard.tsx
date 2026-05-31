import { GlassCard } from "./GlassCard";
import { Users, Activity, MapPin, CalendarClock, Radio } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CircleCard({ circle }: { circle: any }) {
  const id = String(circle.id);
  const name = circle.name;
  const topic = circle.topic || circle.description || "Skill circle discussion";
  const members = parseInt(circle.members_count || circle.members || 1);
  const activity = parseInt(circle.activity || 80);
  const location = circle.location || "Online";
  const cadence = circle.weekly_schedule || circle.cadence || "Weekly";
  const cover = circle.cover || "from-blue-500/30 to-violet-500/20";
  const live = !!circle.live;

  return (
    <Link to="/circles/$id" params={{ id }}>
      <GlassCard whileHover={{ y: -4 }} className="overflow-hidden p-0">
        <div className={`relative h-28 bg-gradient-to-br ${cover} bg-mesh`}>
          {live && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-200 backdrop-blur">
              <Radio className="size-3 animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <div className="space-y-3 p-5">
          <div>
            <h3 className="font-display text-lg font-semibold">{name}</h3>
            <p className="line-clamp-1 text-xs text-muted-foreground">{topic}</p>
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" /> {members.toLocaleString()}</span>
            <span className="inline-flex items-center gap-1.5"><Activity className="size-3.5" /> {activity}/100</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {location}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" /> {cadence}</span>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

