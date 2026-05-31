import type { UserType } from "@/lib/store";

export type SocialResult = {
  exists: boolean;
  user?: UserType;
  provider?: "google" | "github";
  email?: string;
  name?: string;
  avatar_url?: string | null;
  onboarding_token?: string;
};

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

function randomToken(byteLength = 32) {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export function saveSocialOnboarding(result: SocialResult) {
  localStorage.setItem("social_onboarding", JSON.stringify(result));
}

export function loadSocialOnboarding(): SocialResult | null {
  try {
    return JSON.parse(localStorage.getItem("social_onboarding") || "null");
  } catch {
    return null;
  }
}

export function clearSocialOnboarding() {
  localStorage.removeItem("social_onboarding");
}

export async function startGithubSignIn() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  if (!clientId) throw new Error("GitHub sign-in is not configured yet.");

  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = base64Url(await sha256(verifier));
  const redirectUri = `${window.location.origin}/login`;

  sessionStorage.setItem("github_oauth_state", state);
  sessionStorage.setItem("github_code_verifier", verifier);
  sessionStorage.setItem("github_redirect_uri", redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "user:email",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  window.location.assign(`https://github.com/login/oauth/authorize?${params}`);
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
