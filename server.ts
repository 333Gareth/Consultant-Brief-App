import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

interface ClinicalBriefRequest {
  specialistType?: string;
  baseline: {
    conditions: string[];
    medications: Array<{ name: string; dose: string; frequency: string; notes?: string }>;
    allergies: string[];
    surgeriesAndInvestigations: string[];
  };
  recentLogs: Array<{
    id: string;
    date: string;
    severity: number;
    symptomsDescription?: string;
    medicationChanges?: string;
    vitals?: {
      bloodPressure?: string;
      heartRate?: string;
      weight?: string;
      spO2?: string;
      temperature?: string;
    };
    notes?: string;
  }>;
  redactedSummaryNote?: string;
}

app.post('/api/compile-brief', async (req, res) => {
  try {
    const payload: ClinicalBriefRequest = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!payload || !payload.baseline || !Array.isArray(payload.recentLogs)) {
      return res.status(400).json({ error: 'Invalid payload. Baseline and recent logs are required.' });
    }

    const { specialistType, baseline, recentLogs } = payload;

    // Strict Clinical Guardrail System Prompt
    const systemInstruction = `You are a clinical documentation assistant designed to compile a structured, 1-page "Pre-Consultation Clinical Brief" for a specialist appointment.
Strict Safety Guardrails:
1. Strictly summarize factual, chronological inputs from the provided baseline history and recent logs.
2. DO NOT infer unconfirmed diagnoses.
3. DO NOT recommend clinical interventions, prescribe changes, or give medical advice.
4. Use objective, concise clinical language suitable for both specialist review and patient clarity.
5. All personal identifiers have been scrubbed; maintain absolute privacy and confidentiality.
6. Formulate exactly 3 high-value, crisp questions the patient should bring to their consultation today based on identified gaps, trajectory shifts, or medication responses.`;

    const promptText = `Please compile a concise 1-page pre-consultation summary based on the following de-identified patient data:

Target Specialist: ${specialistType?.trim() || 'General Specialist / Consultant'}

BASELINE MEDICAL PROFILE:
- Diagnoses / Long-Term Conditions: ${baseline.conditions.length > 0 ? baseline.conditions.join('; ') : 'None documented'}
- Current Regimen / Medications: ${
      baseline.medications.length > 0
        ? baseline.medications.map((m) => `${m.name} (${m.dose || 'dose unspec.'}, ${m.frequency || 'freq unspec.'}${m.notes ? ` - ${m.notes}` : ''})`).join('; ')
        : 'None recorded'
    }
- Known Allergies: ${baseline.allergies.length > 0 ? baseline.allergies.join('; ') : 'No known drug allergies (NKDA)'}
- Past Surgeries & Major Investigations: ${
      baseline.surgeriesAndInvestigations.length > 0 ? baseline.surgeriesAndInvestigations.join('; ') : 'None documented'
    }

RECENT TREATMENT & SYMPTOM LOG ENTRIES (${recentLogs.length} entries provided):
${
  recentLogs.length === 0
    ? 'No recent entries logged.'
    : recentLogs
        .map(
          (log, i) =>
            `Entry #${i + 1} [Date: ${log.date}]:
  - Severity Rating: ${log.severity}/10
  - Symptoms/Complaints: ${log.symptomsDescription || 'Not specified'}
  - Regimen/Medication Changes: ${log.medicationChanges || 'None recorded'}
  - Vitals: ${
    log.vitals
      ? [
          log.vitals.bloodPressure ? `BP: ${log.vitals.bloodPressure} mmHg` : null,
          log.vitals.heartRate ? `HR: ${log.vitals.heartRate} bpm` : null,
          log.vitals.weight ? `Weight: ${log.vitals.weight}` : null,
          log.vitals.spO2 ? `SpO2: ${log.vitals.spO2}%` : null,
          log.vitals.temperature ? `Temp: ${log.vitals.temperature}` : null,
        ]
          .filter(Boolean)
          .join(', ') || 'None measured'
      : 'None measured'
  }
  - Freeform Observations: ${log.notes || 'None'}`
        )
        .join('\n\n')
}

Compile the brief conforming strictly to the requested schema.`;

    if (!apiKey) {
      // Fallback deterministic synthesis when no Gemini API key is configured
      const fallbackBrief = generateFallbackBrief(payload);
      return res.json({
        success: true,
        source: 'local-clinical-engine',
        data: fallbackBrief,
        notice: 'Compiled via local clinical synthesis engine (No GEMINI_API_KEY detected).',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'E.g. Pre-Consultation Clinical Brief' },
        consultationTarget: { type: Type.STRING, description: 'Target specialty or consultation purpose' },
        dateGenerated: { type: Type.STRING, description: 'Date summary compiled' },
        chiefTrajectory: {
          type: Type.STRING,
          description: '1-2 sentence overview of recent health trajectory, symptom trends, and overall stability.',
        },
        trajectoryStatus: {
          type: Type.STRING,
          description: 'One of: Improving, Stable, Fluctuating, Worsening, Under Observation',
        },
        regimenChanges: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of specific medication/regimen changes since baseline and observed responses or tolerability.',
        },
        symptomAndMetricPatterns: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of observed patterns, symptom spikes, severity ranges, vital metric trends or anomalies.',
        },
        vitalsSummary: {
          type: Type.OBJECT,
          properties: {
            bloodPressureRange: { type: Type.STRING },
            heartRateRange: { type: Type.STRING },
            weightTrend: { type: Type.STRING },
            severityAverage: { type: Type.STRING },
          },
          description: 'Summary ranges of vital signs across the logged period',
        },
        top3Priorities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              number: { type: Type.INTEGER },
              question: { type: Type.STRING },
              rationale: { type: Type.STRING },
            },
            required: ['number', 'question'],
          },
          description: 'Top 3 concise, high-value questions for the patient to ask the specialist today.',
        },
        baselineSnapshot: {
          type: Type.OBJECT,
          properties: {
            activeConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            currentMedications: { type: Type.ARRAY, items: { type: Type.STRING } },
            allergies: { type: Type.ARRAY, items: { type: Type.STRING } },
            surgeriesOrInvestigations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
        safetyDisclaimer: {
          type: Type.STRING,
          description:
            'Factual summary disclaimer (e.g., patient-reported observational summary; does not replace medical records or clinical evaluation).',
        },
      },
      required: [
        'chiefTrajectory',
        'trajectoryStatus',
        'regimenChanges',
        'symptomAndMetricPatterns',
        'top3Priorities',
        'safetyDisclaimer',
      ],
    };

    // Resilient generation supporting retry and fallback model for 503 high demand
    const modelsToAttempt = ['gemini-3.8-flash', 'gemini-flash-latest'];
    let responseText: string | null = null;
    let successfulModel = 'gemini-3.8-flash';
    let lastError: any = null;

    for (const modelName of modelsToAttempt) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: promptText,
            config: {
              systemInstruction,
              temperature: 0.2, // low temperature for clinical factual precision
              responseMimeType: 'application/json',
              responseSchema,
            },
          });

          if (response?.text) {
            responseText = response.text.trim();
            successfulModel = modelName;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const isHighDemandOrRateLimit =
            err?.status === 503 ||
            err?.code === 503 ||
            err?.status === 429 ||
            err?.code === 429 ||
            err?.message?.includes('503') ||
            err?.message?.includes('high demand') ||
            err?.message?.includes('UNAVAILABLE');

          if (isHighDemandOrRateLimit && attempt < 2) {
            // Jittered backoff before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));
            continue;
          }
          break; // Try next model candidate
        }
      }

      if (responseText) {
        break;
      }
    }

    if (!responseText) {
      console.warn(
        '[ConsultantBrief API] Gemini model temporarily unavailable or in high demand (503). Activating clinical synthesis engine.'
      );
      const fallbackBrief = generateFallbackBrief(payload);
      return res.json({
        success: true,
        source: 'local-clinical-engine-fallback',
        data: fallbackBrief,
        notice: 'Gemini is currently experiencing high demand; local clinical brief compiled seamlessly.',
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = generateFallbackBrief(payload);
    }

    return res.json({
      success: true,
      source: successfulModel,
      data: parsedData,
    });
  } catch (error: any) {
    console.warn('[ConsultantBrief API] Falling back to local clinical engine:', error?.message || error);
    const fallbackBrief = generateFallbackBrief(req.body);
    return res.json({
      success: true,
      source: 'local-clinical-engine-fallback',
      data: fallbackBrief,
      warning: error?.message || 'Temporary service interruption; local clinical brief generated.',
    });
  }
});

