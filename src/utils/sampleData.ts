import { BaselineProfile, TreatmentLogEntry, ConsultationBrief } from '../types';

export const SAMPLE_BASELINE: BaselineProfile = {
  patientPseudonym: 'Local Profile (De-Identified)',
  conditions: [
    'Essential Hypertension (Diagnosed 2019)',
    'Mild Cervical Spine Osteoarthritis',
    'Seasonal Allergic Rhinitis',
  ],
  medications: [
    {
      id: 'med-1',
      name: 'Candesartan Cilexetil',
      dose: '16 mg',
      frequency: 'Once daily (morning)',
      notes: 'Titrated up from 8mg 3 weeks ago',
      startDate: '2024-02-10',
    },
    {
      id: 'med-2',
      name: 'Amlodipine Besylate',
      dose: '5 mg',
      frequency: 'Once daily (evening)',
      notes: 'Stable baseline control',
      startDate: '2021-06-15',
    },
    {
      id: 'med-3',
      name: 'Paracetamol',
      dose: '1,000 mg',
      frequency: 'PRN (As needed, max 4g/day)',
      notes: 'For cervical neck flare-ups',
      startDate: '2023-01-01',
    },
  ],
  allergies: ['Penicillin (Maculopapular rash, 2014)', 'NSAIDs / Ibuprofen (Gastric intolerance)'],
  surgeriesAndInvestigations: [
    {
      id: 'surg-1',
      title: '24-Hour Ambulatory Blood Pressure Monitoring',
      dateOrYear: 'Nov 2024',
      outcome: 'Mean daytime 142/88 mmHg, preserved nocturnal dipping',
    },
    {
      id: 'surg-2',
      title: 'Cervical Spine X-Ray',
      dateOrYear: 'Mar 2023',
      outcome: 'Moderate C5-C6 disc space narrowing without acute instability',
    },
    {
      id: 'surg-3',
      title: 'Routine Renal & Electrolytes Panel',
      dateOrYear: 'Jan 2025',
      outcome: 'eGFR > 85 mL/min, serum potassium 4.2 mmol/L (Normal)',
    },
  ],
  lastUpdated: new Date().toISOString(),
};

