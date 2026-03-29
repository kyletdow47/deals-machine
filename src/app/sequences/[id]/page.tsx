"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Step {
  id?: string;
  step_number: number;
  delay_days: number;
  subject_template: string;
  body_template: string;
}

interface Enrollment {
  id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  current_step: number;
  status: string;
  enrolled_at: string;
  last_sent_at: string | null;
}

interface SequenceDetail {
  id: string;
  name: string;
  description: string;
  steps: Step[];
  enrollments: Enrollment[];
}

const VARIABLES_HELP = "{first_name}, {last_name}, {company}, {title}, {city}";

export default function SequenceEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [sequence, setSequence] = useState<SequenceDetail | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const fetchSequence = useCallback(async () => {
    const res = await fetch(`/api/sequences/${params.id}`);
    if (!res.ok) return router.push("/sequences");
    const data = await res.json();
    setSequence(data);
    setSteps(data.steps.length ? data.steps : [
      { step_number: 1, delay_days: 0, subject_template: "", body_template: "" },
    ]);
  }, [params.id, router]);

  useEffect(() => {
    fetchSequence();
  }, [fetchSequence]);

  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setSaved(false);
  };

  const addStep = () => {
    const lastStep = steps[steps.length - 1];
    setSteps((prev) => [
      ...prev,
      {
        step_number: prev.length + 1,
        delay_days: (lastStep?.delay_days || 0) + 3,
        subject_template: "",
        body_template: "",
      },
    ]);
    setActiveStep(steps.length);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((s, i) => ({ ...s, step_number: i + 1 }));
    });
    if (activeStep >= steps.length - 1) setActiveStep(Math.max(0, steps.length - 2));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    await fetch(`/api/sequences/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!sequence) return <div className="text-zinc-500">Loading...</div>;

  const currentStep = steps[activeStep];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push("/sequences")} className="text-sm text-zinc-500 hover:text-white mb-1">
            &larr; Sequences
          </button>
          <h1 className="text-2xl font-bold">{sequence.name}</h1>
          {sequence.description && <p className="text-zinc-500 text-sm">{sequence.description}</p>}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save Sequence"}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Step Sidebar */}
        <div className="col-span-3">
          <div className="space-y-2 mb-4">
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeStep === i
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Step {step.step_number}</span>
                  <span className="text-xs text-zinc-500">
                    {step.delay_days === 0 ? "Immediate" : `Day ${step.delay_days}`}
                  </span>
                </div>
                {step.subject_template && (
                  <div className="text-xs text-zinc-500 mt-1 truncate">{step.subject_template}</div>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={addStep}
            className="w-full px-3 py-2 text-sm text-zinc-500 hover:text-white border border-dashed border-zinc-800 hover:border-zinc-600 rounded-lg transition-colors"
          >
            + Add Step
          </button>
        </div>

        {/* Template Editor */}
        <div className="col-span-9">
          {currentStep && (
            <div className="border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Step {currentStep.step_number}</h3>
                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(activeStep)}
                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    Remove step
                  </button>
                )}
              </div>

              {/* Delay */}
              <div className="mb-4">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">
                  Send delay (days after enrollment)
                </label>
                <input
                  type="number"
                  min="0"
                  value={currentStep.delay_days}
                  onChange={(e) => updateStep(activeStep, "delay_days", parseInt(e.target.value) || 0)}
                  className="mt-1 w-32 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Subject line</label>
                <input
                  type="text"
                  value={currentStep.subject_template}
                  onChange={(e) => updateStep(activeStep, "subject_template", e.target.value)}
                  placeholder="e.g. Quick question for {first_name}"
                  className="mt-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Body */}
              <div className="mb-4">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Email body</label>
                <textarea
                  value={currentStep.body_template}
                  onChange={(e) => updateStep(activeStep, "body_template", e.target.value)}
                  placeholder={`Hi {first_name},\n\nWrite your email here...\n\nBest,\nYour Name`}
                  rows={12}
                  className="mt-1 w-full px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-mono leading-relaxed focus:outline-none focus:border-zinc-600 resize-y"
                />
              </div>

              {/* Variables help */}
              <p className="text-xs text-zinc-600">
                Available variables: {VARIABLES_HELP}
              </p>
            </div>
          )}

          {/* Enrollments */}
          {sequence.enrollments.length > 0 && (
            <div className="mt-6 border border-zinc-800 rounded-xl p-5">
              <h3 className="font-semibold mb-3">Enrolled Contacts ({sequence.enrollments.length})</h3>
              <div className="space-y-2">
                {sequence.enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span>
                      {e.first_name} {e.last_name}
                      <span className="text-zinc-500 ml-2">{e.company}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500">Step {e.current_step}/{steps.length}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        e.status === "active" ? "bg-green-900/50 text-green-400" :
                        e.status === "replied" ? "bg-blue-900/50 text-blue-400" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>
                        {e.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
