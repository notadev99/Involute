// Web worker entry: the request's Rationals arrive as plain { n, d } pairs
// (structured clone drops the prototype), so revive them before solving. The
// response's Rationals degrade the same way on the way back, which the main
// thread accounts for.
import { Rational } from "@involute/engine";
import { solve, type ApproxRequest, type ExactRequest } from "./solve.js";

type WireRational = { n: bigint; d: bigint };
type WireRequest =
  | (Omit<ApproxRequest, "driverPeriodDays"> & { driverPeriodDays: WireRational })
  | (Omit<ExactRequest, "ratio"> & { ratio: WireRational });

const ctx = self as unknown as {
  addEventListener(type: "message", handler: (e: MessageEvent<{ id: number; req: WireRequest }>) => void): void;
  postMessage(message: unknown): void;
};

ctx.addEventListener("message", (e) => {
  const { id, req } = e.data;
  const revived =
    req.kind === "exact"
      ? { ...req, ratio: Rational.from(req.ratio.n, req.ratio.d) }
      : { ...req, driverPeriodDays: Rational.from(req.driverPeriodDays.n, req.driverPeriodDays.d) };
  ctx.postMessage({ id, rows: solve(revived) });
});
