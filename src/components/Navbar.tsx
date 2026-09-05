import React from 'react';
import { ShieldCheck, Activity, FileText, ClipboardList, RefreshCw, Lock, Sparkles, LayoutGrid, Printer, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  activeTab: 'bento' | 'baseline' | 'log' | 'brief' | 'safety';
  onSelectTab: (tab: 'bento' | 'baseline' | 'log' | 'brief' | 'safety') => void;
  conditionsCount: number;
  medicationsCount: number;
  logsCount: number;
  hasBrief: boolean;
  onOpenPrivacyModal: () => void;
  onResetSampleData: () => void;
  onPrintBrief?: () => void;
  activeAlertsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  conditionsCount,
  medicationsCount,
  logsCount,
  hasBrief,
  onOpenPrivacyModal,
  onResetSampleData,
  onPrintBrief,
  activeAlertsCount = 3,
}) => {
  return (
    <header id="main-app-header" className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Logo matching Bento Grid */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('bento')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                ConsultantBrief<span className="text-blue-600 font-normal">.ai</span>
              </h1>
            </div>
          </div>

          {/* Privacy Badge & Actions */}
          <div className="flex items-center gap-3">
            <button
              id="btn-inspect-privacy"
              type="button"
              onClick={onOpenPrivacyModal}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 hover:bg-emerald-100/70 transition-colors shadow-xs"
              title="Click to inspect local privacy redaction"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold">Privacy Guard: Active</span>
            </button>

            <button
              id="btn-reload-sample"
              type="button"
              onClick={onResetSampleData}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Reset to realistic demo patient profile"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Demo Case</span>
            </button>

            <button
              id="btn-nav-export-pdf"
              type="button"
              onClick={onPrintBrief || (() => onSelectTab('brief'))}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-200" />
              <span>Export to PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation (Bento Segmented Controller) */}
        <div className="flex border-t border-slate-100 overflow-x-auto no-scrollbar py-2">
          <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Tabs">
            <button
              id="tab-bento-grid"
              type="button"
              onClick={() => onSelectTab('bento')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'bento'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bento Grid Dashboard</span>
            </button>

            <button
              id="tab-baseline-profile"
              type="button"
              onClick={() => onSelectTab('baseline')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'baseline'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Baseline Profile</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'baseline' ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {conditionsCount + medicationsCount}
              </span>
            </button>

            <button
              id="tab-treatment-safety"
              type="button"
              onClick={() => onSelectTab('safety')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'safety'
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${activeTab === 'safety' ? 'text-amber-600' : 'text-amber-500'}`} />
              <span>Treatment & Clash Alerts</span>
              {activeAlertsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'safety'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {activeAlertsCount}
                </span>
              )}
            </button>

            <button
              id="tab-treatment-log"
              type="button"
              onClick={() => onSelectTab('log')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'log'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Activity & Treatment Log</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'log' ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {logsCount}
              </span>
            </button>

            <button
              id="tab-consultation-brief"
              type="button"
              onClick={() => onSelectTab('brief')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'brief'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Clinical Summary Compiler</span>
              {hasBrief && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Ready to print" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
