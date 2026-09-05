import React, { useState, useMemo } from 'react';
import { BaselineProfile } from '../types';
import {
  evaluateProfileSafety,
  TreatmentClashAlert,
} from '../utils/treatmentClashEngine';
import {
  AlertTriangle,
  ShieldAlert,
  Flame,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Stethoscope,
  MessageSquare,
  GitPullRequest,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Search,
} from 'lucide-react';

interface MedicationTreatmentClashCardProps {
  baseline: BaselineProfile;
  onNavigateTab: (tab: 'bento' | 'baseline' | 'log' | 'brief' | 'safety') => void;
}

export const MedicationTreatmentClashCard: React.FC<MedicationTreatmentClashCardProps> = ({
  baseline,
  onNavigateTab,
}) => {
  const [selectedTab, setSelectedTab] = useState<'alerts' | 'procedure' | 'communication' | 'decisions'>('alerts');
  const [prospectiveInput, setProspectiveInput] = useState<string>('');
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  // Evaluate safety rules against baseline and any prospective treatment
  const evaluation = useMemo(() => {
    return evaluateProfileSafety(baseline, prospectiveInput);
  }, [baseline, prospectiveInput]);

  const activeAlerts = evaluation.alerts;
  const primaryAlert: TreatmentClashAlert | undefined = activeAlerts[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptId(id);
    setTimeout(() => setCopiedScriptId(null), 2500);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <Flame className="w-3 h-3 text-rose-600" />
            Critical Clash
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            High Caution
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <ShieldAlert className="w-3 h-3 text-blue-600" />
            Moderate Interaction
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Notice
          </span>
        );
    }
  };

  return (
    <div
      id="bento-card-medication-clash-alerts"
      className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 lg:p-6 flex flex-col hover:border-slate-300 transition-colors"
    >
      {/* Header with Title & Safety Counter Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Treatment & Medication Clash Alerts
              </h2>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                {activeAlerts.length} Flagged
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interaction alerts, procedure precautions, and consultant discussion analytics
            </p>
          </div>
        </div>

        {/* View Full Safety Hub Button */}
        <button
          id="btn-bento-open-safety-hub"
          type="button"
          onClick={() => onNavigateTab('safety')}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-2xs group"
        >
          <span>Open Full Safety Hub</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Analytics Sub-Tabs: Alerts | Procedure Safety | Communication | Decisions */}
      <div className="flex items-center gap-1.5 pt-3 pb-2 overflow-x-auto no-scrollbar">
        <button
          id="tab-clash-alerts"
          type="button"
          onClick={() => setSelectedTab('alerts')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            selectedTab === 'alerts'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Active Alerts ({activeAlerts.length})</span>
        </button>

        <button
          id="tab-clash-procedure"
          type="button"
          onClick={() => setSelectedTab('procedure')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            selectedTab === 'procedure'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Procedure Analytics</span>
        </button>

        <button
          id="tab-clash-communication"
          type="button"
          onClick={() => setSelectedTab('communication')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            selectedTab === 'communication'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Consultant Scripts</span>
        </button>

        <button
          id="tab-clash-decisions"
          type="button"
          onClick={() => setSelectedTab('decisions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            selectedTab === 'decisions'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>Potential Decisions</span>
        </button>
      </div>

      {/* Quick Interactive Prospective Treatment Tester */}
      <div className="my-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-500 font-medium">Test prospective treatment:</span>
          <input
            id="input-prospective-treatment-bento"
            type="text"
            value={prospectiveInput}
            onChange={(e) => setProspectiveInput(e.target.value)}
            placeholder="e.g. Ibuprofen, Sudafed, CT Contrast, Surgery"
            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {prospectiveInput && (
            <button
              type="button"
              onClick={() => setProspectiveInput('')}
              className="text-[11px] text-slate-400 hover:text-slate-600 px-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Preset quick test tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Presets:</span>
          {['Ibuprofen', 'Sudafed', 'Surgery', 'Contrast CT'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setProspectiveInput(preset)}
              className={`text-[11px] px-2 py-0.5 rounded-md border font-medium transition-colors ${
                prospectiveInput === preset
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 mt-1">
        {/* TAB 1: ACTIVE ALERTS */}
        {selectedTab === 'alerts' && (
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  alert.severity === 'critical'
                    ? 'bg-rose-50/60 border-rose-200'
                    : alert.severity === 'high'
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(alert.severity)}
                    <h3 className="text-xs font-bold text-slate-900">{alert.title}</h3>
                    {alert.isProspective && (
                      <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
                        Prospective Test
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium shrink-0">
                    {alert.substancesInvolved.join(' + ')}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-normal mb-2">
                  {alert.summary}
                </p>

                {/* Highlighted miniature strip: Procedure / Script / Decision preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                  <div className="bg-white/80 p-2 rounded-lg border border-slate-200/50">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                      Procedure Precaution
                    </span>
                    <span className="text-slate-700 font-medium line-clamp-1">
                      {alert.procedureAnalytics?.withholdingWindow || 'Standard care'}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2 rounded-lg border border-slate-200/50">
                    <span className="text-purple-600 font-semibold block text-[10px] uppercase">
                      Consultant Script
                    </span>
                    <span className="text-slate-700 font-medium line-clamp-1 italic">
                      "{alert.communication.talkingPointSummary}"
                    </span>
                  </div>

                  <div className="bg-white/80 p-2 rounded-lg border border-slate-200/50">
                    <span className="text-emerald-600 font-semibold block text-[10px] uppercase">
                      Recommended Decision
                    </span>
                    <span className="text-slate-700 font-medium line-clamp-1">
                      {alert.decisionAnalytics.recommendedDecision}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: PROCEDURE ANALYTICS */}
        {selectedTab === 'procedure' && primaryAlert && (
          <div className="space-y-3">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/70 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                    Pre-Procedure Medication Withholding & Safety Analytics
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Target: {primaryAlert.procedureAnalytics?.procedureName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Withholding Window</span>
                  <span className="text-xs font-bold text-rose-700 block mt-0.5">
                    {primaryAlert.procedureAnalytics?.withholdingWindow}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Renal Impact</span>
                  <span className="text-xs font-bold text-amber-700 uppercase block mt-0.5">
                    {primaryAlert.procedureAnalytics?.renalImpact} risk
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Hemodynamic Impact</span>
                  <span className="text-xs font-bold text-blue-700 uppercase block mt-0.5">
                    {primaryAlert.procedureAnalytics?.hemodynamicImpact} risk
                  </span>
                </div>
              </div>

              {primaryAlert.procedureAnalytics?.preProcedureChecklist && (
                <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-800 block">Pre-Procedure Action Checklist:</span>
                  <ul className="space-y-1">
                    {primaryAlert.procedureAnalytics.preProcedureChecklist.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-lg border border-blue-100">
                <strong className="text-slate-800">Post-Procedure Recovery Guidance: </strong>
                {primaryAlert.procedureAnalytics?.postProcedureGuidance}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: CONSULTANT COMMUNICATION SCRIPTS */}
        {selectedTab === 'communication' && primaryAlert && (
          <div className="space-y-3">
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/70 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                    Consultant Communication Script & Strategic Questions
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Target: {primaryAlert.communication.consultantRole}
                </span>
              </div>

              {/* Verbatim Script Box with Copy Action */}
              <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                    Verbatim Discussion Script (Word-for-Word)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(primaryAlert.communication.verbatimScript, primaryAlert.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors"
                  >
                    {copiedScriptId === primaryAlert.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
                <blockquote className="text-xs text-slate-800 italic font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border-l-2 border-purple-500">
                  {primaryAlert.communication.verbatimScript}
                </blockquote>
              </div>

              {/* Key Questions to Ask */}
              <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Top 3 Questions to Ask Your Specialist:
                </span>
                <ol className="space-y-1.5 list-decimal list-inside text-xs text-slate-700">
                  {primaryAlert.communication.keyQuestionsToAsk.map((q, qIdx) => (
                    <li key={qIdx} className="leading-relaxed font-medium">
                      <span>{q}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="text-[11px] text-slate-600 bg-white/90 p-2 rounded-lg border border-purple-100 flex items-center gap-1.5">
                <span className="font-bold text-purple-800">Documentation Tip:</span>
                <span>{primaryAlert.communication.documentationTip}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: POTENTIAL DECISIONS ANALYTICS */}
        {selectedTab === 'decisions' && primaryAlert && (
          <div className="space-y-3">
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/70 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    Potential Decisions & Treatment Trade-Offs
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Scenario: {primaryAlert.decisionAnalytics.scenarioTitle}
                </span>
              </div>

              {/* Recommended Decision Banner */}
              <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Evidence-Based Clinical Recommendation
                </span>
                <p className="text-xs font-bold text-slate-900 leading-relaxed">
                  {primaryAlert.decisionAnalytics.recommendedDecision}
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {primaryAlert.decisionAnalytics.clinicalRationale}
                </p>
              </div>

              {/* Alternatives Comparison Matrix */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Evaluated Alternatives & Clinical Risk Profile:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {primaryAlert.decisionAnalytics.alternatives.map((alt, aIdx) => (
                    <div
                      key={aIdx}
                      className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900">{alt.name}</span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            alt.safetyTier === 'recommended'
                              ? 'bg-emerald-100 text-emerald-800'
                              : alt.safetyTier === 'acceptable'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {alt.safetyTier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700">
                        <strong className="text-emerald-700">Pros: </strong>
                        {alt.pros}
                      </p>
                      <p className="text-[11px] text-slate-700">
                        <strong className="text-rose-600">Cons/Risks: </strong>
                        {alt.cons}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-white/90 p-2 rounded-lg border border-emerald-100">
                <strong className="text-slate-800">Monitoring Protocol: </strong>
                {primaryAlert.decisionAnalytics.monitoringProtocol}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <span className="text-[11px]">
          Always verify medication modifications with your prescribing consultant.
        </span>
        <button
          type="button"
          onClick={() => onNavigateTab('safety')}
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
        >
          <span>Explore Complete Consultant Prep & Advice Hub</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
