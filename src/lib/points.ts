/**
 * KMR Points System
 * Placement points follow the standard BGMI/PMGC-style table used across
 * Indian competitive circuits, plus 1 point per elimination.
 */
export const PLACEMENT_POINTS: Record<number, number> = {
  1: 10,
  2: 6,
  3: 5,
  4: 4,
  5: 3,
  6: 2,
  7: 1,
  8: 1,
};

export const KILL_POINT = 1;

export function placementPoints(placement: number | null | undefined): number {
  if (!placement || placement < 1) return 0;
  return PLACEMENT_POINTS[placement] ?? 0;
}

export function killPoints(kills: number | null | undefined): number {
  return (kills ?? 0) * KILL_POINT;
}

export function totalPoints(placement: number | null, kills: number | null, bonus = 0): number {
  return placementPoints(placement) + killPoints(kills) + bonus;
}

export const CURRENT_SEASON = "Season 07";

export const RANK_TIERS = [
  { name: "Conqueror", min: 120, color: "#fbbf24" },
  { name: "Ace Dominator", min: 90, color: "#fb7185" },
  { name: "Ace Master", min: 65, color: "#a78bfa" },
  { name: "Ace", min: 45, color: "#38bdf8" },
  { name: "Diamond", min: 28, color: "#4ade80" },
  { name: "Platinum", min: 15, color: "#94a3b8" },
  { name: "Gold", min: 6, color: "#facc15" },
  { name: "Rookie", min: 0, color: "#78716c" },
] as const;

export function tierForPoints(points: number) {
  return RANK_TIERS.find((t) => points >= t.min) ?? RANK_TIERS[RANK_TIERS.length - 1];
}
