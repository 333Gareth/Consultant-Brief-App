import React, { useState, useEffect } from 'react';
import { BaselineProfile, TreatmentLogEntry, ConsultationBrief } from './types';
import {
  loadBaselineProfile,
  saveBaselineProfile,
  loadTreatmentLogs,
  saveTreatmentLogs,
  loadSavedBriefs,
  saveBrief,
  resetToSampleData,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { BentoDashboard } from './components/BentoDashboard';
import { BaselineProfileTab } from './components/BaselineProfileTab';
import { TreatmentLogTab } from './components/TreatmentLogTab';
import { ConsultationBriefTab } from './components/ConsultationBriefTab';
import { TreatmentSafetyTab } from './components/TreatmentSafetyTab';
import { evaluateProfileSafety } from './utils/treatmentClashEngine';
import { PrivacyModal } from './components/PrivacyModal';
import { ShieldCheck, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'bento' | 'baseline' | 'log' | 'brief' | 'safety'>('bento');
  const [baseline, setBaseline] = useState<BaselineProfile>(() => loadBaselineProfile());
  const [logs, setLogs] = useState<TreatmentLogEntry[]>(() => loadTreatmentLogs());
  const [currentBrief, setCurrentBrief] = useState<ConsultationBrief | null>(() => {
    const saved = loadSavedBriefs();
    return saved.length > 0 ? saved[0] : null;
  });
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCompilingBrief, setIsCompilingBrief] = useState(false);

  const handleUpdateBaseline = (updated: BaselineProfile) => {
    setBaseline(updated);
    saveBaselineProfile(updated);
  };

  const handleUpdateLogs = (updatedLogs: TreatmentLogEntry[]) => {
    setLogs(updatedLogs);
    saveTreatmentLogs(updatedLogs);
  };

  const handleSaveBrief = (brief: ConsultationBrief) => {
    setCurrentBrief(brief);
    saveBrief(brief);
    showToast('Consultation brief updated and saved locally');
  };

  const handleResetToDemo = () => {
    const { baseline: newBase, logs: newLogs, brief: newBrief } = resetToSampleData();
    setBaseline(newBase);
    setLogs(newLogs);
    setCurrentBrief(newBrief);
    showToast('Sample patient clinical history restored');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePrintBrief = () => {
    if (activeTab !== 'brief') {
      setActiveTab('brief');
      setTimeout(() => window.print(), 350);
    } else {
      window.print();
    }
  };

  const handleCompileFromBento = async () => {
    setIsCompilingBrief(true);
    try {
      const res = await fetch('/api/compile-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialistType: currentBrief?.specialistType || 'Specialist Consultation',
          baseline: {
            conditions: baseline.conditions,
            medications: baseline.medications,
            allergies: baseline.allergies,
            surgeriesAndInvestigations: baseline.surgeriesAndInvestigations.map((s) => s.title),
          },
          recentLogs: logs,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const compiledBrief: ConsultationBrief = {
            id: `brief-${Date.now()}`,
            dateGenerated: data.data.dateGenerated || new Date().toLocaleDateString(),
            specialistType: currentBrief?.specialistType || 'Specialist Consultation',
            chiefTrajectory: data.data.chiefTrajectory,
            trajectoryStatus: data.data.trajectoryStatus || 'Stable',
            regimenChanges: data.data.regimenChanges || [],
            symptomAndMetricPatterns: data.data.symptomAndMetricPatterns || [],
            vitalsSummary: data.data.vitalsSummary || {},
            top3Priorities: data.data.top3Priorities || [],
            baselineSnapshot: {
              activeConditions: baseline.conditions,
              currentMedications: baseline.medications.map((m) => `${m.name} (${m.dose}, ${m.frequency})`),
              allergies: baseline.allergies,
              surgeriesOrInvestigations: baseline.surgeriesAndInvestigations.map(
                (s) => `${s.title}${s.dateOrYear ? ` (${s.dateOrYear})` : ''}`
              ),
            },
            safetyDisclaimer:
              data.data.safetyDisclaimer ||
              'CONFIDENTIAL PRE-CONSULTATION SUMMARY: Patient-reported factual summary. Does not replace clinical evaluation.',
            redactedTokensCount: 0,
            sourceEngine: data.source || 'gemini-3.8-flash',
          };
          handleSaveBrief(compiledBrief);
          showToast('Clinical brief successfully synthesized with AI');
        }
      }
    } catch {
      showToast('Failed to compile brief');
    } finally {
      setIsCompilingBrief(false);
    }
  };

  const safetyEval = React.useMemo(() => evaluateProfileSafety(baseline), [baseline]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        conditionsCount={baseline.conditions.length}
        medicationsCount={baseline.medications.length}
        logsCount={logs.length}
        hasBrief={Boolean(currentBrief)}
        onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
        onResetSampleData={handleResetToDemo}
        onPrintBrief={handlePrintBrief}
        activeAlertsCount={safetyEval.alerts.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Bento Grid Dashboard View */}
        {activeTab === 'bento' && (
          <BentoDashboard
            baseline={baseline}
            logs={logs}
            currentBrief={currentBrief}
            onNavigateTab={setActiveTab}
            onOpenNewLogModal={() => setActiveTab('log')}
            onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
            onPrintBrief={handlePrintBrief}
            onCompileBrief={handleCompileFromBento}
            isCompiling={isCompilingBrief}
          />
        )}

        {/* Tab 1: Baseline Profile */}
        {activeTab === 'baseline' && (
          <BaselineProfileTab
            profile={baseline}
            onUpdateProfile={handleUpdateBaseline}
            onNavigateToLog={() => setActiveTab('log')}
          />
        )}

        {/* Tab 2: Treatment & Clash Alerts Hub */}
        {activeTab === 'safety' && (
          <TreatmentSafetyTab
            baseline={baseline}
            logs={logs}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Tab 3: Recent Activity & Treatment Log */}
        {activeTab === 'log' && (
          <TreatmentLogTab
            logs={logs}
            onUpdateLogs={handleUpdateLogs}
            onNavigateToBrief={() => setActiveTab('brief')}
          />
        )}

        {/* Tab 4: One-Click Summary Generator */}
        {activeTab === 'brief' && (
          <ConsultationBriefTab
            baseline={baseline}
            logs={logs}
            currentBrief={currentBrief}
            onSaveBrief={handleSaveBrief}
            onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="app-toast-notification"
          className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs border border-slate-700 animate-in slide-in-from-bottom-2"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Privacy Architecture Modal */}
      <PrivacyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        patientPseudonym={baseline.patientPseudonym}
      />
    </div>
  );
}
