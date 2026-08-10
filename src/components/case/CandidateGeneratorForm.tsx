"use client";

import { useState, useTransition } from "react";
import { generateCaseCandidateAction } from "@/app/(admin)/cases/actions";

const defaultForm = {
  domain: "supply_chain",
  workFunction: "procurement",
  difficulty: "intermediate",
  communicationObjective: "Request a confirmed delivery commitment professionally.",
};

type ResultTone = "success" | "warning" | "error";

export function CandidateGeneratorForm() {
  const [form, setForm] = useState(defaultForm);
  const [resultMessage, setResultMessage] = useState<{ tone: ResultTone; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(field: keyof typeof defaultForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function submit() {
    setResultMessage(null);
    startTransition(async () => {
      const result = await generateCaseCandidateAction(form);
      if ("error" in result && result.error) {
        setResultMessage({ tone: "error", message: `Gagal: ${result.error}` });
        return;
      }
      if ("warning" in result && result.warning) {
        setResultMessage({ tone: "warning", message: `${result.warning} (ID: ${result.candidateId})` });
        return;
      }
      setResultMessage({
        tone: "success",
        message: `Candidate berhasil dibuat (ID: ${result.candidateId}) dan diperkaya LLM${"model" in result && result.model ? ` (${result.model})` : ""}.`,
      });
    });
  }

  return (
    <section className="bb-glass-panel bb-motion-rise bb-motion-delay-1 rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Generate Candidate</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">Create Draft from Objective Signal</h2>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Domain</span>
          <input
            value={form.domain}
            onChange={(event) => updateField("domain", event.target.value)}
            className="bb-tap-target w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 outline-none ring-cyan-400 focus:ring-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Work function</span>
          <input
            value={form.workFunction}
            onChange={(event) => updateField("workFunction", event.target.value)}
            className="bb-tap-target w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 outline-none ring-cyan-400 focus:ring-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Difficulty</span>
          <input
            value={form.difficulty}
            onChange={(event) => updateField("difficulty", event.target.value)}
            className="bb-tap-target w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 outline-none ring-cyan-400 focus:ring-2"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-slate-600">Communication objective</span>
          <textarea
            value={form.communicationObjective}
            onChange={(event) => updateField("communicationObjective", event.target.value)}
            className="bb-tap-target min-h-24 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 outline-none ring-cyan-400 focus:ring-2"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className={[
            "bb-btn-primary bb-press-depth bb-tap-target w-full px-3 py-2 text-sm font-semibold disabled:opacity-60 sm:w-auto",
            isPending ? "bb-motion-pulse" : "",
          ].join(" ")}
        >
          {isPending ? "Generating..." : "Generate candidate"}
        </button>
        {resultMessage ? (
          <p
            className={[
              "bb-state-enter rounded-xl px-3 py-2 text-sm",
              resultMessage.tone === "success"
                ? "bb-celebrate-subtle bb-state-success"
                : resultMessage.tone === "warning"
                  ? "bb-state-warning"
                  : "bb-state-error",
            ].join(" ")}
          >
            {resultMessage.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
