import React from 'react';
import { ConsultationBrief } from '../types';
import { ShieldCheck, Activity, AlertCircle, HelpCircle, CheckCircle, ShieldAlert } from 'lucide-react';

interface PrintableBriefProps {
  brief: ConsultationBrief;
  onUpdateQuestion?: (index: number, newQuestion: string) => void;
  isEditable?: boolean;
}

export const PrintableBrief: React.FC<PrintableBriefProps> = ({
  brief,
  onUpdateQuestion,
  isEditable = false,
}) => {
  const getTrajectoryColor = (status: string) => {
    switch (status) {
      case 'Improving':
        return 'text-emerald-700 bg-emerald-50 border-emerald-300';
      case 'Worsening':
        return 'text-rose-700 bg-rose-50 border-rose-300';
      case 'Fluctuating':
        return 'text-amber-700 bg-amber-50 border-amber-300';
      default:
        return 'text-sky-700 bg-sky-50 border-sky-300';
    }
  };

  return (
    <div
      id="consultation-brief-sheet"
      className="print-sheet bg-white text-slate-900 border border-slate-300 rounded-xl shadow-lg p-6 sm:p-8 max-w-4xl mx-auto font-sans leading-normal page-break-avoid"
    >
      {/* 1-Page Header */}
      <header className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              Clinical Pre-Consultation Summary
            </span>
            <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              De-Identified Patient Record
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-1">
            CONSULTANT BRIEF: {brief.consultationTarget?.toUpperCase() || 'SPECIALIST CONSULTATION'}
          </h1>
        </div>

        <div className="text-right text-xs font-mono text-slate-700 shrink-0">
          <div>
            <span className="font-semibold text-slate-500">DATE COMPILED:</span> {brief.dateGenerated}
          </div>
          <div className="text-[10px] text-slate-500">
            Engine: {brief.sourceEngine || 'Gemini 3.8 Flash (Clinical Synthesis)'}
          </div>
        </div>
      </header>

      {/* Section 1: Chief Trajectory */}
      <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-700" />
            <span>Chief Trajectory & Recent Trends</span>
          </h2>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getTrajectoryColor(
              brief.trajectoryStatus
            )}`}
          >
            Status: {brief.trajectoryStatus}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
          {brief.chiefTrajectory}
        </p>
      </div>

      {/* Section 2: Baseline Medical Profile Snapshot (Dense 2-Column Grid) */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Left Column: Active Conditions & Allergies */}
        <div className="space-y-3">
          <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-700 border-b border-slate-100 pb-1 mb-1.5">
              Active Diagnoses / Long-Term Baseline
            </h3>
            {brief.baselineSnapshot?.activeConditions && brief.baselineSnapshot.activeConditions.length > 0 ? (
              <ul className="space-y-1 text-slate-800">
                {brief.baselineSnapshot.activeConditions.map((cond, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-teal-700 font-bold">&bull;</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">No formal chronic conditions documented.</p>
            )}
          </div>

          <div className="border border-rose-200 bg-rose-50/50 rounded-lg p-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-rose-800 border-b border-rose-100 pb-1 mb-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>Known Allergies & Adverse Reactions</span>
            </h3>
            {brief.baselineSnapshot?.allergies && brief.baselineSnapshot.allergies.length > 0 ? (
              <ul className="space-y-0.5 text-rose-900 font-medium">
                {brief.baselineSnapshot.allergies.map((allg, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span>&bull;</span>
                    <span>{allg}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-600">No known drug allergies (NKDA).</p>
            )}
          </div>
        </div>

        {/* Right Column: Regimen & Investigations */}
        <div className="space-y-3">
          <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-700 border-b border-slate-100 pb-1 mb-1.5">
              Current Baseline Regimen
            </h3>
            {brief.baselineSnapshot?.currentMedications && brief.baselineSnapshot.currentMedications.length > 0 ? (
              <ul className="space-y-1 text-slate-800">
                {brief.baselineSnapshot.currentMedications.map((med, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-teal-700 font-bold">&bull;</span>
                    <span>{med}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">No routine medications recorded.</p>
            )}
          </div>

          <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-700 border-b border-slate-100 pb-1 mb-1.5">
              Key Prior Surgeries & Investigations
            </h3>
            {brief.baselineSnapshot?.surgeriesOrInvestigations &&
            brief.baselineSnapshot.surgeriesOrInvestigations.length > 0 ? (
              <ul className="space-y-1 text-slate-800">
                {brief.baselineSnapshot.surgeriesOrInvestigations.map((surg, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-teal-700 font-bold">&bull;</span>
                    <span>{surg}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">None recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3 & 4: Regimen Shifts & Vitals / Symptom Patterns */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Regimen Changes */}
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 space-y-1.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
            Regimen Adjustments Since Baseline
          </h3>
          {brief.regimenChanges && brief.regimenChanges.length > 0 ? (
            <ul className="space-y-1.5 text-slate-800">
              {brief.regimenChanges.map((change, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-teal-700 font-bold">&bull;</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 italic">No active modifications recorded.</p>
          )}
        </div>

        {/* Vitals Summary & Patterns */}
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
            Metric Ranges & Symptom Patterns
          </h3>
          {brief.vitalsSummary && (
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white p-2 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px]">BLOOD PRESSURE:</span>
                <span className="font-bold text-slate-900">{brief.vitalsSummary.bloodPressureRange || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">HEART RATE:</span>
                <span className="font-bold text-slate-900">{brief.vitalsSummary.heartRateRange || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SEVERITY AVERAGE:</span>
                <span className="font-bold text-slate-900">{brief.vitalsSummary.severityAverage || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">WEIGHT TREND:</span>
                <span className="font-bold text-slate-900">{brief.vitalsSummary.weightTrend || 'N/A'}</span>
              </div>
            </div>
          )}
          {brief.symptomAndMetricPatterns && (
            <ul className="space-y-1 text-[11px] text-slate-700">
              {brief.symptomAndMetricPatterns.map((pattern, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-slate-400">&bull;</span>
                  <span>{pattern}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Section: Clinical Safety, Clash & Procedure Guardrails */}
      {brief.safetyAlerts && brief.safetyAlerts.length > 0 && (
        <div id="brief-safety-guardrails" className="mb-4 border border-amber-300 rounded-lg p-3 bg-amber-50/70 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-950">
              Clinical Safety: Medication Clashes & Procedure Guardrails
            </h2>
          </div>
          <ul className="space-y-1 text-xs text-amber-950">
            {brief.safetyAlerts.map((alert, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="font-bold text-amber-700">&bull;</span>
                <span className="font-medium">{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section 5: Top 3 Priorities for Consultation */}
      <div className="mb-4 border-2 border-teal-700 rounded-lg p-3.5 bg-teal-50/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-teal-700" />
            <span>Top 3 High-Value Questions for the Specialist Today</span>
          </h2>
          <span className="text-[10px] text-teal-900 font-medium hidden sm:inline">
            Prioritized by clinical relevance
          </span>
        </div>

        <div className="space-y-2">
          {brief.top3Priorities.map((item, idx) => (
            <div
              key={idx}
              id={`brief-question-${item.number}`}
              className="p-2.5 rounded bg-white border border-teal-200/80 space-y-1 text-xs"
            >
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-800 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  {item.number}
                </span>
                <div className="flex-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => onUpdateQuestion && onUpdateQuestion(idx, e.target.value)}
                      className="w-full font-semibold text-slate-950 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600"
                    />
                  ) : (
                    <p className="font-semibold text-slate-950">{item.question}</p>
                  )}
                  {item.rationale && (
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      <span className="font-medium text-slate-700">Rationale:</span> {item.rationale}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 6: Safety Guardrail & Clinical Disclaimer */}
      <footer className="pt-2 border-t border-slate-300 text-[10px] text-slate-500 leading-snug flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-slate-700 font-medium">
          <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>{brief.safetyDisclaimer}</span>
        </div>
        <div className="text-right text-slate-400 font-mono text-[9px] shrink-0">
          Page 1 of 1 &bull; ConsultantBrief Clinical System
        </div>
      </footer>
    </div>
  );
};
