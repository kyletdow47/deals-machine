"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface Step { id?: string; step_number: number; delay_days: number; subject_template: string; body_template: string; }
interface Enrollment { id: string; first_name: string; last_name: string; company: string; email: string; current_step: number; status: string; }
interface SequenceDetail { id: string; name: string; description: string; steps: Step[]; enrollments: Enrollment[]; }

const VARIABLES_HELP = "{first_name}, {last_name}, {company}, {title}, {city}";

export default function SequenceEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [sequence, setSequence] = useState<SequenceDetail | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const fetchSequence = useCallback(async () => {
    const res = await fetch(`/api/sequences/${params.id}`);
    if (!res.ok) return router.push("/sequences");
    const data = await res.json();
    setSequence(data);
    setSteps(data.steps.length ? data.steps : [{ step_number: 1, delay_days: 0, subject_template: "", body_template: "" }]);
  }, [params.id, router]);

  useEffect(() => { fetchSequence(); }, [fetchSequence]);

  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    setSteps((prev) => { const n = [...prev]; n[index] = { ...n[index], [field]: value }; return n; });
  };

  const addStep = () => {
    const last = steps[steps.length - 1];
    setSteps((prev) => [...prev, { step_number: prev.length + 1, delay_days: (last?.delay_days || 0) + 3, subject_template: "", body_template: "" }]);
    setActiveStep(steps.length);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_number: i + 1 })));
    if (activeStep >= steps.length - 1) setActiveStep(Math.max(0, steps.length - 2));
  };

  const save = async () => {
    setSaving(true);
    await fetch(`/api/sequences/${params.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });
    setSaving(false);
    toast("Sequence saved successfully");
  };

  if (!sequence) return (
    <div className="space-y-4 animate-fadeIn">
      <div className="h-8 w-48 bg-surface-dim rounded animate-shimmer" />
      <div className="h-64 bg-surface-container-highest rounded-xl animate-shimmer" />
    </div>
  );

  const currentStep = steps[activeStep];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => router.push("/sequences")} className="text-sm text-outline hover:text-primary mb-2 flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Sequences
          </button>
          <h1 className="font-headline text-2xl font-extrabold tracking-tight">{sequence.name}</h1>
          {sequence.description && <p className="text-on-surface-variant text-sm">{sequence.description}</p>}
        </div>
        <button onClick={save} disabled={saving}
          className="metallic-silk text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg disabled:opacity-50 btn-press flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">{saving ? "hourglass_top" : "save"}</span>
          {saving ? "Saving..." : "Save Sequence"}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Step Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div className="space-y-2 mb-4">
            {steps.map((step, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                  activeStep === i
                    ? "bg-surface-container-highest text-primary border border-primary/20 font-bold editorial-shadow"
                    : "text-on-surface-variant hover:bg-surface-container-high/50 border border-transparent"
                }`}>
                <div className="flex items-center justify-between">
                  <span className="font-headline font-bold">Step {step.step_number}</span>
                  <span className="text-[10px] text-outline font-bold">{step.delay_days === 0 ? "Immediate" : `Day ${step.delay_days}`}</span>
                </div>
                {step.subject_template && <div className="text-[10px] text-outline mt-1 truncate">{step.subject_template}</div>}
              </button>
            ))}
          </div>
          <button onClick={addStep}
            className="w-full px-4 py-3 text-sm text-outline hover:text-primary border border-dashed border-outline-variant/30 hover:border-primary/30 rounded-xl transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Add Step
          </button>
        </div>

        {/* Template Editor */}
        <div className="col-span-12 lg:col-span-9">
          {currentStep && (
            <div className="bg-surface-container-highest rounded-xl p-8 border border-outline-variant/5 editorial-shadow animate-fadeSlideUp">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-bold text-lg">Step {currentStep.step_number}</h3>
                {steps.length > 1 && (
                  <button onClick={() => removeStep(activeStep)} className="text-[10px] font-bold text-outline hover:text-error transition-colors uppercase tracking-wider">
                    Remove step
                  </button>
                )}
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2 block">Send delay (days after enrollment)</label>
                <input type="number" min="0" value={currentStep.delay_days}
                  onChange={(e) => updateStep(activeStep, "delay_days", parseInt(e.target.value) || 0)}
                  className="w-32 px-4 py-2.5 bg-surface-container-lowest border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2 block">Subject line</label>
                <input type="text" value={currentStep.subject_template}
                  onChange={(e) => updateStep(activeStep, "subject_template", e.target.value)}
                  placeholder="e.g. Quick question for {first_name}"
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant" />
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2 block">Email body</label>
                <textarea value={currentStep.body_template}
                  onChange={(e) => updateStep(activeStep, "body_template", e.target.value)}
                  placeholder={`Hi {first_name},\n\nWrite your email here...\n\nBest,\nYour Name`}
                  rows={12}
                  className="w-full px-4 py-3 bg-surface-container-lowest border-none rounded-xl text-sm font-mono leading-relaxed focus:ring-2 focus:ring-primary/20 resize-y shadow-inner placeholder:text-outline-variant" />
              </div>

              <p className="text-[10px] text-outline">Available variables: {VARIABLES_HELP}</p>
            </div>
          )}

          {/* Enrollments */}
          {sequence.enrollments.length > 0 && (
            <div className="mt-6 bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
              <h3 className="font-headline font-bold mb-4">Enrolled ({sequence.enrollments.length})</h3>
              <div className="space-y-2">
                {sequence.enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg hover:bg-surface-container-high/50 transition-colors">
                    <span className="font-medium">{e.first_name} {e.last_name} <span className="text-on-surface-variant ml-2">{e.company}</span></span>
                    <div className="flex items-center gap-3">
                      <span className="text-outline text-xs">Step {e.current_step}/{steps.length}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        e.status === "active" ? "bg-primary/10 text-primary" :
                        e.status === "replied" ? "bg-primary-container/30 text-on-primary-container" :
                        "bg-secondary-container text-on-secondary-container"
                      }`}>{e.status}</span>
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
