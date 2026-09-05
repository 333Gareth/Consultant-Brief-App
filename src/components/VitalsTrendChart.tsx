import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  AreaChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TreatmentLogEntry } from '../types';
import {
  Activity,
  Heart,
  Scale,
  Sliders,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';

interface VitalsTrendChartProps {
  logs: TreatmentLogEntry[];
  onOpenNewLogModal?: () => void;
  className?: string;
}

type MetricMode = 'all' | 'severity' | 'bloodPressure' | 'heartRate' | 'weight';

interface ProcessedDataPoint {
  id: string;
  rawDate: string;
  displayDate: string;
  timestamp: number;
  severity: number;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  weight?: number;
  symptomsDescription: string;
  medicationChanges?: string;
  notes?: string;
}

export const VitalsTrendChart: React.FC<VitalsTrendChartProps> = ({
  logs,
  onOpenNewLogModal,
  className = 'col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 lg:p-6 flex flex-col hover:border-slate-300 transition-colors',
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('all');

  // Process and sort logs chronologically
  const chartData = useMemo<ProcessedDataPoint[]>(() => {
    if (!logs || logs.length === 0) return [];

    const sorted = [...logs].sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      return timeA - timeB;
    });

    return sorted.map((log) => {
      // Parse blood pressure e.g. "128/82" or "144 / 90"
      let systolic: number | undefined;
      let diastolic: number | undefined;
      if (log.vitals?.bloodPressure) {
        const bpMatch = log.vitals.bloodPressure.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
        if (bpMatch) {
          systolic = parseInt(bpMatch[1], 10);
          diastolic = parseInt(bpMatch[2], 10);
        }
      }

      // Parse heart rate e.g. "72" or "68 bpm"
      let heartRate: number | undefined;
      if (log.vitals?.heartRate) {
        const hrClean = log.vitals.heartRate.replace(/[^\d.]/g, '');
        if (hrClean) {
          const parsed = parseFloat(hrClean);
          if (!isNaN(parsed) && parsed > 30 && parsed < 220) {
            heartRate = parsed;
          }
        }
      }

      // Parse weight e.g. "76.5 kg" or "168 lbs"
      let weight: number | undefined;
      if (log.vitals?.weight) {
        const wClean = log.vitals.weight.replace(/[^\d.]/g, '');
        if (wClean) {
          const parsed = parseFloat(wClean);
          if (!isNaN(parsed) && parsed > 20 && parsed < 300) {
            weight = parsed;
          }
        }
      }

      // Format clean date label: e.g. "May 18"
      let displayDate = log.date;
      try {
        const parsedD = new Date(log.date);
        if (!isNaN(parsedD.getTime())) {
          displayDate = parsedD.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
        }
      } catch {
        displayDate = log.date;
      }

      return {
        id: log.id,
        rawDate: log.date,
        displayDate,
        timestamp: new Date(log.date).getTime() || 0,
        severity: typeof log.severity === 'number' ? log.severity : 0,
        systolic,
        diastolic,
        heartRate,
        weight,
        symptomsDescription: log.symptomsDescription || '',
        medicationChanges: log.medicationChanges,
        notes: log.notes,
      };
    });
  }, [logs]);

  // Aggregate statistics for quick summary badges
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgSeverity: '—',
        latestSeverity: '—',
        severityTrend: 'neutral',
        latestBp: '—',
        avgHeartRate: '—',
        latestHeartRate: '—',
        latestWeight: '—',
        weightDelta: '—',
      };
    }

    const severities = chartData.map((d) => d.severity);
    const avgSeverity = (severities.reduce((a, b) => a + b, 0) / severities.length).toFixed(1);
    const latestSeverity = severities[severities.length - 1];

    let severityTrend: 'improving' | 'worsening' | 'neutral' = 'neutral';
    if (severities.length >= 2) {
      const first = severities[0];
      const last = severities[severities.length - 1];
      if (last < first) severityTrend = 'improving'; // Lower symptom severity is better
      else if (last > first) severityTrend = 'worsening';
    }

    // BP
    const bps = chartData.filter((d) => d.systolic && d.diastolic);
    const latestBp =
      bps.length > 0
        ? `${bps[bps.length - 1].systolic}/${bps[bps.length - 1].diastolic} mmHg`
        : '—';

    // Heart Rate
    const hrs = chartData.filter((d) => typeof d.heartRate === 'number').map((d) => d.heartRate!);
    const latestHeartRate = hrs.length > 0 ? `${hrs[hrs.length - 1]} bpm` : '—';
    const avgHeartRate =
      hrs.length > 0 ? `${Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length)} bpm` : '—';

    // Weight
    const wts = chartData.filter((d) => typeof d.weight === 'number').map((d) => d.weight!);
    const latestWeight = wts.length > 0 ? `${wts[wts.length - 1]} kg` : '—';
    let weightDelta = '—';
    if (wts.length >= 2) {
      const diff = wts[wts.length - 1] - wts[0];
      weightDelta = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} kg`;
    }

    return {
      avgSeverity,
      latestSeverity: `${latestSeverity}/10`,
      severityTrend,
      latestBp,
      avgHeartRate,
      latestHeartRate,
      latestWeight,
      weightDelta,
    };
  }, [chartData]);

  // Custom Bento Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: ProcessedDataPoint = payload[0]?.payload;
    if (!data) return null;

    const severityColor =
      data.severity >= 7
        ? 'bg-rose-100 text-rose-800 border-rose-200'
        : data.severity >= 4
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs max-w-xs pointer-events-none z-50">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{data.rawDate}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${severityColor}`}>
            Severity: {data.severity}/10
          </span>
        </div>

        <div className="space-y-1.5 text-slate-600">
          {data.systolic && data.diastolic && (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-medium">Blood Pressure:</span>
              <span className="font-mono font-bold text-slate-800">
                {data.systolic}/{data.diastolic} mmHg
              </span>
            </div>
          )}

          {typeof data.heartRate === 'number' && (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-medium">Heart Rate:</span>
              <span className="font-mono font-bold text-rose-600">{data.heartRate} bpm</span>
            </div>
          )}

          {typeof data.weight === 'number' && (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-medium">Body Weight:</span>
              <span className="font-mono font-bold text-indigo-600">{data.weight} kg</span>
            </div>
          )}

          {data.symptomsDescription && (
            <div className="pt-1.5 border-t border-slate-100 text-[11px] text-slate-700 italic">
              "{data.symptomsDescription}"
            </div>
          )}

          {data.medicationChanges && (
            <div className="pt-1 text-[10px] text-blue-700 font-medium">
              Rx: {data.medicationChanges}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      id="bento-card-vitals-chart"
      className={className}
    >
      {/* Header with Title and Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Health Trends & Longitudinal Vitals
            </h2>
          </div>
          <p className="text-xs text-slate-500 pl-8">
            Interactive chart tracking symptom severity and clinical biomarkers over time
          </p>
        </div>

        {/* View Mode Selector Tabs */}
        <div
          id="chart-metric-selector"
          className="flex items-center p-1 bg-slate-100 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full text-xs"
        >
          <button
            type="button"
            onClick={() => setMetricMode('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              metricMode === 'all'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Combined</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('severity')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              metricMode === 'severity'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Severity</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('bloodPressure')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              metricMode === 'bloodPressure'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Blood Pressure</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('heartRate')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              metricMode === 'heartRate'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Heart Rate</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('weight')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              metricMode === 'weight'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Weight</span>
          </button>
        </div>
      </div>

      {/* Bento Sub-Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* Metric 1: Symptom Severity */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Severity Average
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900">{stats.avgSeverity} / 10</span>
            <div className="flex items-center gap-0.5 text-xs font-semibold">
              {stats.severityTrend === 'improving' ? (
                <span className="text-emerald-600 flex items-center gap-0.5" title="Symptom severity decreasing">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Improving</span>
                </span>
              ) : stats.severityTrend === 'worsening' ? (
                <span className="text-rose-600 flex items-center gap-0.5" title="Symptom severity increasing">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Elevated</span>
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-0.5">
                  <Minus className="w-3.5 h-3.5" />
                  <span>Stable</span>
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Latest: {stats.latestSeverity}</span>
        </div>

        {/* Metric 2: Blood Pressure */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Latest Blood Pressure
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-bold text-slate-900 font-mono">{stats.latestBp}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Goal target: &lt;130/80</span>
        </div>

        {/* Metric 3: Heart Rate */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Heart Rate
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-rose-600 font-mono">{stats.latestHeartRate}</span>
            <span className="text-xs text-slate-500">Avg: {stats.avgHeartRate}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Normal resting: 60-100</span>
        </div>

        {/* Metric 4: Weight */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Body Weight
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-indigo-600 font-mono">{stats.latestWeight}</span>
            {stats.weightDelta !== '—' && (
              <span className="text-xs text-slate-500 font-medium">{stats.weightDelta}</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Documented trend</span>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="w-full h-72 sm:h-80 bg-slate-50/50 rounded-xl border border-slate-100 p-2 sm:p-4">
        {chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">No vitals data to plot yet</p>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Add symptom logs with vital signs like blood pressure, heart rate, or weight to see longitudinal trends.
            </p>
            {onOpenNewLogModal && (
              <button
                type="button"
                onClick={onOpenNewLogModal}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
              >
                Log First Entry
              </button>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {metricMode === 'severity' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="severityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit=""
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={3} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Mild (≤3)', position: 'insideTopRight', fill: '#059669', fontSize: 10 }} />
                <ReferenceLine y={7} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Severe (≥7)', position: 'insideTopRight', fill: '#e11d48', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="severity"
                  name="Symptom Severity (1-10)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#severityGrad)"
                  activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : metricMode === 'bloodPressure' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={['dataMin - 15', 'dataMax + 15']}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit=" mmHg"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <ReferenceLine y={120} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Normal Systolic (120)', position: 'insideTopRight', fill: '#64748b', fontSize: 10 }} />
                <ReferenceLine y={80} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Normal Diastolic (80)', position: 'insideTopRight', fill: '#64748b', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  name="Systolic (mmHg)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  name="Diastolic (mmHg)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 3.5, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            ) : metricMode === 'heartRate' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={['dataMin - 10', 'dataMax + 10']}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit=" bpm"
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={60} stroke="#cbd5e1" strokeDasharray="3 3" />
                <ReferenceLine y={100} stroke="#cbd5e1" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="heartRate"
                  name="Heart Rate (BPM)"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#hrGrad)"
                  activeDot={{ r: 6, fill: '#e11d48', stroke: '#ffffff', strokeWidth: 2 }}
                  connectNulls
                />
              </AreaChart>
            ) : metricMode === 'weight' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit=" kg"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Body Weight (kg)"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            ) : (
              /* Combined Multi-Axis View */
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="combinedSeverityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                {/* Left Y-Axis: Severity (0-10) */}
                <YAxis
                  yAxisId="left"
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tick={{ fontSize: 11, fill: '#2563eb' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                {/* Right Y-Axis: Vitals / BP / HR */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[50, 180]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

                {/* Symptom Severity Area */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="severity"
                  name="Severity (1-10)"
                  fill="url(#combinedSeverityGrad)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  activeDot={{ r: 5 }}
                />

                {/* Blood Pressure Systolic */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="systolic"
                  name="Systolic BP (mmHg)"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#0284c7' }}
                  connectNulls
                />

                {/* Heart Rate */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="heartRate"
                  name="Heart Rate (BPM)"
                  stroke="#e11d48"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 3, fill: '#e11d48' }}
                  connectNulls
                />

                {/* Weight */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="weight"
                  name="Weight (kg)"
                  stroke="#8b5cf6"
                  strokeWidth={1.5}
                  dot={{ r: 2.5, fill: '#8b5cf6' }}
                  connectNulls
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer with Insight Note */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>
            Hover over any data point to inspect symptoms description and medication adjustments for that date.
          </span>
        </div>
        <span className="font-semibold text-slate-700 shrink-0">
          {chartData.length} data point{chartData.length === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
};
