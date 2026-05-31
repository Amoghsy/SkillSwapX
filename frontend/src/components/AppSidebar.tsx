import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Compass, Users, MessagesSquare, Sparkles,
  User, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/marketplace", label: "Marketplace", icon: Compass },
  { to: "/circles", label: "Skill Circles", icon: Users },
  { to: "/chat", label: "Chat", icon: MessagesSquare },
  { to: "/ai", label: "AI Center", icon: Sparkles },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useApp((s) => s.user)!;
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-white/5 bg-sidebar/80 backdrop-blur-xl md:flex md:flex-col">
      <div className="flex items-center gap-2 px-5 pt-5">
        <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
          <span className="font-display text-lg font-bold">S</span>
        </div>
        <div>
          <div className="font-display text-sm font-semibold">SkillSwap <span className="text-gradient">X</span></div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Learn by teaching</div>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3" aria-label="Primary">
        {links.map((l) => {
          const Icon = l.icon;
          const active = path === l.to || (l.to !== "/dashboard" && path.startsWith(l.to));
          return (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-gradient-to-r from-primary/20 to-accent/10 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.06)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className={cn("size-4", active && "text-primary")} />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
        <Link to="/profile/$userId" params={{ userId: user.id }} className="flex items-center gap-3">
          <img src={user.avatar} alt="" className="size-9 rounded-full ring-1 ring-white/10" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-xs text-muted-foreground">@{user.handle}</div>
          </div>
        </Link>
        <div className="mt-2 flex gap-1">
          <button aria-label="Settings" className="grid flex-1 place-items-center rounded-lg py-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"><Settings className="size-4" /></button>
          <Link to="/" aria-label="Sign out" className="grid flex-1 place-items-center rounded-lg py-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"><LogOut className="size-4" /></Link>
        </div>
      </div>
    </aside>
  );
}

export function MobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useApp((s) => s.user);
  const profileId = user ? String(user.id) : "1";
  
  const items = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/marketplace", icon: Compass, label: "Discover" },
    { to: "/circles", icon: Users, label: "Circles" },
    { to: "/chat", icon: MessagesSquare, label: "Chat" },
    { to: `/profile/${profileId}`, icon: User, label: "Me" },
  ] as const;

  return (
    <nav aria-label="Mobile" className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-sidebar/90 backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((i) => {
          const active = path === i.to || (i.to !== "/dashboard" && path.startsWith(i.to.split("/").slice(0,2).join("/")));
          const Icon = i.icon;
          const isProfile = i.to.startsWith("/profile");
          return (
            <li key={i.to}>
              <Link to={isProfile ? "/profile/$userId" : i.to as any} params={isProfile ? { userId: profileId } : undefined as any} className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px]",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                <Icon className="size-5" />
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
