"use client";

import { useState, useTransition } from "react";
import { generateCaseCandidateAction } from "@/app/(admin)/cases/actions";

const defaultForm = {
  domain: "supply_chain",
  workFunction: "procurement",
  difficulty: "intermediate",
  communicationObjective: "Request a confirmed delivery commitment professionally.",
};

export function CandidateGeneratorForm() {
  const [form, setForm] = useState(defaultForm);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(field: keyof typeof defaultForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function submit() {
    setResultMessage(null);
    startTransition(async () => {
      const result = await generateCaseCandidateAction(form);
      if ("error" in result && result.error) {
        setResultMessage(`Gagal: ${result.error}`);
        return;
      }
      setResultMessage(`Candidate berhasil dibuat (ID: ${result.candidateId}).`);
    });
  }

  return (
    <section className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Generate Candidate</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">Create Draft from Objective Signal</h2>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Domain</span>
          <input
            value={form.domain}
            onChange={(event) => updateField("domain", event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Work function</span>
          <input
            value={form.workFunction}
            onChange={(event) => updateField("workFunction", event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Difficulty</span>
          <input
            value={form.difficulty}
            onChange={(event) => updateField("difficulty", event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-slate-600">Communication objective</span>
          <textarea
            value={form.communicationObjective}
            onChange={(event) => updateField("communicationObjective", event.target.value)}
            className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Generating..." : "Generate candidate"}
        </button>
        {resultMessage ? <p className="text-sm text-slate-700">{resultMessage}</p> : null}
      </div>
    </section>
  );
}
