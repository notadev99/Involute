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

export function formatInterval(
  interval: string,
  direction: "fast" | "slow" | "exact",
  beyondConstantPrecision = false,
): string {
  if (direction === "exact") return "no correction needed";
  // Below the source constant's stated uncertainty the residual's sign is not
  // supported by the data — print the interval text without a direction claim.
  if (beyondConstantPrecision) return interval;
  return `${interval} (runs ${direction})`;
}
