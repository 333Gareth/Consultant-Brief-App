import React, { useState, useMemo } from 'react';
import { BaselineProfile, TreatmentLogEntry } from '../types';
import {
  evaluateProfileSafety,
  TreatmentClashAlert,
} from '../utils/treatmentClashEngine';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  MessageSquare,
  GitPullRequest,
  Copy,
  Check,
  Search,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  SlidersHorizontal,
  Stethoscope,
  HeartPulse,
  Pill,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface TreatmentSafetyTabProps {
  baseline: BaselineProfile;
  logs: TreatmentLogEntry[];
  onNavigateTab: (tab: 'bento' | 'baseline' | 'log' | 'brief' | 'safety') => void;
}

export const TreatmentSafetyTab: React.FC<TreatmentSafetyTabProps> = ({
  baseline,
  logs,
  onNavigateTab,
}) => {
  const [prospectiveInput, setProspectiveInput] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [expandedAlertIds, setExpandedAlertIds] = useState<Record<string, boolean>>({
    'alert-candesartan-amlodipine': true,
    'alert-nsaid-intolerance': true,
  });
  const [activeTabPerAlert, setActiveTabPerAlert] = useState<
    Record<string, 'procedure' | 'communication' | 'decisions'>
  >({});
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  // Pre-consultation interactive checklist state
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const evaluation = useMemo(() => {
    return evaluateProfileSafety(baseline, prospectiveInput);
  }, [baseline, prospectiveInput]);

  const toggleExpand = (id: string) => {
    setExpandedAlertIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptId(id);
    setTimeout(() => setCopiedScriptId(null), 2500);
  };

  const handleChecklistToggle = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const filteredAlerts = useMemo(() => {
    if (activeCategoryFilter === 'all') return evaluation.alerts;
    return evaluation.alerts.filter((a) => a.category === activeCategoryFilter);
  }, [evaluation.alerts, activeCategoryFilter]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            Critical Clash
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            High Caution
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            Moderate Interaction
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Clinical Precaution
          </span>
        );
    }
  };

  return (
    <div id="treatment-safety-tab-view" className="space-y-6 pb-16">
      {/* 1. Header Banner & Safety Triage Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 lg:p-7 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Medication & Treatment Safety Hub
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {evaluation.alerts.length} Active Safety Checks
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Automated clinical clash detection, procedure withholding schedules, consultant communication
                dialogues, and decision analytics designed to prepare you for specialist consultations.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Print Action */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Triage Status:</span>
              <span
                className={`font-bold uppercase text-[11px] ${
                  evaluation.criticalCount > 0
                    ? 'text-rose-600'
                    : evaluation.highCount > 0
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }`}
              >
                {evaluation.criticalCount > 0
                  ? 'Immediate Action Required'
                  : evaluation.highCount > 0
                  ? 'High Caution Review'
                  : 'Routine Surveillance'}
              </span>
            </div>

            <button
              id="btn-print-safety-summary"
              type="button"
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Safety Summary</span>
            </button>
          </div>
        </div>

        {/* Highlighted Analytics Category Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Drug-Drug Clashes</span>
              <Pill className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-lg font-black text-slate-800 mt-1 block">
              {evaluation.alerts.filter((a) => a.category === 'drug-drug').length}
            </span>
            <span className="text-[10px] text-slate-500">Vasodilatory & renal interactions</span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Allergy Contraindications</span>
              <Flame className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-lg font-black text-slate-800 mt-1 block">
              {evaluation.alerts.filter((a) => a.category === 'drug-allergy').length}
            </span>
            <span className="text-[10px] text-slate-500">NSAIDs & Penicillin precautions</span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Procedure Protocols</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-lg font-black text-slate-800 mt-1 block">
              {evaluation.alerts.filter((a) => a.procedureAnalytics).length}
            </span>
            <span className="text-[10px] text-slate-500">Pre-op withholding timelines</span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Consultant Scripts</span>
              <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="text-lg font-black text-slate-800 mt-1 block">
              {evaluation.alerts.length}
            </span>
            <span className="text-[10px] text-slate-500">Verbatim dialogue templates</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Prospective Treatment & Clash Analyzer */}
      <div
        id="section-prospective-treatment-analyzer"
        className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 lg:p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Interactive Treatment & Procedure Clash Checker
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Test any planned medication, OTC remedy, imaging contrast, or surgery against your active profile
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-prospective-treatment-full"
              type="text"
              value={prospectiveInput}
              onChange={(e) => setProspectiveInput(e.target.value)}
              placeholder="Enter prospective drug or procedure (e.g. Ibuprofen, Naproxen, Sudafed, Contrast CT, General Surgery, Meloxicam, Potassium)"
              className="w-full pl-9 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
            />
            {prospectiveInput && (
              <button
                type="button"
                onClick={() => setProspectiveInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Click Scenario Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Test Quick Scenarios:</span>
          {[
            { label: 'Oral NSAID (Ibuprofen / Naproxen)', val: 'Ibuprofen' },
            { label: 'Cold Decongestant (Sudafed)', val: 'Pseudoephedrine' },
            { label: 'CT Scan with Contrast Dye', val: 'Contrast CT' },
            { label: 'Potassium Supplement / Salt Sub', val: 'Potassium' },
            { label: 'Surgery with Anesthesia', val: 'Surgery' },
          ].map((scen) => (
            <button
              key={scen.val}
              type="button"
              onClick={() => setProspectiveInput(scen.val)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                prospectiveInput === scen.val
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {scen.label}
            </button>
          ))}
        </div>

        {/* Prospective Test Banner if active */}
        {prospectiveInput && (
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-blue-900 font-medium">
                Testing prospective treatment: <strong>"{prospectiveInput}"</strong>. Analyzing clinical contraindications against Candesartan, Amlodipine, Hypertension, and NSAID/Penicillin allergies.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setProspectiveInput('')}
              className="text-blue-700 hover:text-blue-900 font-bold shrink-0 underline"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* 3. Filter Navigation & Active Clash Alerts List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Detailed Clash Analyses ({filteredAlerts.length})
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Alerts' },
              { id: 'drug-drug', label: 'Drug-Drug' },
              { id: 'drug-allergy', label: 'Allergy Clashes' },
              { id: 'procedure-safety', label: 'Procedures' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeCategoryFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Render Alert Cards */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isExpanded = expandedAlertIds[alert.id] ?? true;
            const subTab = activeTabPerAlert[alert.id] || 'communication';

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                  alert.severity === 'critical'
                    ? 'border-rose-300 ring-2 ring-rose-50'
                    : alert.severity === 'high'
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                {/* Alert Card Header */}
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors flex items-start justify-between gap-4"
                  onClick={() => toggleExpand(alert.id)}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSeverityBadge(alert.severity)}
                      <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                      {alert.isProspective && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                          Simulated Clash
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed max-w-3xl font-normal">
                      {alert.summary}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
                      <span className="font-semibold text-slate-700">Involved Entities:</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {alert.substancesInvolved.join(' • ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                      {isExpanded ? 'Collapse' : 'Expand Analytics'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expandable Deep Analytics Body */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
                    {/* Clinical Mechanism Callout */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        <span>Biological Mechanism of Clash</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {alert.clinicalMechanism}
                      </p>
                    </div>

                    {/* Sub-Tabs Selector: Procedure Analytics | Consultant Scripts | Potential Decisions */}
                    <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTabPerAlert((prev) => ({ ...prev, [alert.id]: 'communication' }))
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          subTab === 'communication'
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>1. Consultant Communication Script</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTabPerAlert((prev) => ({ ...prev, [alert.id]: 'procedure' }))
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          subTab === 'procedure'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>2. Procedure Safety & Withholding</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTabPerAlert((prev) => ({ ...prev, [alert.id]: 'decisions' }))
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          subTab === 'decisions'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <GitPullRequest className="w-3.5 h-3.5" />
                        <span>3. Potential Decisions & Alternatives</span>
                      </button>
                    </div>

                    {/* SUB-VIEW 1: COMMUNICATION SCRIPT & STRATEGIC QUESTIONS */}
                    {subTab === 'communication' && (
                      <div className="space-y-3 pt-1">
                        <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                              Target Consultant Role: {alert.communication.consultantRole}
                            </span>
                            <span className="text-xs text-purple-700 font-medium">
                              {alert.communication.talkingPointSummary}
                            </span>
                          </div>

                          {/* Verbatim Script Quote Box */}
                          <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                                Exact Script to Say to Your Doctor:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(alert.communication.verbatimScript, alert.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors"
                              >
                                {copiedScriptId === alert.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Script</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <blockquote className="text-xs text-slate-800 italic font-medium leading-relaxed bg-slate-50/80 p-3 rounded-lg border-l-3 border-purple-500">
                              {alert.communication.verbatimScript}
                            </blockquote>
                          </div>

                          {/* 3 Questions to Ask */}
                          <div className="bg-white p-3.5 rounded-xl border border-purple-200 space-y-2">
                            <span className="text-xs font-bold text-slate-900 block">
                              Key Questions to Ask During Your Appointment:
                            </span>
                            <ol className="space-y-1.5 list-decimal list-inside text-xs text-slate-700 font-medium">
                              {alert.communication.keyQuestionsToAsk.map((q, qIdx) => (
                                <li key={qIdx} className="leading-relaxed">
                                  <span>{q}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div className="text-[11px] text-purple-900 bg-purple-100/70 p-2.5 rounded-lg flex items-center gap-1.5">
                            <span className="font-bold">Consultation Documentation Tip:</span>
                            <span>{alert.communication.documentationTip}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-VIEW 2: PROCEDURE SAFETY & WITHHOLDING ANALYTICS */}
                    {subTab === 'procedure' && alert.procedureAnalytics && (
                      <div className="space-y-3 pt-1">
                        <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                              Procedure Profile: {alert.procedureAnalytics.procedureName}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              Safety Risk: {alert.procedureAnalytics.riskLevel.toUpperCase()}
                            </span>
                          </div>

                          {/* 3 Metric Metrics */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                Withholding Window
                              </span>
                              <span className="text-xs font-extrabold text-rose-700 block mt-1">
                                {alert.procedureAnalytics.withholdingWindow}
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                Renal Clearance Impact
                              </span>
                              <span className="text-xs font-bold text-amber-700 uppercase block mt-1">
                                {alert.procedureAnalytics.renalImpact} impact
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                Hemodynamic Sensitivity
                              </span>
                              <span className="text-xs font-bold text-blue-700 uppercase block mt-1">
                                {alert.procedureAnalytics.hemodynamicImpact} sensitivity
                              </span>
                            </div>
                          </div>

                          {/* Checklist */}
                          <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-2">
                            <span className="text-xs font-bold text-slate-900 block">
                              Pre-Procedure Preparation Protocol:
                            </span>
                            <ul className="space-y-1.5">
                              {alert.procedureAnalytics.preProcedureChecklist.map((item, cIdx) => (
                                <li key={cIdx} className="text-xs text-slate-700 flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="text-[11px] text-blue-900 bg-white p-2.5 rounded-lg border border-blue-200">
                            <strong>Post-Procedure Recovery Note: </strong>
                            {alert.procedureAnalytics.postProcedureGuidance}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-VIEW 3: POTENTIAL DECISIONS & ALTERNATIVES */}
                    {subTab === 'decisions' && (
                      <div className="space-y-3 pt-1">
                        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                              Clinical Decision Framework: {alert.decisionAnalytics.scenarioTitle}
                            </span>
                          </div>

                          {/* Recommended Pathway */}
                          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                              Primary Recommended Path:
                            </span>
                            <p className="text-xs font-bold text-slate-900 leading-relaxed">
                              {alert.decisionAnalytics.recommendedDecision}
                            </p>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {alert.decisionAnalytics.clinicalRationale}
                            </p>
                          </div>

                          {/* Evaluated Alternatives Grid */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-900 block">
                              Alternative Treatment Candidates Compared:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {alert.decisionAnalytics.alternatives.map((alt, aIdx) => (
                                <div
                                  key={aIdx}
                                  className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-slate-900">{alt.name}</span>
                                    <span
                                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
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
                                    <strong className="text-emerald-700">Advantages: </strong>
                                    {alt.pros}
                                  </p>
                                  <p className="text-[11px] text-slate-700">
                                    <strong className="text-rose-600">Risks / Watch-outs: </strong>
                                    {alt.cons}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="text-[11px] text-emerald-950 bg-white p-2.5 rounded-lg border border-emerald-200">
                            <strong>Ongoing Monitoring Protocol: </strong>
                            {alert.decisionAnalytics.monitoringProtocol}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Consultant Preparation & Communication Advice Blueprint */}
      <div
        id="section-consultant-prep-guide"
        className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 lg:p-7 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Consultant Appointment Preparation & Advice Blueprint
            </h2>
            <p className="text-xs text-slate-500">
              Actionable steps to maximize your 10-15 minute specialist consultation and ensure clinical safety
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Pre-Appointment Checklist (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Interactive Pre-Consultation Checklist</span>
            </h3>

            <div className="space-y-2">
              {evaluation.consultationChecklist.map((item, idx) => {
                const isChecked = !!checkedItems[idx];
                return (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleChecklistToggle(idx)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs leading-relaxed font-medium">
                      {item}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Consultation Strategy & Time Management (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span>How to Structure Your 15-Minute Slot</span>
            </h3>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="border-l-2 border-blue-500 pl-3 space-y-0.5">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Minutes 1 - 3: Chief Trajectory & Clashes</span>
                <p className="text-slate-700 font-medium">
                  State your primary symptom shift and immediately mention your drug & allergy clashes (e.g. Candesartan + NSAID allergy).
                </p>
              </div>

              <div className="border-l-2 border-purple-500 pl-3 space-y-0.5">
                <span className="text-[10px] font-bold text-purple-700 uppercase">Minutes 4 - 9: Objective Trajectory Data</span>
                <p className="text-slate-700 font-medium">
                  Hand over or review your 7-day vitals trends and the 3 prioritized questions from your Consultation Brief.
                </p>
              </div>

              <div className="border-l-2 border-emerald-500 pl-3 space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Minutes 10 - 15: Agreed Decisions & Follow-up</span>
                <p className="text-slate-700 font-medium">
                  Agree on precise next steps, prescription safety clearances, lab tests, and scheduled follow-up milestones.
                </p>
              </div>
            </div>

            {/* Link to Brief Compiler */}
            <button
              type="button"
              onClick={() => onNavigateTab('brief')}
              className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs p-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Compile & Print Personalized Consultation Brief</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
