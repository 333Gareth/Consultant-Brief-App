import React, { useMemo } from 'react';
import { TreatmentLogEntry } from '../types';
import { analyzeSymptomSeveritySpike } from '../utils/symptomAnalysis';
import {
  Calendar,
  Activity,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  ChevronRight,
  Info,
  Flame,
} from 'lucide-react';

interface SymptomSeverity30dCardProps {
  logs: TreatmentLogEntry[];
  onOpenNewLogModal?: () => void;
  onNavigateTab?: (tab: 'bento' | 'baseline' | 'log' | 'brief') => void;
}

export const SymptomSeverity30dCard: React.FC<SymptomSeverity30dCardProps> = ({
  logs,
  onOpenNewLogModal,
  onNavigateTab,
}) => {
  // Analyze 7-day spike vs 30-day baseline
  const spikeAnalysis = useMemo(() => {
    return analyzeSymptomSeveritySpike(logs);
  }, [logs]);

  // Compute 30-day metrics
  const analysis = useMemo(() => {
    if (!logs || logs.length === 0) {
      return null;
    }

    const now = new Date();
    const thirtyDaysAgoMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    // Filter logs strictly in the last 30 calendar days
    let windowLogs = logs.filter((log) => {
      const logTime = new Date(log.date).getTime();
      return !isNaN(logTime) && logTime >= thirtyDaysAgoMs;
    });

    let isHistoricalFallback = false;
    let windowLabel = 'Last 30 Days';

    // If no logs fall in the last 30 calendar days from today, but historical logs exist,
    // evaluate the 30-day window anchored to the most recent entry so the user receives immediate feedback
    if (windowLogs.length === 0 && logs.length > 0) {
      const sortedAll = [...logs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestTime = new Date(sortedAll[0].date).getTime();
      if (!isNaN(latestTime)) {
        const anchorStartMs = latestTime - 30 * 24 * 60 * 60 * 1000;
        windowLogs = sortedAll.filter((log) => {
          const t = new Date(log.date).getTime();
          return !isNaN(t) && t >= anchorStartMs && t <= latestTime;
        });
        isHistoricalFallback = true;
        const startDateStr = new Date(anchorStartMs).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const endDateStr = new Date(latestTime).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        windowLabel = `30d Window (${startDateStr} – ${endDateStr})`;
      }
    }

    if (windowLogs.length === 0) {
      return null;
    }

    // Sort chronologically ascending
    const sortedChronological = [...windowLogs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const severities = sortedChronological.map((l) =>
      typeof l.severity === 'number' ? l.severity : 0
    );
    const count = severities.length;
    const sum = severities.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const roundedAvg = avg.toFixed(1);
    const min = Math.min(...severities);
    const max = Math.max(...severities);

    // Trend calculation: first log in window vs latest log in window
    const firstVal = severities[0];
    const latestVal = severities[severities.length - 1];
    const delta = latestVal - firstVal;

    let trendType: 'improving' | 'worsening' | 'stable' = 'stable';
    let trendLabel = 'Stable';
    if (delta <= -1) {
      trendType = 'improving';
      trendLabel = `Improving (${delta} pts)`;
    } else if (delta >= 1) {
      trendType = 'worsening';
      trendLabel = `Elevated (+${delta} pts)`;
    } else {
      trendType = 'stable';
      trendLabel = 'Steady (±0 pts)';
    }

    // Severity tier & clinical classification
    let tier: 'mild' | 'moderate' | 'severe' = 'mild';
    let tierLabel = 'Mild / Well-Controlled';
    let tierBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let narrative = '';
    let clinicalRecommendation = '';

    if (avg <= 3.0) {
      tier = 'mild';
      tierLabel = 'Mild / Well-Controlled';
      tierBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      narrative =
        trendType === 'improving'
          ? `Symptom severity averaged ${roundedAvg}/10 across ${count} entries with positive interval improvement. Minimal disruption to daily activities.`
          : `Symptom severity consistently averaged ${roundedAvg}/10 across ${count} entries, indicating high therapeutic stability with low symptom interference.`;
      clinicalRecommendation =
        'Reassuring control. Current regimen appears well tolerated with minimal residual symptoms.';
    } else if (avg <= 6.0) {
      tier = 'moderate';
      tierLabel = 'Moderate Symptom Burden';
      tierBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      narrative =
        trendType === 'improving'
          ? `Average severity was ${roundedAvg}/10 (range: ${min}–${max}/10). Symptoms exhibited intermittent flare-ups but have trended downward from initial peaks.`
          : `Average severity was ${roundedAvg}/10 (range: ${min}–${max}/10) across ${count} entries, with notable intermittent discomfort affecting routine activities.`;
      clinicalRecommendation =
        'Review trigger factors, timing of doses, and whether additional interval monitoring is needed.';
    } else {
      tier = 'severe';
      tierLabel = 'Elevated Symptom Intensity';
      tierBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      narrative = `Average severity reached ${roundedAvg}/10 (peaking at ${max}/10) over ${count} entries. Indicates persistent high symptom intensity and functional burden.`;
      clinicalRecommendation =
        'Priority specialist discussion recommended regarding dosage titration, breakthrough management, or further diagnostic imaging.';
    }

    // Calculate meter gauge position (0-100%)
    const meterPercentage = Math.min(100, Math.max(0, (avg / 10) * 100));

    return {
      count,
      avg,
      roundedAvg,
      min,
      max,
      delta,
      trendType,
      trendLabel,
      tier,
      tierLabel,
      tierBadgeClass,
      narrative,
      clinicalRecommendation,
      meterPercentage,
      windowLabel,
      isHistoricalFallback,
    };
  }, [logs]);

  return (
    <div
      id="bento-card-severity-30d"
      className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col p-5 hover:border-slate-300 transition-colors"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            30-Day Symptom Severity
          </h2>
        </div>
        <span
          id="badge-30d-window"
          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[170px]"
          title={analysis?.windowLabel || '30-Day Interval'}
        >
          {analysis ? analysis.windowLabel : 'Last 30 Days'}
        </span>
      </div>

      {!analysis ? (
        /* Empty State */
        <div
          id="severity-30d-empty-state"
          className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-xl border border-slate-100"
        >
          <div className="w-9 h-9 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center mb-2.5">
            <Activity className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-700 mb-1">No 30-Day Logs Found</p>
          <p className="text-[11px] text-slate-500 max-w-xs mb-3">
            Record symptom logs with severity ratings (1–10) to generate immediate longitudinal feedback.
          </p>
          {onOpenNewLogModal && (
            <button
              id="btn-30d-log-first"
              type="button"
              onClick={onOpenNewLogModal}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Log First Entry</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-3.5">
          {/* Main Metric & Status Row */}
          <div className="flex items-end justify-between gap-2 pt-1">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Average Symptom Severity
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  id="metric-30d-avg-score"
                  className="text-3xl font-black text-slate-900 tracking-tight"
                >
                  {analysis.roundedAvg}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 10</span>
              </div>
            </div>

            {/* Trajectory & Status Badges */}
            <div className="flex flex-col items-end gap-1">
              <span
                id="badge-30d-tier"
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${analysis.tierBadgeClass}`}
              >
                {analysis.tier === 'mild' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : analysis.tier === 'moderate' ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>{analysis.tierLabel}</span>
              </span>

              <div
                id="badge-30d-trend"
                className="flex items-center gap-1 text-[11px] font-semibold"
              >
                {analysis.trendType === 'improving' ? (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" />
                    <span>{analysis.trendLabel}</span>
                  </span>
                ) : analysis.trendType === 'worsening' ? (
                  <span className="text-rose-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>{analysis.trendLabel}</span>
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-0.5">
                    <Minus className="w-3 h-3" />
                    <span>{analysis.trendLabel}</span>
                  </span>
                )}
              </div>

              {/* 7-Day Flare Alert Tag if severity spiked > 2 pts */}
              {spikeAnalysis.hasSpike && (
                <span
                  id="badge-30d-acute-spike"
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shadow-xs"
                  title={`7d average (${spikeAnalysis.roundedAvg7d}/10) is ${spikeAnalysis.diffFormatted} above 30d baseline`}
                >
                  <Flame className="w-3 h-3 text-rose-600" />
                  <span>7d Spike: {spikeAnalysis.diffFormatted}</span>
                </span>
              )}
            </div>
          </div>

          {/* 10-Point Longitudinal Meter Gauge */}
          <div id="severity-30d-meter" className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span className="text-emerald-600">0 Mild</span>
              <span className="text-amber-600">5 Moderate</span>
              <span className="text-rose-600">10 Severe</span>
            </div>

            {/* Track with Gradient and Pointer */}
            <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
              {/* Colored spectrum segments */}
              <div className="w-full h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 opacity-80" />
            </div>

            {/* Pointer Marker & Numerical Pin */}
            <div className="relative w-full h-3">
              <div
                id="severity-meter-pointer"
                className="absolute top-0 -ml-2 flex flex-col items-center transition-all duration-300"
                style={{ left: `${analysis.meterPercentage}%` }}
              >
                <div className="w-2.5 h-2.5 rotate-45 bg-slate-800 rounded-xs shadow-xs" />
              </div>
            </div>
          </div>

          {/* Longitudinal Feedback Callout Box */}
          <div
            id="severity-30d-feedback-box"
            className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Info className="w-3 h-3 text-blue-600" />
              <span>Immediate Longitudinal Feedback</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {analysis.narrative}
            </p>

            {/* If 7-day severity has increased by more than 2 points compared to 30-day average */}
            {spikeAnalysis.hasSpike && (
              <div
                id="severity-30d-spike-callout"
                className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs font-medium space-y-1"
              >
                <div className="flex items-center gap-1.5 font-bold text-rose-700 text-[11px] uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Clinical Flag: Acute 7-Day Severity Surge</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Symptom severity over the last 7 days averaged{' '}
                  <strong>{spikeAnalysis.roundedAvg7d}/10</strong>, an escalation of{' '}
                  <strong>{spikeAnalysis.diffFormatted}</strong> over the 30-day baseline ({spikeAnalysis.roundedAvg30d}/10).
                  Exceeds the 2.0-point clinical alert threshold.
                </p>
              </div>
            )}

            <div className="pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800">Specialist Tip: </span>
              <span>{analysis.clinicalRecommendation}</span>
            </div>
          </div>

          {/* 30-Day Sub-Stats Grid */}
          <div className="grid grid-cols-4 gap-1.5 text-center pt-1 border-t border-slate-100">
            <div className="p-1.5 bg-slate-50 rounded-lg">
              <span className="text-[10px] text-slate-400 block font-medium">30d Avg</span>
              <span className="text-xs font-bold text-slate-800">
                {analysis.roundedAvg}/10
              </span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg">
              <span className="text-[10px] text-slate-400 block font-medium">7d Avg</span>
              <span
                className={`text-xs font-bold ${
                  spikeAnalysis.hasSpike
                    ? 'text-rose-600'
                    : spikeAnalysis.diff > 0
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {spikeAnalysis.roundedAvg7d !== 'N/A' ? `${spikeAnalysis.roundedAvg7d}/10` : 'N/A'}
              </span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg">
              <span className="text-[10px] text-slate-400 block font-medium">Range</span>
              <span className="text-xs font-bold text-slate-800">
                {analysis.min}–{analysis.max}
              </span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg">
              <span className="text-[10px] text-slate-400 block font-medium">Entries</span>
              <span className="text-xs font-bold text-slate-800">
                {analysis.count} logged
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            {onOpenNewLogModal && (
              <button
                id="btn-30d-add-entry"
                type="button"
                onClick={onOpenNewLogModal}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Today</span>
              </button>
            )}

            {onNavigateTab && (
              <button
                id="btn-30d-view-logs"
                type="button"
                onClick={() => onNavigateTab('log')}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-0.5 ml-auto"
              >
                <span>Full History</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
