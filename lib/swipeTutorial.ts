const STORAGE_KEY = "wot-swipe-tutorial-done";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function hasSeenSwipeTutorial(): boolean {
  if (!canUseStorage()) return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function markSwipeTutorialSeen(): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, "true");
}
