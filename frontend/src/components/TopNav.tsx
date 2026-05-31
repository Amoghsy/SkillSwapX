import { Bell, Search, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";

export function TopNav({ title }: { title: string }) {
  const { notifications, markAllRead, user } = useApp();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-background/70 px-4 py-3 backdrop-blur-xl md:px-8">
      <div className="md:hidden">
        <Link to="/dashboard" className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent font-display font-bold text-primary-foreground">S</Link>
      </div>
      <h1 className="font-display text-lg font-semibold md:text-xl">{title}</h1>
      <div className="relative ml-auto hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="Search SkillSwap"
          placeholder="Search skills, mentors, circles…"
          className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/10"
        />
      </div>
      <Link to="/ai" className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-gradient-to-r from-primary/20 to-accent/20 px-3 py-2 text-sm font-medium md:inline-flex">
        <Sparkles className="size-4 text-primary" /> AI Coach
      </Link>
      <Popover>
        <PopoverTrigger asChild>
          <button aria-label={`Notifications, ${unread} unread`} className="relative grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
            <Bell className="size-4" />
            {unread > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-accent animate-pulse-ring" />}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 border-white/10 bg-popover/95 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Notifications</div>
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
          </div>
          <ul className="max-h-80 space-y-1 overflow-auto scrollbar-thin">
            {notifications.map((n) => (
              <li key={n.id} className={`rounded-xl p-2.5 text-sm ${n.read ? "bg-transparent" : "bg-white/5"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{n.title}</div>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(n.ts))} ago</span>
                </div>
                <p className="text-xs text-muted-foreground">{n.body}</p>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
      {user && (
        <Link to="/profile/$userId" params={{ userId: user.id }} className="hidden md:block">
          <img src={user.avatar} alt={user.name} className="size-10 rounded-full ring-1 ring-white/10" />
        </Link>
      )}
    </header>
  );
}