// Deterministic fallback clinical summary generator
function generateFallbackBrief(payload: ClinicalBriefRequest) {
  const { specialistType, baseline, recentLogs } = payload;
  const severities = recentLogs.map((l) => l.severity).filter((s) => typeof s === 'number');
  const avgSeverity =
    severities.length > 0 ? (severities.reduce((a, b) => a + b, 0) / severities.length).toFixed(1) : 'N/A';
  const maxSeverity = severities.length > 0 ? Math.max(...severities) : 'N/A';
  const minSeverity = severities.length > 0 ? Math.min(...severities) : 'N/A';

  // Trajectory assessment
  let trajectoryStatus = 'Stable';
  if (severities.length >= 2) {
    const firstHalf = severities.slice(0, Math.ceil(severities.length / 2));
    const secondHalf = severities.slice(Math.ceil(severities.length / 2));
    const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (avg2 - avg1 >= 1.5) trajectoryStatus = 'Worsening';
    else if (avg1 - avg2 >= 1.5) trajectoryStatus = 'Improving';
    else trajectoryStatus = 'Fluctuating';
  }

  const logChanges = recentLogs
    .map((l) => l.medicationChanges?.trim())
    .filter((c): c is string => Boolean(c && c !== 'None' && c !== 'None recorded'));

  const symptomNotes = recentLogs
    .map((l) => l.symptomsDescription?.trim() || l.notes?.trim())
    .filter((n): n is string => Boolean(n));

  return {
    title: 'Pre-Consultation Clinical Brief',
    consultationTarget: specialistType?.trim() || 'Specialist Consultation',
    dateGenerated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    chiefTrajectory: `Patient presents with ${baseline.conditions.length > 0 ? baseline.conditions.join(', ') : 'ongoing symptoms'}. Over the past ${recentLogs.length} documented entries, symptom severity averaged ${avgSeverity}/10 (range: ${minSeverity} to ${maxSeverity}/10), demonstrating a ${trajectoryStatus.toLowerCase()} trajectory.`,
    trajectoryStatus,
    regimenChanges:
      logChanges.length > 0
        ? Array.from(new Set(logChanges))
        : ['No active dose titrations or medication discontinuations recorded in recent logs.'],
    symptomAndMetricPatterns: [
      `Symptom severity documented across ${recentLogs.length} discrete time points with mean severity of ${avgSeverity}/10.`,
      symptomNotes.length > 0
        ? `Reported complaints include: ${Array.from(new Set(symptomNotes)).slice(0, 3).join('; ')}.`
        : 'Symptom presentations were stable within expected baseline parameters.',
      baseline.allergies.length > 0
        ? `Allergy considerations flagged: ${baseline.allergies.join(', ')}.`
        : 'No known drug allergies reported.',
    ],
    vitalsSummary: {
      bloodPressureRange:
        recentLogs.map((l) => l.vitals?.bloodPressure).filter(Boolean).join(', ') || 'Not recorded',
      heartRateRange:
        recentLogs.map((l) => l.vitals?.heartRate).filter(Boolean).length > 0
          ? `${recentLogs.map((l) => l.vitals?.heartRate).filter(Boolean).join(', ')} bpm`
          : 'Not recorded',
      weightTrend:
        recentLogs.map((l) => l.vitals?.weight).filter(Boolean).join(' -> ') || 'Stable / Not recorded',
      severityAverage: `${avgSeverity}/10 (Peak: ${maxSeverity}/10)`,
    },
    top3Priorities: [
      {
        number: 1,
        question: `Given my current severity trend (averaging ${avgSeverity}/10), should we adjust the current dosage or timing of my baseline regimen?`,
        rationale: 'Clarifies whether current therapeutic coverage matches recent symptom trajectory.',
      },
      {
        number: 2,
        question:
          logChanges.length > 0
            ? 'How should we evaluate the tolerability and response to recent regimen adjustments observed over this period?'
            : 'Are there specific trigger signs or biomarker cut-offs where I should seek immediate interval follow-up?',
        rationale: 'Establishes clear clinical escalation thresholds.',
      },
      {
        number: 3,
        question:
          'What further investigations or differential diagnoses are recommended to investigate persistent symptoms?',
        rationale: 'Ensures structured diagnostic closure on unaddressed complaints.',
      },
    ],
    baselineSnapshot: {
      activeConditions: baseline.conditions,
      currentMedications: baseline.medications.map((m) => `${m.name} (${m.dose}, ${m.frequency})`),
      allergies: baseline.allergies,
      surgeriesOrInvestigations: baseline.surgeriesAndInvestigations,
    },
    safetyDisclaimer:
      'CONFIDENTIAL PRE-CONSULTATION SUMMARY: Generated from patient-reported observational records. Strictly factual synthesis; does not infer diagnoses, offer medical advice, or replace medical record verification.',
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ConsultantBrief Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
