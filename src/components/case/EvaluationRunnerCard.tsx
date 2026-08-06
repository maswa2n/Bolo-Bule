"use client";

import { useState, useTransition } from "react";
import { runEvaluationGateAction } from "@/app/(admin)/evaluation/actions";

type GateCheck = {
  name: string;
  pass: boolean;
  value: number;
  target: string;
};

export function EvaluationRunnerCard() {
  const [isPending, startTransition] = useTransition();
  const [checks, setChecks] = useState<GateCheck[]>([]);
  const [status, setStatus] = useState<"PASS" | "FAIL" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function runNow() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await runEvaluationGateAction();
        setChecks(result.gates.checks);
        setStatus(result.gates.pass ? "PASS" : "FAIL");
        setMessage(`Run #${result.run.id} selesai dengan status ${result.run.run_status}.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Gagal menjalankan evaluation gate.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Evaluation Gate</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">Regression Smoke + Quality Checks</h2>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={runNow}
          disabled={isPending}
          className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Running..." : "Run evaluation gate"}
        </button>
        {status ? (
          <span
            className={[
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              status === "PASS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
            ].join(" ")}
          >
            {status}
          </span>
        ) : null}
      </div>

      {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}

      {checks.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {checks.map((check) => (
            <li key={check.name} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <strong>{check.name}</strong>: {check.value.toFixed(2)} (target {check.target}) ·{" "}
              <span className={check.pass ? "text-emerald-700" : "text-rose-700"}>
                {check.pass ? "PASS" : "FAIL"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
