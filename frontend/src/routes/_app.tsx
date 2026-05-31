import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppSidebar, MobileTabBar } from "@/components/AppSidebar";
import { useApp } from "@/lib/store";
import { useEffect, useState } from "react";
import { auth } from "@/services/api";
import { Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, setUser } = useApp();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function fetchMe() {
      try {
        const data = await auth.me();
        if (!active) return;
        if (data) {
          // Map DB response to expected frontend shape
          const mappedUser = {
            id: String(data.id),
            name: data.name,
            handle: data.handle || data.name.toLowerCase().replace(/\s+/g, ""),
            avatar: data.avatar_url || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=3b82f6,8b5cf6,06b6d4`,
            bio: data.bio || "No bio yet.",
            location: data.location || "Unknown",
            trust: parseFloat(data.trust_score) || 50,
            reputation: parseFloat(data.trust_score) / 20 || 4.5, // 0-5 scale mapped from 0-100 trust score
            credits: parseInt(data.credits) || 0,
            streak: 0, // default placeholder
            verified: data.verification_status === "verified",
            mentor: data.role === "admin" || (data.skills && data.skills.length > 0),
            online: true,
            interests: ["Technology"],
            skills: (data.skills || []).map((s: any) => ({
              name: s.skill_name || s.name,
              level: s.proficiency === "Advanced" ? 5 : s.proficiency === "Intermediate" ? 3 : 1,
              category: s.category || "Engineering",
            })),
          };
          setUser(mappedUser);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
        // Custom request function redirects to login, but safe fallback:
        navigate({ to: "/login" });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchMe();

    return () => {
      active = false;
    };
  }, [setUser, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background bg-mesh px-4">
        <div className="relative text-center">
          <div className="absolute inset-0 -z-10 rounded-[36px] bg-gradient-to-br from-primary/20 via-violet/15 to-cyan-glow/10 blur-2xl animate-pulse" aria-hidden />
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="relative">
              <Loader2 className="size-10 animate-spin text-primary" />
              <Sparkles className="absolute -right-1 -top-1 size-4 animate-bounce text-accent" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-gradient">SkillSwap X</h2>
              <p className="mt-1 text-xs text-muted-foreground">Initializing your custom workspace...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <Outlet />
      </div>
      <MobileTabBar />
    </div>
  );
}

