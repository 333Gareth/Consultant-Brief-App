import React, { useState } from 'react';
import { BaselineProfile, TreatmentLogEntry, ConsultationBrief } from '../types';
import { redactPayloadForAI } from '../utils/privacyScrubber';
import { PrintableBrief } from './PrintableBrief';
import {
  Sparkles,
  Printer,
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Copy,
  Check,
  Edit3,
  Stethoscope,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface ConsultationBriefTabProps {
  baseline: BaselineProfile;
  logs: TreatmentLogEntry[];
  currentBrief: ConsultationBrief | null;
  onSaveBrief: (brief: ConsultationBrief) => void;
  onOpenPrivacyModal: () => void;
}

const SPECIALIST_PRESETS = [
  'Cardiology & Vascular Medicine',
  'Rheumatology & Joint Care',
  'Neurology & Headache Specialist',
  'Gastroenterology',
  'Endocrinology & Metabolism',
  'Orthopedic Surgery',
  'Respiratory / Pulmonology',
  'General Practice / Internal Medicine',
  'Nephrology / Renal Medicine',
];

export const ConsultationBriefTab: React.FC<ConsultationBriefTabProps> = ({
  baseline,
  logs,
  currentBrief,
  onSaveBrief,
  onOpenPrivacyModal,
}) => {
  const [specialistType, setSpecialistType] = useState<string>(SPECIALIST_PRESETS[0]);
  const [customSpecialist, setCustomSpecialist] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileStep, setCompileStep] = useState<string>('');
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isInspectionOpen, setIsInspectionOpen] = useState<boolean>(false);
  const [lastRedactionCount, setLastRedactionCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditable, setIsEditable] = useState<boolean>(false);

  // Compute live redaction preview
  const redactionPreview = redactPayloadForAI(baseline, logs);

  const handleCompileBrief = async () => {
    setIsCompiling(true);
    setCompileError(null);

    const chosenSpecialist =
      specialistType === 'Custom' && customSpecialist.trim()
        ? customSpecialist.trim()
        : specialistType;

    try {
      // Step 1: Local Privacy Scrubbing
      setCompileStep('Scrubbing identifiable data locally on your device...');
      await new Promise((r) => setTimeout(r, 450));

      const redactionResult = redactPayloadForAI(baseline, logs);
      setLastRedactionCount(redactionResult.redactedCount);

      // Step 2: Payload transmission
      setCompileStep('Connecting to clinical synthesis engine...');
      await new Promise((r) => setTimeout(r, 350));

      // Step 3: Server API synthesis
      setCompileStep('Synthesizing chief trajectory, regimen shifts, and clinical priorities...');

      const response = await fetch('/api/compile-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          specialistType: chosenSpecialist,
          baseline: redactionResult.sanitizedData.baseline,
          recentLogs: redactionResult.sanitizedData.recentLogs,
          redactedSummaryNote: `${redactionResult.redactedCount} entities scrubbed locally`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate consultation brief');
      }

      const compiledData = result.data;

      const newBrief: ConsultationBrief = {
        id: `brief-${Date.now()}`,
        dateGenerated: compiledData.dateGenerated || new Date().toLocaleDateString(),
        specialistType: chosenSpecialist,
        chiefTrajectory: compiledData.chiefTrajectory,
        trajectoryStatus: compiledData.trajectoryStatus || 'Stable',
        regimenChanges: compiledData.regimenChanges || [],
        symptomAndMetricPatterns: compiledData.symptomAndMetricPatterns || [],
        vitalsSummary: compiledData.vitalsSummary || {},
        top3Priorities: compiledData.top3Priorities || [],
        baselineSnapshot: {
          activeConditions: baseline.conditions,
          currentMedications: baseline.medications.map((m) => `${m.name} (${m.dose}, ${m.frequency})`),
          allergies: baseline.allergies,
          surgeriesOrInvestigations: baseline.surgeriesAndInvestigations.map(
            (s) => `${s.title}${s.dateOrYear ? ` (${s.dateOrYear})` : ''}${s.outcome ? ` - ${s.outcome}` : ''}`
          ),
        },
        safetyDisclaimer:
          compiledData.safetyDisclaimer ||
          'CONFIDENTIAL PRE-CONSULTATION SUMMARY: Patient-reported factual summary. Does not replace clinical evaluation.',
        redactedTokensCount: redactionResult.redactedCount,
        sourceEngine: result.source || 'gemini-3.8-flash',
      };

      onSaveBrief(newBrief);
    } catch (err: any) {
      console.error('Error compiling brief:', err);
      setCompileError(err?.message || 'Unable to complete synthesis. Please try again.');
    } finally {
      setIsCompiling(false);
      setCompileStep('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyToClipboard = () => {
    if (!currentBrief) return;
    const text = `PRE-CONSULTATION CLINICAL BRIEF
Specialist: ${currentBrief.specialistType}
Date: ${currentBrief.dateGenerated}
Trajectory: [${currentBrief.trajectoryStatus}] ${currentBrief.chiefTrajectory}

REGIMEN CHANGES:
${currentBrief.regimenChanges.map((r) => `- ${r}`).join('\n')}

PATTERNS & VITALS:
${currentBrief.symptomAndMetricPatterns.map((p) => `- ${p}`).join('\n')}

TOP 3 QUESTIONS FOR CONSULTATION:
${currentBrief.top3Priorities.map((q) => `${q.number}. ${q.question}\n   (Rationale: ${q.rationale})`).join('\n')}

${currentBrief.safetyDisclaimer}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateQuestion = (index: number, newText: string) => {
    if (!currentBrief) return;
    const updated = {
      ...currentBrief,
      top3Priorities: currentBrief.top3Priorities.map((item, i) =>
        i === index ? { ...item, question: newText } : item
      ),
    };
    onSaveBrief(updated);
  };

  return (
    <div id="consultation-brief-tab-container" className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Generator Control Card (Hidden in print) */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">One-Click Summary Generator</h2>
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                AI Synthesis
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Transforms your baseline history and recent treatment logs into a crisp, 1-page structured consultation brief for specialist review.
            </p>
          </div>

          {/* Privacy Redaction Indicator Pill */}
          <div
            id="privacy-scrubber-indicator"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="font-semibold text-emerald-900">Identifiable details redacted locally</div>
              <div className="text-[10px] text-emerald-700 font-mono">
                {redactionPreview.redactedCount} sensitive item(s) sanitized &bull; Zero PII sent to AI
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsInspectionOpen(!isInspectionOpen)}
              className="ml-1 p-1 rounded hover:bg-emerald-100 text-emerald-700 text-xs transition-colors"
              title="Inspect redacted data payload"
            >
              {isInspectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Configuration Row: Specialist Selection & Compile Action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="select-specialist-type" className="block text-xs font-semibold text-slate-700">
              Target Specialist / Appointment Focus
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                id="select-specialist-type"
                value={specialistType}
                onChange={(e) => setSpecialistType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {SPECIALIST_PRESETS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
                <option value="Custom">Custom Specialist...</option>
              </select>

              {specialistType === 'Custom' && (
                <input
                  id="input-custom-specialist"
                  type="text"
                  value={customSpecialist}
                  onChange={(e) => setCustomSpecialist(e.target.value)}
                  placeholder="e.g. Oncology, Otolaryngology (ENT)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              )}
            </div>
          </div>

          {/* Prominent "Compile Consultation Brief" Action */}
          <div className="flex flex-col justify-end">
            <button
              id="btn-compile-consultation-brief"
              type="button"
              onClick={handleCompileBrief}
              disabled={isCompiling}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCompiling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Compiling Brief...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Compile Consultation Brief</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Compilation Status Stepper */}
        {isCompiling && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2 animate-pulse">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>{compileStep}</span>
            </div>
            <div className="w-full bg-blue-200/60 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-2/3 animate-pulse" />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {compileError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{compileError}</span>
          </div>
        )}

        {/* Privacy Scrubber Inspection Drawer */}
        {isInspectionOpen && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Client-Side Sanitization Inspector</span>
              </span>
              <button
                type="button"
                onClick={onOpenPrivacyModal}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                Learn more about privacy rules
              </button>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Below is the verified de-identified payload prepared for the AI model. No NHS numbers, full names,
              birth dates, phone numbers, or residential addresses will leave your device.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Conditions Scrubbed:</span>
                <p className="text-slate-800 truncate">
                  {redactionPreview.sanitizedData.baseline.conditions.join('; ') || 'None'}
                </p>
              </div>
              <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Redactions Logged:</span>
                <p className="text-emerald-700 font-bold">
                  {redactionPreview.redactedCount} PII entities neutralized
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Brief Preview & Action Toolbar */}
      {currentBrief ? (
        <div className="space-y-4">
          {/* Action Toolbar (Hidden during print) */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-800">
                1-Page Summary Ready &bull; Compiled for {currentBrief.specialistType}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-toggle-edit-mode"
                type="button"
                onClick={() => setIsEditable(!isEditable)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  isEditable
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditable ? 'Finish Editing Questions' : 'Fine-Tune Questions'}</span>
              </button>

              <button
                id="btn-copy-brief"
                type="button"
                onClick={handleCopyToClipboard}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              {/* Print / Save PDF Button */}
              <button
                id="btn-print-save-pdf"
                type="button"
                onClick={handlePrint}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* The Exact Formatted 1-Page Summary Sheet */}
          <PrintableBrief
            brief={currentBrief}
            onUpdateQuestion={handleUpdateQuestion}
            isEditable={isEditable}
          />
        </div>
      ) : (
        /* Empty State Prompting User to Click Compile */
        <div className="no-print p-12 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-800">No Consultation Brief Compiled Yet</h3>
            <p className="text-xs text-slate-500">
              Click the <span className="text-blue-600 font-semibold">"Compile Consultation Brief"</span> button above to
              synthesize your {baseline.conditions.length} baseline conditions and {logs.length} logged events into a formatted 1-page medical sheet.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCompileBrief}
            disabled={isCompiling}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors inline-flex items-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Brief Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
