import { TreatmentLogEntry } from '../types';

export interface SymptomSpikeAnalysis {
  hasSpike: boolean; // True if 7-day avg severity exceeds 30-day avg by > 2.0 points
  diff: number; // avg7d - avg30d
  diffFormatted: string; // e.g. "+2.4 pts"
  avg7d: number;
  roundedAvg7d: string;
  avg30d: number;
  roundedAvg30d: string;
  count7d: number;
  count30d: number;
  window7dLabel: string;
  window30dLabel: string;
  peak7dSeverity: number;
  recent7dSymptoms: string[];
  recommendation: string;
  isHistoricalFallback: boolean;
  hasSufficientData: boolean;
}

/**
 * Analyzes the last 7 days of treatment logs against the trailing 30-day baseline.
 * Flags if symptom severity has increased by more than 2.0 points compared to the 30-day average.
 *
 * @param logs Array of TreatmentLogEntry objects
 * @param referenceDate Optional reference Date (defaults to now)
 * @returns SymptomSpikeAnalysis object with flag, metrics, and clinical context
 */
export function analyzeSymptomSeveritySpike(
  logs: TreatmentLogEntry[],
  referenceDate?: Date
): SymptomSpikeAnalysis {
  if (!logs || logs.length === 0) {
    return {
      hasSpike: false,
      diff: 0,
      diffFormatted: '0.0 pts',
      avg7d: 0,
      roundedAvg7d: '0.0',
      avg30d: 0,
      roundedAvg30d: '0.0',
      count7d: 0,
      count30d: 0,
      window7dLabel: 'Last 7 Days',
      window30dLabel: 'Last 30 Days',
      peak7dSeverity: 0,
      recent7dSymptoms: [],
      recommendation: 'No log entries available for longitudinal evaluation.',
      isHistoricalFallback: false,
      hasSufficientData: false,
    };
  }

  const now = referenceDate ? new Date(referenceDate) : new Date();
  const nowMs = now.getTime();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  // Filter valid logs
  const validLogs = logs.filter(
    (l) => typeof l.severity === 'number' && !isNaN(new Date(l.date).getTime())
  );

  if (validLogs.length === 0) {
    return {
      hasSpike: false,
      diff: 0,
      diffFormatted: '0.0 pts',
      avg7d: 0,
      roundedAvg7d: '0.0',
      avg30d: 0,
      roundedAvg30d: '0.0',
      count7d: 0,
      count30d: 0,
      window7dLabel: 'Last 7 Days',
      window30dLabel: 'Last 30 Days',
      peak7dSeverity: 0,
      recent7dSymptoms: [],
      recommendation: 'No valid severity entries found.',
      isHistoricalFallback: false,
      hasSufficientData: false,
    };
  }

  let logs30d = validLogs.filter((l) => {
    const t = new Date(l.date).getTime();
    return t >= nowMs - THIRTY_DAYS_MS && t <= nowMs;
  });

  let logs7d = validLogs.filter((l) => {
    const t = new Date(l.date).getTime();
    return t >= nowMs - SEVEN_DAYS_MS && t <= nowMs;
  });

  let isHistoricalFallback = false;
  let window7dLabel = 'Last 7 Days';
  let window30dLabel = 'Last 30 Days';

  // Fallback: If no logs fall in the real-time calendar window of now,
  // anchor the analysis window to the latest recorded log date so historical
  // or demo datasets remain fully functional and responsive.
  if (logs30d.length === 0 && validLogs.length > 0) {
    const sortedDesc = [...validLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestAnchorMs = new Date(sortedDesc[0].date).getTime();
    const anchor30Start = latestAnchorMs - THIRTY_DAYS_MS;
    const anchor7Start = latestAnchorMs - SEVEN_DAYS_MS;

    logs30d = sortedDesc.filter((l) => {
      const t = new Date(l.date).getTime();
      return t >= anchor30Start && t <= latestAnchorMs;
    });

    logs7d = sortedDesc.filter((l) => {
      const t = new Date(l.date).getTime();
      return t >= anchor7Start && t <= latestAnchorMs;
    });

    isHistoricalFallback = true;
    const start7Str = new Date(anchor7Start).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const start30Str = new Date(anchor30Start).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const latestStr = new Date(latestAnchorMs).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    window7dLabel = `7d Window (${start7Str} – ${latestStr})`;
    window30dLabel = `30d Window (${start30Str} – ${latestStr})`;
  }

  const count7d = logs7d.length;
  const count30d = logs30d.length;

  if (count30d === 0) {
    return {
      hasSpike: false,
      diff: 0,
      diffFormatted: '0.0 pts',
      avg7d: 0,
      roundedAvg7d: '0.0',
      avg30d: 0,
      roundedAvg30d: '0.0',
      count7d: 0,
      count30d: 0,
      window7dLabel,
      window30dLabel,
      peak7dSeverity: 0,
      recent7dSymptoms: [],
      recommendation: 'Insufficient 30-day baseline logs to compute trajectory.',
      isHistoricalFallback,
      hasSufficientData: false,
    };
  }

  const sum30d = logs30d.reduce((sum, l) => sum + l.severity, 0);
  const avg30d = sum30d / count30d;
  const roundedAvg30d = avg30d.toFixed(1);

  // If there are no logs in the 7-day window, we cannot claim a spike
  if (count7d === 0) {
    return {
      hasSpike: false,
      diff: 0,
      diffFormatted: '0.0 pts',
      avg7d: 0,
      roundedAvg7d: 'N/A',
      avg30d,
      roundedAvg30d,
      count7d: 0,
      count30d,
      window7dLabel,
      window30dLabel,
      peak7dSeverity: 0,
      recent7dSymptoms: [],
      recommendation: `30-day baseline average is ${roundedAvg30d}/10 across ${count30d} entries. No symptom entries logged in the trailing 7 days.`,
      isHistoricalFallback,
      hasSufficientData: false,
    };
  }

  const sum7d = logs7d.reduce((sum, l) => sum + l.severity, 0);
  const avg7d = sum7d / count7d;
  const roundedAvg7d = avg7d.toFixed(1);

  // Difference: 7-day average minus 30-day average
  const diff = avg7d - avg30d;
  const diffFormatted = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} pts`;

  // Flag condition: severity has increased by more than 2 points compared to the 30-day average
  const hasSpike = diff > 2.0;

  const peak7dSeverity = Math.max(...logs7d.map((l) => l.severity));
  const recent7dSymptoms = logs7d
    .map((l) => l.symptomsDescription)
    .filter(Boolean)
    .slice(0, 3);

  let recommendation = '';
  if (hasSpike) {
    recommendation = `Alert: Acute symptom exacerbation detected. 7-day mean severity (${roundedAvg7d}/10) is ${diffFormatted} higher than the 30-day baseline (${roundedAvg30d}/10), exceeding the 2.0-point safety threshold. Prioritize discussing this escalation, potential triggers, and dosage adjustments with your clinician.`;
  } else if (diff >= 1.0) {
    recommendation = `Mild interval elevation (+${diff.toFixed(1)} pts) over the 7-day window (${roundedAvg7d}/10 vs ${roundedAvg30d}/10 baseline). Continue regular observation.`;
  } else if (diff <= -1.0) {
    recommendation = `Positive symptom alleviation: 7-day average (${roundedAvg7d}/10) is ${Math.abs(diff).toFixed(1)} pts lower than the 30-day baseline (${roundedAvg30d}/10).`;
  } else {
    recommendation = `Symptom stability maintained: 7-day average (${roundedAvg7d}/10) remains closely aligned with the 30-day baseline (${roundedAvg30d}/10, delta: ${diffFormatted}).`;
  }

  return {
    hasSpike,
    diff,
    diffFormatted,
    avg7d,
    roundedAvg7d,
    avg30d,
    roundedAvg30d,
    count7d,
    count30d,
    window7dLabel,
    window30dLabel,
    peak7dSeverity,
    recent7dSymptoms,
    recommendation,
    isHistoricalFallback,
    hasSufficientData: true,
  };
}

/**
 * Quick boolean check: returns true if symptom severity in the last 7 days
 * has increased by more than 2.0 points compared to the 30-day average.
 */
export function isSymptomSeveritySpiked(logs: TreatmentLogEntry[]): boolean {
  return analyzeSymptomSeveritySpike(logs).hasSpike;
}
