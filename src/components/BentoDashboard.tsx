import React, { useState, useMemo } from 'react';
import { BaselineProfile, TreatmentLogEntry, ConsultationBrief } from '../types';
import { VitalsTrendChart } from './VitalsTrendChart';
import { SymptomSeverity30dCard } from './SymptomSeverity30dCard';
import { MedicationTreatmentClashCard } from './MedicationTreatmentClashCard';
import { analyzeSymptomSeveritySpike } from '../utils/symptomAnalysis';
import {
  Sparkles,
  Lock,
  Printer,
  Plus,
  ArrowRight,
  ShieldCheck,
  Activity,
  Calendar,
  AlertTriangle,
  Pill,
  Scissors,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sliders,
  Flame,
  TrendingUp,
  X,
} from 'lucide-react';

interface BentoDashboardProps {
  baseline: BaselineProfile;
  logs: TreatmentLogEntry[];
  currentBrief: ConsultationBrief | null;
  onNavigateTab: (tab: 'baseline' | 'log' | 'brief' | 'safety') => void;
  onOpenNewLogModal: () => void;
  onOpenPrivacyModal: () => void;
  onPrintBrief: () => void;
  onCompileBrief: () => void;
  isCompiling: boolean;
}

export const BentoDashboard: React.FC<BentoDashboardProps> = ({
  baseline,
  logs,
  currentBrief,
  onNavigateTab,
  onOpenNewLogModal,
  onOpenPrivacyModal,
  onPrintBrief,
  onCompileBrief,
  isCompiling,
}) => {
  const [simulateSpike, setSimulateSpike] = useState(false);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // Compute 7-day vs 30-day symptom severity analysis using the clinical helper function
  const spikeAnalysis = useMemo(() => {
    return analyzeSymptomSeveritySpike(logs);
  }, [logs]);

  // Active logs & analysis with optional interactive simulation toggle
  const { activeLogs, activeSpikeAnalysis } = useMemo(() => {
    if (simulateSpike) {
      const refTime = logs.length > 0 ? new Date(logs[0].date).getTime() : Date.now();
      const simDate = new Date(refTime).toISOString().split('T')[0];
      const simulatedLog: TreatmentLogEntry = {
        id: 'simulated-flare-entry',
        date: simDate,
        severity: 9,
        symptomsDescription: 'Acute debilitating migraine breakthrough with severe nausea, photophobia, and visual aura',
        createdAt: new Date().toISOString(),
        vitals: { bloodPressure: '142/92', heartRate: '92' },
      };
      const testLogs = [simulatedLog, ...logs];
      return {
        activeLogs: testLogs,
        activeSpikeAnalysis: analyzeSymptomSeveritySpike(testLogs),
      };
    }
    return {
      activeLogs: logs,
      activeSpikeAnalysis: spikeAnalysis,
    };
  }, [logs, simulateSpike, spikeAnalysis]);

  const recentLogsSlice = activeLogs.slice(0, 4);

  const getSeverityColor = (sev: number) => {
    if (sev >= 7) return 'bg-rose-500 text-rose-700';
    if (sev >= 4) return 'bg-amber-400 text-amber-700';
    return 'bg-emerald-500 text-emerald-700';
  };

  return (
    <div id="bento-dashboard-grid" className="grid grid-cols-12 gap-4 lg:gap-5 pb-10">
      {/* Longitudinal Trajectory Monitor & Spike Status Bar (col-span-12) */}
      <div
        id="bento-trajectory-status-bar"
        className="col-span-12 bg-white rounded-xl border border-slate-200 shadow-2xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Symptom Trajectory Monitor:</span>
          </div>
          <span className="text-slate-600">
            7d Avg:{' '}
            <strong className={activeSpikeAnalysis.hasSpike ? 'text-rose-600 font-bold' : 'text-slate-800'}>
              {activeSpikeAnalysis.roundedAvg7d}/10
            </strong>{' '}
            vs 30d Baseline:{' '}
            <strong className="text-slate-800 font-bold">{activeSpikeAnalysis.roundedAvg30d}/10</strong>{' '}
            (
            <strong className={activeSpikeAnalysis.hasSpike ? 'text-rose-600 font-bold' : 'text-slate-700'}>
              {activeSpikeAnalysis.diffFormatted}
            </strong>
            )
          </span>

          {activeSpikeAnalysis.hasSpike ? (
            <span
              id="flag-spike-indicator-badge"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200"
            >
              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
              <span>Flagged (&gt; 2.0 pts spike)</span>
            </span>
          ) : (
            <span
              id="flag-steady-indicator-badge"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Within Variance (&le; 2.0 pts)</span>
            </span>
          )}
        </div>

        {/* Interactive Simulation / Test Trigger */}
        <div className="flex items-center gap-2">
          {isAlertDismissed && activeSpikeAnalysis.hasSpike && (
            <button
              id="btn-reopen-spike-flag"
              type="button"
              onClick={() => setIsAlertDismissed(false)}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold underline"
            >
              Show Flare Banner
            </button>
          )}
          <button
            id="btn-toggle-spike-simulation"
            type="button"
            onClick={() => {
              setSimulateSpike((prev) => !prev);
              setIsAlertDismissed(false);
            }}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
              simulateSpike
                ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Toggle simulated 7-day severity spike to test flare alert behavior"
          >
            <Flame className={`w-3 h-3 ${simulateSpike ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>{simulateSpike ? 'Reset Simulation' : 'Simulate 7d Flare (+2.5 pts)'}</span>
          </button>
        </div>
      </div>

      {/* Acute Symptom Severity Flare Alert Flag (col-span-12) */}
      {activeSpikeAnalysis.hasSpike && !isAlertDismissed && (
        <div
          id="bento-flag-7d-symptom-spike"
          role="alert"
          className="col-span-12 bg-gradient-to-r from-rose-50 via-white to-amber-50 rounded-2xl border-2 border-rose-300/90 p-5 lg:p-6 shadow-xs relative overflow-hidden transition-all"
        >
          {/* Top accent gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs ring-4 ring-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>Clinical Flag: Acute Symptom Surge</span>
                  </span>
                  <span className="text-xs font-bold text-rose-700">
                    7-Day Average Spiked {activeSpikeAnalysis.diffFormatted} vs 30-Day Baseline
                  </span>
                  {simulateSpike && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                      Simulated Test Mode
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  7-Day Symptom Severity has Increased by &gt; 2.0 Points Above 30-Day Average
                </h3>

                <p className="text-xs text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
                  Symptom severity over the last 7 days averaged{' '}
                  <strong className="text-rose-700 font-bold">{activeSpikeAnalysis.roundedAvg7d} / 10</strong>{' '}
                  (from {activeSpikeAnalysis.count7d} entries, peaking at {activeSpikeAnalysis.peak7dSeverity}/10), representing an escalation of{' '}
                  <strong className="text-rose-700 font-bold">{activeSpikeAnalysis.diffFormatted}</strong> over your 30-day baseline average of{' '}
                  <strong className="text-slate-800 font-bold">{activeSpikeAnalysis.roundedAvg30d} / 10</strong>.
                  This exceeds the clinical safety threshold of 2.0 points and has been flagged for consultation review.
                </p>

                {activeSpikeAnalysis.recent7dSymptoms.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">Recent 7-Day Symptoms:</span>
                    {activeSpikeAnalysis.recent7dSymptoms.map((symp, sIdx) => (
                      <span
                        key={sIdx}
                        className="bg-white/90 border border-slate-200 px-2 py-0.5 rounded text-slate-700 italic max-w-xs truncate"
                      >
                        "{symp}"
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Metric Comparison Stats & Action CTAs */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch lg:items-end gap-3 shrink-0">
              {/* Quantitative comparison chips */}
              <div className="flex items-center justify-around gap-2 bg-white/95 border border-rose-200 px-3.5 py-2.5 rounded-xl text-center shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">7d Mean</span>
                  <span className="text-sm font-black text-rose-600">{activeSpikeAnalysis.roundedAvg7d} / 10</span>
                </div>
                <span className="text-slate-300 font-light text-lg">/</span>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">30d Base</span>
                  <span className="text-sm font-extrabold text-slate-700">{activeSpikeAnalysis.roundedAvg30d} / 10</span>
                </div>
                <span className="text-slate-300 font-light text-lg">=</span>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Spike Delta</span>
                  <span className="text-sm font-black text-rose-600">{activeSpikeAnalysis.diffFormatted}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-flag-prioritize-brief"
                  type="button"
                  onClick={() => onNavigateTab('brief')}
                  className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>Prioritize in Brief</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-flag-add-log"
                  type="button"
                  onClick={onOpenNewLogModal}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                >
                  Log Entry
                </button>
                <button
                  id="btn-dismiss-flag-banner"
                  type="button"
                  onClick={() => setIsAlertDismissed(true)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Dismiss alert banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 0. Medication & Treatment Clash Alerts Card (col-span-12 lg:col-span-8) */}
      <MedicationTreatmentClashCard baseline={baseline} onNavigateTab={onNavigateTab} />

      {/* 1. Baseline Profile Bento Card (col-span-12 lg:col-span-4) */}
      <div
        id="bento-card-baseline"
        className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col p-5 hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Pill className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Baseline Profile
            </h2>
          </div>
          <button
            id="btn-bento-edit-profile"
            type="button"
            onClick={() => onNavigateTab('baseline')}
            className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>Edit Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3 flex-1 flex flex-col justify-between">
          {/* Conditions */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block tracking-wider">
              Diagnoses & Conditions ({baseline.conditions.length})
            </span>
            {baseline.conditions.length > 0 ? (
              <ul className="text-xs space-y-1 text-slate-700 font-medium">
                {baseline.conditions.slice(0, 3).map((cond, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate">{cond}</span>
                  </li>
                ))}
                {baseline.conditions.length > 3 && (
                  <li className="text-[11px] text-slate-400 pl-3">
                    +{baseline.conditions.length - 3} more diagnoses
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">No conditions recorded</p>
            )}
          </div>

          {/* Active Medications */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block tracking-wider">
              Active Medications ({baseline.medications.length})
            </span>
            {baseline.medications.length > 0 ? (
              <div className="space-y-1.5">
                {baseline.medications.slice(0, 3).map((med) => (
                  <div key={med.id} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                      {med.name}
                    </span>
                    <span className="text-[11px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-mono font-medium shrink-0">
                      {med.dose}
                    </span>
                  </div>
                ))}
                {baseline.medications.length > 3 && (
                  <div className="text-[11px] text-slate-400 pt-0.5">
                    +{baseline.medications.length - 3} more medications
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No current medications</p>
            )}
          </div>

          {/* Allergies */}
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <span className="text-[10px] text-rose-400 font-bold uppercase mb-1 block tracking-wider">
              Allergies & Adverse Intolerances
            </span>
            {baseline.allergies.length > 0 ? (
              <p className="text-xs text-rose-700 font-semibold truncate">
                {baseline.allergies.join(', ')}
              </p>
            ) : (
              <p className="text-xs text-rose-600 font-medium">No Known Drug Allergies (NKDA)</p>
            )}
          </div>

          {/* Past Surgeries */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1 block tracking-wider">
              Key Prior Investigations
            </span>
            {baseline.surgeriesAndInvestigations.length > 0 ? (
              <p className="text-xs text-slate-700 font-medium truncate">
                {baseline.surgeriesAndInvestigations[0].title}
                {baseline.surgeriesAndInvestigations[0].dateOrYear
                  ? ` (${baseline.surgeriesAndInvestigations[0].dateOrYear})`
                  : ''}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">None recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Recent Activity Log Bento Card (col-span-12 lg:col-span-8) */}
      <div
        id="bento-card-activity"
        className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col p-5 hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Recent Activity & Treatment Log
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-bento-add-log"
              type="button"
              onClick={onOpenNewLogModal}
              className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('log')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1"
            >
              View All ({logs.length})
            </button>
          </div>
        </div>

        {/* Table layout matching Bento snippet */}
        <div className="border border-slate-100 rounded-xl overflow-hidden flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold text-[11px] border-b border-slate-100 uppercase tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Symptom Severity</th>
                <th className="p-3">Vitals</th>
                <th className="p-3">Medication Change</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {recentLogsSlice.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full ${
                            item.severity >= 7
                              ? 'bg-rose-500'
                              : item.severity >= 4
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${(item.severity / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {item.severity}/10
                      </span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    {item.vitals?.bloodPressure ? (
                      <span className="font-semibold text-slate-800">
                        {item.vitals.bloodPressure} mmHg
                      </span>
                    ) : item.vitals?.heartRate ? (
                      <span>{item.vitals.heartRate} bpm</span>
                    ) : item.vitals?.weight ? (
                      <span>{item.vitals.weight}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not logged</span>
                    )}
                  </td>
                  <td className="p-3">
                    {item.medicationChanges ? (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-100">
                        {item.medicationChanges.length > 28
                          ? `${item.medicationChanges.slice(0, 28)}...`
                          : item.medicationChanges}
                      </span>
                    ) : (
                      <span className="text-slate-400">&mdash;</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('log')}
                      className="text-blue-600 hover:text-blue-800 font-medium text-[11px]"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                    No symptom or vitals entries logged yet. Click "+ New Entry" above to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Trailing 30-Day Symptom Severity Summary Card (col-span-12 lg:col-span-4) */}
      <SymptomSeverity30dCard
        logs={activeLogs}
        onOpenNewLogModal={onOpenNewLogModal}
        onNavigateTab={onNavigateTab}
      />

      {/* 4. Recharts Vitals & Severity Longitudinal Chart (col-span-12 lg:col-span-8) */}
      <VitalsTrendChart logs={activeLogs} onOpenNewLogModal={onOpenNewLogModal} />

      {/* 4. Clinical Summary Brief Bento Card (col-span-12 lg:col-span-8) */}
      <div
        id="bento-card-summary"
        className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-6 bg-gradient-to-br from-white to-blue-50/20 hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800 tracking-tight">
                  Clinical Summary Brief
                </h2>
                {currentBrief && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Status: {currentBrief.trajectoryStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {currentBrief
                  ? `Compiled: ${currentBrief.dateGenerated} • Client-Side De-Identified`
                  : 'Synthesize your history and logs into a 1-page specialist brief'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-bento-recompile"
              type="button"
              onClick={onCompileBrief}
              disabled={isCompiling}
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors border border-blue-200 flex items-center gap-1.5"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
              <span>{isCompiling ? 'Synthesizing...' : 'Re-Compile'}</span>
            </button>
            <button
              id="btn-bento-open-brief"
              type="button"
              onClick={() => onNavigateTab('brief')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>Full Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {currentBrief ? (
          <div className="space-y-4 flex-1">
            {/* Chief Trajectory */}
            <div className="p-3.5 bg-white/90 rounded-xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1 block">
                Chief Trajectory
              </span>
              <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                "{currentBrief.chiefTrajectory}"
              </p>
            </div>

            {/* Regimen Changes */}
            {currentBrief.regimenChanges && currentBrief.regimenChanges.length > 0 && (
              <div className="p-3 bg-white/90 rounded-xl border border-slate-100 shadow-xs">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1 block">
                  Regimen Adjustments Since Baseline
                </span>
                <ul className="text-xs text-slate-700 space-y-1">
                  {currentBrief.regimenChanges.map((change, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">&bull;</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Priority Questions Box */}
            <div className="bg-blue-600/5 p-4 rounded-xl border border-blue-100">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-2.5 block">
                Priority Specialist Consultation Questions
              </span>
              <div className="space-y-2">
                {currentBrief.top3Priorities.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {item.number}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 leading-snug">{item.question}</p>
                      {item.rationale && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.rationale}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center uppercase tracking-wider">
              {currentBrief.safetyDisclaimer}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-white/70 rounded-xl border border-slate-200 border-dashed space-y-3">
            <Sparkles className="w-8 h-8 text-blue-500 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-slate-800">No brief compiled yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Generate a 1-page pre-consultation report that clinical specialists can review in under 60 seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={onCompileBrief}
              disabled={isCompiling}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Compile Clinical Brief Now
            </button>
          </div>
        )}
      </div>

      {/* 4. Privacy & Security Bento Card (col-span-12 lg:col-span-4) */}
      <div
        id="bento-card-privacy"
        className="col-span-12 lg:col-span-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-md p-5 flex flex-col justify-between text-white"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black tracking-widest uppercase text-slate-400">
              Privacy & Security
            </h3>
            <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
              Zero Cloud PII
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            All medical data is stored{' '}
            <span className="text-emerald-400 font-bold">locally on your browser</span>. No identifying information is transmitted to external servers without automatic in-memory redaction.
          </p>

          <div
            onClick={onOpenPrivacyModal}
            className="p-3 bg-slate-700/50 rounded-xl border border-slate-600 flex items-center gap-3 cursor-pointer hover:bg-slate-700/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-semibold text-slate-200">Local Redaction Engine</div>
              <div className="text-[11px] text-slate-400">DOB, Address, NHS ID Scrubbed</div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-6">
          <button
            id="btn-bento-print-summary"
            type="button"
            onClick={onPrintBrief}
            className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/40 text-white"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save 1-Page PDF</span>
          </button>
          <button
            type="button"
            onClick={onOpenPrivacyModal}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-200 font-medium py-1"
          >
            Inspect Privacy Rules &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
