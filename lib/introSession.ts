const INTRO_SEEN_KEY = "whispers_intro_seen";
const IS_DEV = process.env.NODE_ENV === "development";

export function hasSeenIntroThisSession(): boolean {
  if (IS_DEV) return false;
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function markIntroSeenThisSession(): void {
  if (IS_DEV) return;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "true");
  } catch {
    /* private browsing */
  }
}

/** Development: ?skipIntro=1 */
export function shouldSkipIntroCinematic(): boolean {
  if (!IS_DEV) return false;
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("skipIntro") === "1";
  } catch {
    return false;
  }
}

export function shouldShowIntroCinematic(): boolean {
  if (IS_DEV) {
    return !shouldSkipIntroCinematic();
  }
  return !hasSeenIntroThisSession();
}

export function resolveInitialPhase(): "intro" | "hero" {
  if (typeof window === "undefined") return "intro";
  return shouldShowIntroCinematic() ? "intro" : "hero";
}
