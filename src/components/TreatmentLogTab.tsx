import React, { useState } from 'react';
import { TreatmentLogEntry, VitalMetrics } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Activity,
  Heart,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface TreatmentLogTabProps {
  logs: TreatmentLogEntry[];
  onUpdateLogs: (logs: TreatmentLogEntry[]) => void;
  onNavigateToBrief: () => void;
}

export const TreatmentLogTab: React.FC<TreatmentLogTabProps> = ({
  logs,
  onUpdateLogs,
  onNavigateToBrief,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [severity, setSeverity] = useState<number>(3);
  const [symptomsDescription, setSymptomsDescription] = useState('');
  const [medicationChanges, setMedicationChanges] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [weight, setWeight] = useState('');
  const [spO2, setSpO2] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate high-level summary metrics
  const severities = logs.map((l) => l.severity);
  const avgSeverity = severities.length > 0 ? (severities.reduce((a, b) => a + b, 0) / severities.length).toFixed(1) : '—';
  const bpValues = logs.map((l) => l.vitals?.bloodPressure).filter(Boolean);
  const hrValues = logs.map((l) => l.vitals?.heartRate).filter(Boolean);

  const getSeverityBadge = (val: number) => {
    if (val <= 3) return { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-800', label: 'Mild' };
    if (val <= 6) return { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-800', label: 'Moderate' };
    if (val <= 8) return { bg: 'bg-orange-950/80', text: 'text-orange-300', border: 'border-orange-800', label: 'Significant' };
    return { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-800', label: 'Severe' };
  };

  const currentBadge = getSeverityBadge(severity);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const vitals: VitalMetrics = {
      bloodPressure: bloodPressure.trim() || undefined,
      heartRate: heartRate.trim() || undefined,
      weight: weight.trim() || undefined,
      spO2: spO2.trim() || undefined,
    };

    if (editingId) {
      const updated = logs.map((item) =>
        item.id === editingId
          ? {
              ...item,
              date,
              severity,
              symptomsDescription: symptomsDescription.trim(),
              medicationChanges: medicationChanges.trim() || undefined,
              vitals,
              notes: notes.trim() || undefined,
            }
          : item
      );
      onUpdateLogs(updated);
      setEditingId(null);
    } else {
      const newEntry: TreatmentLogEntry = {
        id: `log-${Date.now()}`,
        date,
        severity,
        symptomsDescription: symptomsDescription.trim(),
        medicationChanges: medicationChanges.trim() || undefined,
        vitals,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      // Sort newest first
      const updated = [newEntry, ...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdateLogs(updated);
    }

    // Reset Form
    resetFormFields();
  };

  const resetFormFields = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setSeverity(3);
    setSymptomsDescription('');
    setMedicationChanges('');
    setBloodPressure('');
    setHeartRate('');
    setWeight('');
    setSpO2('');
    setNotes('');
    setEditingId(null);
  };

  const handleEditClick = (entry: TreatmentLogEntry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setSeverity(entry.severity);
    setSymptomsDescription(entry.symptomsDescription || '');
    setMedicationChanges(entry.medicationChanges || '');
    setBloodPressure(entry.vitals?.bloodPressure || '');
    setHeartRate(entry.vitals?.heartRate || '');
    setWeight(entry.vitals?.weight || '');
    setSpO2(entry.vitals?.spO2 || '');
    setNotes(entry.notes || '');
    setIsFormOpen(true);
    // Scroll to form smoothly
    document.getElementById('treatment-log-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string) => {
    onUpdateLogs(logs.filter((l) => l.id !== id));
    if (editingId === id) resetFormFields();
  };

  return (
    <div id="treatment-log-container" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Overview & Vitals Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Recent Activity & Treatment Log</h2>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {logs.length} logged events
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Record daily or episodic symptom severity, regimen changes, and objective vitals.
            </p>
          </div>

          <button
            id="btn-nav-to-compiler"
            type="button"
            onClick={onNavigateToBrief}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Compile 1-Page Summary</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* Quick Snapshot Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Mean Severity</span>
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800 font-mono">{avgSeverity}</span>
              <span className="text-xs text-slate-400">/ 10</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Latest Blood Pressure</span>
            </span>
            <div className="mt-2">
              <span className="text-lg font-bold text-slate-800 font-mono">
                {bpValues[0] || 'None recorded'}
              </span>
              <span className="text-xs text-slate-400 block">mmHg</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              <span>Latest Pulse / HR</span>
            </span>
            <div className="mt-2">
              <span className="text-lg font-bold text-slate-800 font-mono">
                {hrValues[0] ? `${hrValues[0]} bpm` : 'None recorded'}
              </span>
              <span className="text-xs text-slate-400 block">Resting pulse</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-sky-500" />
              <span>Current Weight</span>
            </span>
            <div className="mt-2">
              <span className="text-lg font-bold text-slate-800 font-mono">
                {logs.map((l) => l.vitals?.weight).filter(Boolean)[0] || 'None recorded'}
              </span>
              <span className="text-xs text-slate-400 block">Baseline weight</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Entry Form Section */}
      <section id="treatment-log-form" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                {editingId ? 'Edit Log Entry' : 'Log New Activity or Treatment Event'}
              </h3>
              <p className="text-xs text-slate-400">Chronological symptom checks and therapy responses</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetFormFields}
                className="text-xs text-slate-500 hover:text-slate-800 underline mr-2"
              >
                Cancel Edit
              </button>
            )}
            <button
              id="btn-toggle-log-form"
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {isFormOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isFormOpen && (
          <form onSubmit={handleSaveEntry} className="space-y-5 pt-2">
            {/* Row 1: Date & Interactive Severity Slider */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="input-log-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date of Observation *
                </label>
                <div className="flex gap-2">
                  <input
                    id="input-log-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setDate(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shrink-0 border border-slate-200 transition-colors"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Interactive Severity Slider (1 - 10) */}
              <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="slider-severity" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>Symptom Severity (1 - 10 Scale):</span>
                  </label>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}
                  >
                    {severity} / 10 &bull; {currentBadge.label}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 font-mono">1</span>
                  <input
                    id="slider-severity"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">10</span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 px-1 font-medium">
                  <span>1-3 Mild / Baseline</span>
                  <span>4-6 Moderate</span>
                  <span>7-8 Significant</span>
                  <span>9-10 Severe</span>
                </div>
              </div>
            </div>

            {/* Row 2: Symptoms & Medication Changes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="input-log-symptoms" className="block text-xs font-semibold text-slate-700 mb-1">
                  Symptom Presentation / Complaint *
                </label>
                <input
                  id="input-log-symptoms"
                  type="text"
                  required
                  value={symptomsDescription}
                  onChange={(e) => setSymptomsDescription(e.target.value)}
                  placeholder="e.g. Frontal throbbing headache, transient dizziness when standing"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="input-log-med-changes" className="block text-xs font-semibold text-slate-700 mb-1">
                  Medication Changes / Regimen Adjustments
                </label>
                <input
                  id="input-log-med-changes"
                  type="text"
                  value={medicationChanges}
                  onChange={(e) => setMedicationChanges(e.target.value)}
                  placeholder="e.g. Candesartan titrated to 16mg; missed morning dose; took PRN Paracetamol"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Row 3: Objective Vitals (Blood Pressure, Heart Rate, Weight, SpO2) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Objective Vitals (Optional but recommended for specialist review)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="input-vital-bp" className="block text-[11px] text-slate-500 mb-1 font-medium">
                    Blood Pressure (mmHg)
                  </label>
                  <input
                    id="input-vital-bp"
                    type="text"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    placeholder="e.g. 132/84"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="input-vital-hr" className="block text-[11px] text-slate-500 mb-1 font-medium">
                    Heart Rate (bpm)
                  </label>
                  <input
                    id="input-vital-hr"
                    type="text"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="e.g. 72"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="input-vital-weight" className="block text-[11px] text-slate-500 mb-1 font-medium">
                    Weight (kg / lbs)
                  </label>
                  <input
                    id="input-vital-weight"
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 76.4 kg"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="input-vital-spo2" className="block text-[11px] text-slate-500 mb-1 font-medium">
                    Oxygen Saturation / SpO2 (%)
                  </label>
                  <input
                    id="input-vital-spo2"
                    type="text"
                    value={spO2}
                    onChange={(e) => setSpO2(e.target.value)}
                    placeholder="e.g. 98"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Freeform Observations / Notes */}
            <div>
              <label htmlFor="textarea-log-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Freeform Observations / Contextual Notes
              </label>
              <textarea
                id="textarea-log-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Headache emerged after 4 hours of screen work; resolved after standing up and drinking 500ml water"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                id="btn-save-log-entry"
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Update Log Entry' : 'Save Treatment Entry'}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Log History Cards & Table */}
      <section id="section-log-history" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Recorded Treatment & Symptom History</span>
          </h3>
          <span className="text-xs text-slate-400">Ordered by date (latest first)</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-2">
            <p className="text-sm text-slate-600 font-medium">No activity entries logged yet.</p>
            <p className="text-xs text-slate-400">
              Add your first entry using the form above to track symptom progression.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((entry) => {
              const badge = getSeverityBadge(entry.severity);
              return (
                <div
                  key={entry.id}
                  id={`card-log-${entry.id}`}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-3 shadow-xs"
                >
                  {/* Top Bar: Date, Severity, Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        {entry.date}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        Severity: {entry.severity}/10 ({badge.label})
                      </span>
                      {entry.medicationChanges && (
                        <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                          Regimen Modified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditClick(entry)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(entry.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Complaint */}
                  <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    {entry.symptomsDescription}
                  </div>

                  {/* Medication Changes */}
                  {entry.medicationChanges && (
                    <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700">
                      <span className="font-bold text-blue-700">Regimen / Medication Note:</span>{' '}
                      {entry.medicationChanges}
                    </div>
                  )}

                  {/* Vitals Pills */}
                  {entry.vitals &&
                    (entry.vitals.bloodPressure ||
                      entry.vitals.heartRate ||
                      entry.vitals.weight ||
                      entry.vitals.spO2) && (
                      <div className="flex flex-wrap gap-2 pt-1 text-xs font-mono">
                        {entry.vitals.bloodPressure && (
                          <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg">
                            BP: <span className="font-bold text-slate-800">{entry.vitals.bloodPressure}</span> mmHg
                          </span>
                        )}
                        {entry.vitals.heartRate && (
                          <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg">
                            HR: <span className="font-bold text-slate-800">{entry.vitals.heartRate}</span> bpm
                          </span>
                        )}
                        {entry.vitals.weight && (
                          <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg">
                            Weight: <span className="font-bold text-slate-800">{entry.vitals.weight}</span>
                          </span>
                        )}
                        {entry.vitals.spO2 && (
                          <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg">
                            SpO2: <span className="font-bold text-slate-800">{entry.vitals.spO2}%</span>
                          </span>
                        )}
                      </div>
                    )}

                  {/* Freeform Notes */}
                  {entry.notes && (
                    <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-100">
                      &ldquo;{entry.notes}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
