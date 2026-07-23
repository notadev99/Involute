import type { GearTrain } from "@involute/engine";

export function formatError(rel: number): string {
  if (rel === 0) return "exact";
  return rel.toExponential(1);
}

export function formatTeeth(train: GearTrain): string {
  return train.stages
    .map((s) => (s.isIdler ? `id:${s.drivenTeeth}` : `${s.driverTeeth}:${s.drivenTeeth}`))
    .join(" · ");
}

export function formatInterval(interval: string, direction: "fast" | "slow" | "exact"): string {
  if (direction === "exact") return "no correction needed";
  return `${interval} (runs ${direction})`;
}