// Dynamic date helper so sample logs always reflect an active 30-day window
const getRecentSampleDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const SAMPLE_TREATMENT_LOGS: TreatmentLogEntry[] = [
  {
    id: 'log-1',
    date: getRecentSampleDate(18),
    severity: 3,
    symptomsDescription: 'Baseline mild tension headache in occipital region upon waking; resolved by midday.',
    medicationChanges: 'Candesartan titrated to 16mg day 1 as instructed by GP.',
    vitals: {
      bloodPressure: '144/90',
      heartRate: '72',
      weight: '76.8 kg',
      spO2: '98',
    },
    notes: 'No postural lightheadedness noted today.',
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-2',
    date: getRecentSampleDate(14),
    severity: 5,
    symptomsDescription: 'Brief transient dizziness on standing up quickly after desk work; lasted ~30 seconds.',
    medicationChanges: 'Full 16mg Candesartan taken with breakfast.',
    vitals: {
      bloodPressure: '128/82',
      heartRate: '68',
      weight: '76.5 kg',
      spO2: '99',
    },
    notes: 'Standing BP 2 minutes later was 118/76. Hydrated with extra water.',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-3',
    date: getRecentSampleDate(10),
    severity: 2,
    symptomsDescription: 'Energy levels good. Minor stiff neck after driving.',
    medicationChanges: 'All medications taken on schedule.',
    vitals: {
      bloodPressure: '124/78',
      heartRate: '66',
      weight: '76.4 kg',
      spO2: '98',
    },
    notes: 'Walking 6,000 steps daily without chest tightness or shortness of breath.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-4',
    date: getRecentSampleDate(6),
    severity: 6,
    symptomsDescription: 'Throbbing frontal headache after stressful work meeting; facial flush.',
    medicationChanges: 'Took 1,000mg Paracetamol at 15:00. Evening Amlodipine delayed by 2 hours.',
    vitals: {
      bloodPressure: '148/92',
      heartRate: '84',
      weight: '76.6 kg',
      spO2: '97',
    },
    notes: 'Re-checked BP 2 hours after resting: 136/84. Headache subsided to 2/10.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-5',
    date: getRecentSampleDate(2),
    severity: 3,
    symptomsDescription: 'Stable day. Mild morning postural hesitation but no true vertigo.',
    medicationChanges: 'Regimen steady. Refill requested from pharmacy.',
    vitals: {
      bloodPressure: '126/80',
      heartRate: '70',
      weight: '76.2 kg',
      spO2: '98',
    },
    notes: 'Overall daytime readings appearing lower on 16mg Candesartan.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const SAMPLE_BRIEF: ConsultationBrief = {
  id: 'brief-sample-demo',
  dateGenerated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  specialistType: 'Cardiology & Vascular Medicine',
  chiefTrajectory:
    'Patient demonstrates overall improving blood pressure control following Candesartan titration from 8mg to 16mg. Occasional transient postural dizziness noted without syncope, alongside a reactive spike during acute work stress.',
  trajectoryStatus: 'Improving',
  regimenChanges: [
    'Candesartan Cilexetil titrated from 8mg to 16mg once daily (morning) 3 weeks ago.',
    'Amlodipine Besylate 5mg daily maintained in evening without peripheral edema.',
    'Paracetamol 1,000mg taken PRN for acute frontal/cervical headache with good response.',
  ],
  symptomAndMetricPatterns: [
    'Blood pressure improved from baseline 144/90 mmHg down to 124/78–128/82 mmHg resting.',
    'Transient orthostatic dizziness observed on day 4 post-titration (standing BP 118/76 mmHg), resolved with hydration.',
    'Stress-induced transient spike noted at 148/92 mmHg with frontal headache, subsiding after 2 hours rest.',
  ],
  vitalsSummary: {
    bloodPressureRange: '118/76 - 148/92 mmHg (Mean ~128/82)',
    heartRateRange: '66 - 84 bpm (Resting avg 72)',
    weightTrend: '76.2 - 76.8 kg (Stable)',
    severityAverage: '3.8 / 10',
  },
  top3Priorities: [
    {
      number: 1,
      question: 'Given the standing BP drop to 118/76 mmHg, should we maintain 16mg Candesartan or adjust dosing timing?',
      rationale: 'Addresses whether transient postural dizziness represents mild orthostatic effect after dose escalation.',
    },
    {
      number: 2,
      question: 'Are there any contraindications to continuing PRN Paracetamol alongside this dual antihypertensive regimen?',
      rationale: 'Confirms safe analgesia management given prior NSAID gastric intolerance.',
    },
    {
      number: 3,
      question: 'What is the recommended interval for follow-up ambulatory BP monitoring or renal panel checks?',
      rationale: 'Ensures proactive monitoring of eGFR and serum electrolytes after ACEi/ARB titration.',
    },
  ],
  baselineSnapshot: {
    activeConditions: [
      'Essential Hypertension (Diagnosed 2019)',
      'Mild Cervical Spine Osteoarthritis',
      'Seasonal Allergic Rhinitis',
    ],
    currentMedications: [
      'Candesartan Cilexetil (16 mg, Once daily (morning))',
      'Amlodipine Besylate (5 mg, Once daily (evening))',
      'Paracetamol (1,000 mg, PRN (As needed, max 4g/day))',
    ],
    allergies: ['Penicillin (Maculopapular rash, 2014)', 'NSAIDs / Ibuprofen (Gastric intolerance)'],
    surgeriesOrInvestigations: [
      '24-Hour Ambulatory Blood Pressure Monitoring (Nov 2024)',
      'Cervical Spine X-Ray (Mar 2023)',
      'Routine Renal & Electrolytes Panel (Jan 2025)',
    ],
  },
  safetyAlerts: [
    'NSAID Contraindication: Documented intolerance/gastric reaction. Avoid systemic NSAIDs & COX-2 inhibitors.',
    'Dual Vasodilator Therapy: Candesartan 16mg AM + Amlodipine 5mg PM. Monitor for postural dips & renal function.',
    'Pre-Procedure Window: Withhold morning Candesartan on day of major procedure/general anesthesia to prevent hypotension.',
  ],
  safetyDisclaimer:
    'CONFIDENTIAL PRE-CONSULTATION SUMMARY: Patient-reported factual summary. Does not replace clinical evaluation.',
  redactedTokensCount: 0,
  sourceEngine: 'gemini-3.8-flash',
};
