import { BaselineProfile, TreatmentLogEntry, ConsultationBrief } from '../types';
import { SAMPLE_BASELINE, SAMPLE_TREATMENT_LOGS, SAMPLE_BRIEF } from './sampleData';

const BASELINE_KEY = 'consultantbrief_baseline_v1';
const LOGS_KEY = 'consultantbrief_logs_v1';
const BRIEFS_KEY = 'consultantbrief_saved_briefs_v1';

export function loadBaselineProfile(): BaselineProfile {
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    if (!raw) {
      saveBaselineProfile(SAMPLE_BASELINE);
      return SAMPLE_BASELINE;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.conditions) || !Array.isArray(parsed.medications)) {
      return SAMPLE_BASELINE;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading baseline profile from localStorage:', err);
    return SAMPLE_BASELINE;
  }
}

export function saveBaselineProfile(profile: BaselineProfile): void {
  try {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving baseline profile to localStorage:', err);
  }
}

export function loadTreatmentLogs(): TreatmentLogEntry[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) {
      saveTreatmentLogs(SAMPLE_TREATMENT_LOGS);
      return SAMPLE_TREATMENT_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return SAMPLE_TREATMENT_LOGS;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading treatment logs from localStorage:', err);
    return SAMPLE_TREATMENT_LOGS;
  }
}

export function saveTreatmentLogs(logs: TreatmentLogEntry[]): void {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving treatment logs to localStorage:', err);
  }
}

export function loadSavedBriefs(): ConsultationBrief[] {
  try {
    const raw = localStorage.getItem(BRIEFS_KEY);
    if (!raw) {
      saveBrief(SAMPLE_BRIEF);
      return [SAMPLE_BRIEF];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    saveBrief(SAMPLE_BRIEF);
    return [SAMPLE_BRIEF];
  } catch (err) {
    console.error('Error reading saved briefs from localStorage:', err);
    return [SAMPLE_BRIEF];
  }
}

export function saveBrief(brief: ConsultationBrief): void {
  try {
    const raw = localStorage.getItem(BRIEFS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [brief, ...(Array.isArray(existing) ? existing.filter((b: ConsultationBrief) => b.id !== brief.id) : [])].slice(0, 10);
    localStorage.setItem(BRIEFS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving brief to localStorage:', err);
  }
}

export function deleteSavedBrief(id: string): void {
  try {
    const raw = localStorage.getItem(BRIEFS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = Array.isArray(existing) ? existing.filter((b: ConsultationBrief) => b.id !== id) : [];
    localStorage.setItem(BRIEFS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting brief from localStorage:', err);
  }
}

export function resetToSampleData(): { baseline: BaselineProfile; logs: TreatmentLogEntry[]; brief: ConsultationBrief } {
  saveBaselineProfile(SAMPLE_BASELINE);
  saveTreatmentLogs(SAMPLE_TREATMENT_LOGS);
  saveBrief(SAMPLE_BRIEF);
  return { baseline: SAMPLE_BASELINE, logs: SAMPLE_TREATMENT_LOGS, brief: SAMPLE_BRIEF };
}

export function clearAllHealthData(): { baseline: BaselineProfile; logs: TreatmentLogEntry[] } {
  const emptyBaseline: BaselineProfile = {
    patientPseudonym: '',
    conditions: [],
    medications: [],
    allergies: [],
    surgeriesAndInvestigations: [],
    lastUpdated: new Date().toISOString(),
  };
  saveBaselineProfile(emptyBaseline);
  saveTreatmentLogs([]);
  return { baseline: emptyBaseline, logs: [] };
}
