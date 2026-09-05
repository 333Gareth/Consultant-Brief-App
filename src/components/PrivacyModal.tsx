import React, { useState } from 'react';
import { ShieldCheck, X, Eye, CheckCircle2, Lock, FileSearch } from 'lucide-react';
import { scrubText } from '../utils/privacyScrubber';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientPseudonym?: string;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose, patientPseudonym }) => {
  const [testInput, setTestInput] = useState(
    'Patient John Doe, DOB: 14/05/1984, NHS number 485 777 3456, phone 07700 900123, residing at 14 Elm Street, London SW1A 1AA. Started Lisinopril 10mg.'
  );

  if (!isOpen) return null;

  const scrubbedResult = scrubText(testInput, patientPseudonym);

  return (
    <div
      id="privacy-modal-overlay"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        id="privacy-modal-container"
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col text-slate-100 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Local Privacy Scrubber Architecture</h3>
              <p className="text-xs text-emerald-400 font-medium">100% Client-Side De-Identification Engine</p>
            </div>
          </div>
          <button
            id="btn-close-privacy-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Architecture overview */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs tracking-wider uppercase">
              <Lock className="w-3.5 h-3.5" />
              <span>How your personal information is protected</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Before your baseline health data and recent treatment notes are sent to the AI synthesis model,
              our client-side engine automatically parses and redacts all Personally Identifiable Information (PII)
              directly in your browser memory:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Patient Names & Titles</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>NHS, SSN & Hospital MRN Numbers</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Dates of Birth (DOB)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Phone Numbers & Email Addresses</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Street Addresses & Postal Codes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Persistent Local State (No cloud account required)</span>
              </li>
            </ul>
          </div>

          {/* Interactive Sanitizer Tester */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="test-scrubber-input" className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <FileSearch className="w-4 h-4 text-teal-400" />
                <span>Interactive Scrubber Sandbox:</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Type or paste text with personal details to see live redaction
              </span>
            </div>

            <textarea
              id="test-scrubber-input"
              rows={3}
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
            />

            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Redacted Payload (What is sent to AI):
                </span>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-mono">
                  {scrubbedResult.count} {scrubbedResult.count === 1 ? 'item' : 'items'} redacted
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 break-words">
                {scrubbedResult.cleaned}
              </p>

              {scrubbedResult.log.length > 0 && (
                <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300">Detailed Redactions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {scrubbedResult.log.map((item, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-800/80 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono"
                      >
                        {item.field}: <span className="text-rose-300 line-through">{item.originalMatch}</span> →{' '}
                        <span className="text-emerald-400">{item.replacedWith}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            id="btn-dismiss-privacy-modal"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-slate-950 font-semibold text-xs transition-colors"
          >
            I Understand — Proceed
          </button>
        </div>
      </div>
    </div>
  );
};
