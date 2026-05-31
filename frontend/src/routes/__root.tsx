import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background bg-mesh px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-3 font-display text-xl font-semibold">Off the map</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist — but plenty of skills do.
        </p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-primary-foreground">
          Back to home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold">Something glitched</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again — or head home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "SkillSwap X — Learn anything by teaching what you know" },
      { name: "description", content: "An AI-powered peer-to-peer skill exchange. Teach, earn credits, learn anything, join Skill Circles, build a verified portfolio." },
      { name: "theme-color", content: "#0a0f24" },
      { property: "og:title", content: "SkillSwap X — Learn anything by teaching what you know" },
      { property: "og:description", content: "An AI-powered peer-to-peer skill exchange. Teach, earn credits, learn anything, join Skill Circles, build a verified portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SkillSwap X — Learn anything by teaching what you know" },
      { name: "twitter:description", content: "An AI-powered peer-to-peer skill exchange. Teach, earn credits, learn anything, join Skill Circles, build a verified portfolio." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/31cda3d6-f6e0-4f51-bbd3-c5bd2884be64/id-preview-e9da5fd5--f6614d7c-4dce-469b-8f21-71d478872dda.lovable.app-1779290021201.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/31cda3d6-f6e0-4f51-bbd3-c5bd2884be64/id-preview-e9da5fd5--f6614d7c-4dce-469b-8f21-71d478872dda.lovable.app-1779290021201.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <main><Outlet /></main>
    </QueryClientProvider>
  );
}
