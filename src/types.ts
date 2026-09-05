export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  notes?: string;
  startDate?: string;
}

export interface SurgeryInvestigation {
  id: string;
  title: string;
  dateOrYear?: string;
  outcome?: string;
}

export interface BaselineProfile {
  patientPseudonym?: string; // Optional local nickname (redacted before AI)
  conditions: string[];
  medications: Medication[];
  allergies: string[];
  surgeriesAndInvestigations: SurgeryInvestigation[];
  lastUpdated: string;
}

export interface VitalMetrics {
  bloodPressure?: string; // e.g. "128/82"
  heartRate?: string; // e.g. "72"
  weight?: string; // e.g. "74.5 kg"
  spO2?: string; // e.g. "98"
  temperature?: string; // e.g. "36.8 C"
}

export interface TreatmentLogEntry {
  id: string;
  date: string;
  severity: number; // 1 - 10
  symptomsDescription: string;
  medicationChanges?: string;
  vitals?: VitalMetrics;
  notes?: string;
  createdAt: string;
}

export interface ConsultationQuestion {
  number: number;
  question: string;
  rationale?: string;
}

export interface ConsultationBrief {
  id: string;
  dateGenerated: string;
  specialistType: string;
  chiefTrajectory: string;
  trajectoryStatus: 'Improving' | 'Stable' | 'Fluctuating' | 'Worsening' | 'Under Observation';
  regimenChanges: string[];
  symptomAndMetricPatterns: string[];
  vitalsSummary: {
    bloodPressureRange?: string;
    heartRateRange?: string;
    weightTrend?: string;
    severityAverage?: string;
  };
  top3Priorities: ConsultationQuestion[];
  baselineSnapshot?: {
    activeConditions: string[];
    currentMedications: string[];
    allergies: string[];
    surgeriesOrInvestigations: string[];
  };
  safetyDisclaimer: string;
  redactedTokensCount: number;
  sourceEngine?: string;
  safetyAlerts?: string[];
}

export interface RedactionResult<T> {
  sanitizedData: T;
  redactedCount: number;
  redactionLog: Array<{ field: string; originalMatch: string; replacedWith: string }>;
}
