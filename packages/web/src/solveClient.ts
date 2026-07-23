// Runs solve() off the main thread where Workers exist (the browser), falling
// back to a synchronous call where they do not (jsdom tests). Heavy solves can
// take a while; only the newest outstanding request's callback ever fires, so
// a stale result never overwrites a fresher one.
//
// Boundary note: Rationals cross the worker boundary by structured clone and
// come back as plain { n, d } objects. The render path only reads those two
// fields (see exportData.ts), so no revival is needed on this side.
import { solve, type ApproxRequest, type ExactRequest, type ResultRow } from "./solve.js";

export type SolveRequest = ApproxRequest | ExactRequest;

export function createSolver(): (req: SolveRequest, cb: (rows: ResultRow[]) => void) => void {
  if (typeof Worker === "undefined") {
    return (req, cb) => cb(solve(req));
  }
  const worker = new Worker(new URL("./solveWorker.ts", import.meta.url), { type: "module" });
  let seq = 0;
  let latest: ((rows: ResultRow[]) => void) | null = null;
  worker.addEventListener("message", (e: MessageEvent<{ id: number; rows: ResultRow[] }>) => {
    if (e.data.id === seq && latest) latest(e.data.rows);
  });
  return (req, cb) => {
    latest = cb;
    worker.postMessage({ id: ++seq, req });
  };
}
