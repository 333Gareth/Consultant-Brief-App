import React, { useState } from 'react';
import {
  BaselineProfile,
  Medication,
  SurgeryInvestigation,
} from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Pill,
  Stethoscope,
  Scissors,
  Check,
  Save,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface BaselineProfileTabProps {
  profile: BaselineProfile;
  onUpdateProfile: (updated: BaselineProfile) => void;
  onNavigateToLog: () => void;
}

const COMMON_CONDITIONS = [
  'Essential Hypertension',
  'Type 2 Diabetes',
  'Asthma',
  'Osteoarthritis',
  'Migraine',
  'Hypothyroidism',
  'Chronic Kidney Disease',
  'Hypercholesterolemia',
  'Gastroesophageal Reflux (GERD)',
  'Atrial Fibrillation',
];

const COMMON_FREQUENCIES = [
  'Once daily (morning)',
  'Once daily (evening)',
  'Twice daily (morning & night)',
  'Three times daily (with meals)',
  'Every 12 hours',
  'PRN (As needed)',
  'Weekly',
];

export const BaselineProfileTab: React.FC<BaselineProfileTabProps> = ({
  profile,
  onUpdateProfile,
  onNavigateToLog,
}) => {
  // New Condition State
  const [newCondition, setNewCondition] = useState('');

  // Medication Form State
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState(COMMON_FREQUENCIES[0]);
  const [medNotes, setMedNotes] = useState('');
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  // Allergy State
  const [newAllergy, setNewAllergy] = useState('');

  // Surgery/Investigation Form State
  const [surgTitle, setSurgTitle] = useState('');
  const [surgDate, setSurgDate] = useState('');
  const [surgOutcome, setSurgOutcome] = useState('');
  const [editingSurgId, setEditingSurgId] = useState<string | null>(null);

  // Local Pseudonym
  const [pseudonym, setPseudonym] = useState(profile.patientPseudonym || '');

  // Handlers for Conditions
  const handleAddCondition = (condName: string) => {
    const trimmed = condName.trim();
    if (!trimmed) return;
    if (profile.conditions.includes(trimmed)) return;
    const updated = {
      ...profile,
      conditions: [...profile.conditions, trimmed],
      lastUpdated: new Date().toISOString(),
    };
    onUpdateProfile(updated);
    setNewCondition('');
  };

  const handleRemoveCondition = (indexToRemove: number) => {
    const updated = {
      ...profile,
      conditions: profile.conditions.filter((_, idx) => idx !== indexToRemove),
      lastUpdated: new Date().toISOString(),
    };
    onUpdateProfile(updated);
  };

  // Handlers for Medications
  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    let updatedMeds: Medication[];
    if (editingMedId) {
      updatedMeds = profile.medications.map((m) =>
        m.id === editingMedId
          ? {
              ...m,
              name: medName.trim(),
              dose: medDose.trim() || 'Dose unspec.',
              frequency: medFreq.trim(),
              notes: medNotes.trim(),
            }
          : m
      );
      setEditingMedId(null);
    } else {
      const newMed: Medication = {
        id: `med-${Date.now()}`,
        name: medName.trim(),
        dose: medDose.trim() || 'Dose unspec.',
        frequency: medFreq.trim(),
        notes: medNotes.trim(),
        startDate: new Date().toISOString().split('T')[0],
      };
      updatedMeds = [...profile.medications, newMed];
    }

    onUpdateProfile({
      ...profile,
      medications: updatedMeds,
      lastUpdated: new Date().toISOString(),
    });

    setMedName('');
    setMedDose('');
    setMedFreq(COMMON_FREQUENCIES[0]);
    setMedNotes('');
  };

  const handleEditMedication = (med: Medication) => {
    setEditingMedId(med.id);
    setMedName(med.name);
    setMedDose(med.dose);
    setMedFreq(med.frequency);
    setMedNotes(med.notes || '');
  };

  const handleRemoveMedication = (id: string) => {
    onUpdateProfile({
      ...profile,
      medications: profile.medications.filter((m) => m.id !== id),
      lastUpdated: new Date().toISOString(),
    });
    if (editingMedId === id) {
      setEditingMedId(null);
      setMedName('');
      setMedDose('');
      setMedNotes('');
    }
  };

  // Handlers for Allergies
  const handleAddAllergy = (allergyText: string) => {
    const trimmed = allergyText.trim();
    if (!trimmed) return;
    if (profile.allergies.includes(trimmed)) return;
    onUpdateProfile({
      ...profile,
      allergies: [...profile.allergies, trimmed],
      lastUpdated: new Date().toISOString(),
    });
    setNewAllergy('');
  };

  const handleRemoveAllergy = (indexToRemove: number) => {
    onUpdateProfile({
      ...profile,
      allergies: profile.allergies.filter((_, idx) => idx !== indexToRemove),
      lastUpdated: new Date().toISOString(),
    });
  };

  // Handlers for Surgeries & Major Investigations
  const handleSaveSurgery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surgTitle.trim()) return;

    let updatedList: SurgeryInvestigation[];
    if (editingSurgId) {
      updatedList = profile.surgeriesAndInvestigations.map((s) =>
        s.id === editingSurgId
          ? {
              ...s,
              title: surgTitle.trim(),
              dateOrYear: surgDate.trim(),
              outcome: surgOutcome.trim(),
            }
          : s
      );
      setEditingSurgId(null);
    } else {
      const newEntry: SurgeryInvestigation = {
        id: `surg-${Date.now()}`,
        title: surgTitle.trim(),
        dateOrYear: surgDate.trim(),
        outcome: surgOutcome.trim(),
      };
      updatedList = [...profile.surgeriesAndInvestigations, newEntry];
    }

    onUpdateProfile({
      ...profile,
      surgeriesAndInvestigations: updatedList,
      lastUpdated: new Date().toISOString(),
    });

    setSurgTitle('');
    setSurgDate('');
    setSurgOutcome('');
  };

  const handleEditSurgery = (entry: SurgeryInvestigation) => {
    setEditingSurgId(entry.id);
    setSurgTitle(entry.title);
    setSurgDate(entry.dateOrYear || '');
    setSurgOutcome(entry.outcome || '');
  };

  const handleRemoveSurgery = (id: string) => {
    onUpdateProfile({
      ...profile,
      surgeriesAndInvestigations: profile.surgeriesAndInvestigations.filter((s) => s.id !== id),
      lastUpdated: new Date().toISOString(),
    });
    if (editingSurgId === id) {
      setEditingSurgId(null);
      setSurgTitle('');
      setSurgDate('');
      setSurgOutcome('');
    }
  };

  const handleSavePseudonym = () => {
    onUpdateProfile({
      ...profile,
      patientPseudonym: pseudonym.trim(),
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div id="baseline-profile-container" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Baseline Medical Profile</h2>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Saved Locally
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Your ongoing diagnostic history, permanent drug regimen, known allergies, and prior procedures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-400 block">Last synchronized</span>
              <span className="text-xs text-slate-700 font-mono font-medium">
                {new Date(profile.lastUpdated).toLocaleDateString()}
              </span>
            </div>
            <button
              id="btn-nav-to-log"
              type="button"
              onClick={onNavigateToLog}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Next: Treatment Log</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>

        {/* Local Pseudonym Field */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="input-pseudonym" className="text-xs font-medium text-slate-500 flex items-center gap-1.5 shrink-0">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Local Patient Reference (Redacted before AI):</span>
          </label>
          <div className="flex items-center gap-2 max-w-md w-full">
            <input
              id="input-pseudonym"
              type="text"
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              onBlur={handleSavePseudonym}
              placeholder="e.g. Self, Patient G.O., or Alias"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            {pseudonym !== (profile.patientPseudonym || '') && (
              <button
                id="btn-save-pseudonym"
                type="button"
                onClick={handleSavePseudonym}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Diagnoses & Long-Term Conditions */}
      <section id="section-diagnoses" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Diagnoses / Long-Term Conditions</h3>
              <p className="text-xs text-slate-400">Formal chronic medical conditions and active baseline diagnoses</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {profile.conditions.length} active
          </span>
        </div>

        {/* Input & Quick Add */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              id="input-new-condition"
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCondition(newCondition);
                }
              }}
              placeholder="Type condition (e.g. Essential Hypertension, Type 2 Diabetes)..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <button
              id="btn-add-condition"
              type="button"
              onClick={() => handleAddCondition(newCondition)}
              disabled={!newCondition.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          {/* Suggested Conditions Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Quick suggestions:</span>
            {COMMON_CONDITIONS.filter((c) => !profile.conditions.includes(c))
              .slice(0, 6)
              .map((cond) => (
                <button
                  key={cond}
                  id={`btn-suggest-${cond.replace(/\s+/g, '-').toLowerCase()}`}
                  type="button"
                  onClick={() => handleAddCondition(cond)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium transition-colors"
                >
                  + {cond}
                </button>
              ))}
          </div>

          {/* Active Conditions Tag List */}
          <div className="pt-2">
            {profile.conditions.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No chronic diagnoses recorded yet. Add your conditions above.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.conditions.map((cond, index) => (
                  <div
                    key={index}
                    id={`tag-condition-${index}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold group hover:border-blue-400 transition-colors shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>{cond}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(index)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                      title="Remove condition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Current Medications */}
      <section id="section-medications" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Current Medications</h3>
              <p className="text-xs text-slate-400">Ongoing prescribed and regular over-the-counter regimen</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {profile.medications.length} prescriptions
          </span>
        </div>

        {/* Medication Input / Edit Form */}
        <form onSubmit={handleSaveMedication} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-blue-700">
            <span>{editingMedId ? 'Edit Medication Entry' : 'Add Medication / Regimen Item'}</span>
            {editingMedId && (
              <button
                type="button"
                onClick={() => {
                  setEditingMedId(null);
                  setMedName('');
                  setMedDose('');
                  setMedNotes('');
                }}
                className="text-slate-500 hover:text-slate-800 underline text-[11px]"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="input-med-name" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Medication Name *
              </label>
              <input
                id="input-med-name"
                type="text"
                required
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g. Candesartan Cilexetil"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="input-med-dose" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Dose (mg, ml, puff) *
              </label>
              <input
                id="input-med-dose"
                type="text"
                required
                value={medDose}
                onChange={(e) => setMedDose(e.target.value)}
                placeholder="e.g. 16 mg"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="select-med-freq" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Frequency *
              </label>
              <input
                id="select-med-freq"
                type="text"
                value={medFreq}
                onChange={(e) => setMedFreq(e.target.value)}
                placeholder="e.g. Once daily (morning)"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="input-med-notes" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Indication / Specific Instructions / Notes (Optional)
            </label>
            <div className="flex gap-2">
              <input
                id="input-med-notes"
                type="text"
                value={medNotes}
                onChange={(e) => setMedNotes(e.target.value)}
                placeholder="e.g. Titrated from 8mg 3 weeks ago; take with food"
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                id="btn-save-med"
                type="submit"
                disabled={!medName.trim()}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center gap-1 shrink-0 shadow-xs"
              >
                {editingMedId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingMedId ? 'Update' : 'Add Medication'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Medications List / Table */}
        <div className="space-y-2">
          {profile.medications.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No medications recorded. Add your current regimen above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {profile.medications.map((med) => (
                <div
                  key={med.id}
                  id={`card-med-${med.id}`}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex flex-col justify-between gap-2 text-xs transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-800 text-sm">{med.name}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-slate-600">
                        <span className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-blue-700 font-bold">
                          {med.dose}
                        </span>
                        <span className="text-slate-300">&bull;</span>
                        <span>{med.frequency}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditMedication(med)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
                        title="Edit medication"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(med.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                        title="Remove medication"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {med.notes && (
                    <p className="text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
                      <span className="text-slate-400 font-medium">Notes:</span> {med.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Known Allergies */}
      <section id="section-allergies" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Known Allergies</h3>
              <p className="text-xs text-slate-400">Drug allergies, adverse intolerances, or environmental triggers</p>
            </div>
          </div>
          <button
            id="btn-nkda"
            type="button"
            onClick={() => handleAddAllergy('No Known Drug Allergies (NKDA)')}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold transition-colors"
          >
            + Set NKDA
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              id="input-new-allergy"
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAllergy(newAllergy);
                }
              }}
              placeholder="e.g. Penicillin (Anaphylaxis), NSAIDs (Severe gastric distress)..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
            <button
              id="btn-add-allergy"
              type="button"
              onClick={() => handleAddAllergy(newAllergy)}
              disabled={!newAllergy.trim()}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Allergy</span>
            </button>
          </div>

          <div className="pt-1">
            {profile.allergies.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400 text-center">
                No allergies documented. Click "+ Set NKDA" or enter known allergies.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((allergy, idx) => {
                  const isNKDA = allergy.toLowerCase().includes('nkda') || allergy.toLowerCase().includes('no known');
                  return (
                    <div
                      key={idx}
                      id={`tag-allergy-${idx}`}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                        isNKDA
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{allergy}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(idx)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                        title="Remove allergy"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Past Surgeries & Major Investigations */}
      <section id="section-surgeries" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Past Surgeries & Major Investigations</h3>
              <p className="text-xs text-slate-400">Prior operations, key scans (MRI, CT, Echo), biopsies, and diagnostic results</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {profile.surgeriesAndInvestigations.length} records
          </span>
        </div>

        {/* Surgery Form */}
        <form onSubmit={handleSaveSurgery} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-blue-700">
            <span>{editingSurgId ? 'Edit Procedure/Investigation' : 'Add Procedure or Diagnostic Investigation'}</span>
            {editingSurgId && (
              <button
                type="button"
                onClick={() => {
                  setEditingSurgId(null);
                  setSurgTitle('');
                  setSurgDate('');
                  setSurgOutcome('');
                }}
                className="text-slate-500 hover:text-slate-800 underline text-[11px]"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="input-surg-title" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Procedure / Investigation Title *
              </label>
              <input
                id="input-surg-title"
                type="text"
                required
                value={surgTitle}
                onChange={(e) => setSurgTitle(e.target.value)}
                placeholder="e.g. 24-Hour Ambulatory Blood Pressure Monitor, Colonoscopy, Appendectomy"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="input-surg-date" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Date / Year
              </label>
              <input
                id="input-surg-date"
                type="text"
                value={surgDate}
                onChange={(e) => setSurgDate(e.target.value)}
                placeholder="e.g. Nov 2024, 2019"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="input-surg-outcome" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Findings, Key Metric, or Surgical Outcome (Optional)
            </label>
            <div className="flex gap-2">
              <input
                id="input-surg-outcome"
                type="text"
                value={surgOutcome}
                onChange={(e) => setSurgOutcome(e.target.value)}
                placeholder="e.g. Mean daytime 142/88 mmHg; preserved nocturnal dipping"
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                id="btn-save-surg"
                type="submit"
                disabled={!surgTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center gap-1 shrink-0 shadow-xs"
              >
                {editingSurgId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingSurgId ? 'Update' : 'Add'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Procedures List */}
        <div className="space-y-2">
          {profile.surgeriesAndInvestigations.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No investigations or surgeries recorded.
            </div>
          ) : (
            <div className="space-y-2">
              {profile.surgeriesAndInvestigations.map((item) => (
                <div
                  key={item.id}
                  id={`card-surg-${item.id}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{item.title}</span>
                      {item.dateOrYear && (
                        <span className="text-[11px] font-mono bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {item.dateOrYear}
                        </span>
                      )}
                    </div>
                    {item.outcome && (
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        <span className="font-medium text-slate-400">Outcome / Findings:</span> {item.outcome}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditSurgery(item)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
                      title="Edit entry"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSurgery(item.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                      title="Remove entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
