import { ALPHA_LABEL } from "@/lib/version";

export function AlphaBadge() {
  return (
    <div className="alpha-badge game-fixed-overlay" aria-hidden>
      {ALPHA_LABEL}
    </div>
  );
}
