import { Github } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { errorMessage, startGithubSignIn } from "@/lib/social-auth";

type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string>,
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services";

export function SocialAuthButtons({
  onGoogleCredential,
}: {
  onGoogleCredential: (credential: string) => Promise<void>;
}) {
  const googleButton = useRef<HTMLDivElement>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) return;

    const renderGoogle = () => {
      if (!window.google || !googleButton.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => void onGoogleCredential(response.credential),
      });
      googleButton.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButton.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: "190",
      });
      setGoogleReady(true);
    };

    if (window.google) {
      renderGoogle();
      return;
    }

    let script = document.getElementById(
      GOOGLE_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", renderGoogle);
    return () => script?.removeEventListener("load", renderGoogle);
  }, [googleClientId, onGoogleCredential]);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button
        onClick={() =>
          void startGithubSignIn().catch((error: unknown) =>
            toast.error(errorMessage(error, "GitHub sign-in failed.")),
          )
        }
        type="button"
        className="inline-flex h-10 items-center justify-center gap-2 rounded border border-white/10 bg-white/5 px-3 text-sm transition hover:bg-white/10"
      >
        <Github className="size-4" /> Continue with GitHub
      </button>
      <div className="flex min-h-10 items-center justify-center overflow-hidden rounded">
        {googleClientId ? (
          <>
            <div ref={googleButton} />
            {!googleReady && (
              <span className="text-xs text-muted-foreground">
                Loading Google...
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            Add `VITE_GOOGLE_CLIENT_ID` to enable Google
          </span>
        )}
      </div>
    </div>
  );
}
