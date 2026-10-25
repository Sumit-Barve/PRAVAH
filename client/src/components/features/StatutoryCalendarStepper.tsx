import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Scale,
  ChevronRight,
  X,
} from 'lucide-react';

interface CalendarStage {
  id: string;
  stageNumber: number;
  titleEn: string;
  titleHi: string;
  cutoffDate: string;
  status: 'COMPLETED' | 'ACTIVE' | 'UPCOMING';
  daysLeft?: number;
  courtMandateRef: string;
  description: string;
}

export const StatutoryCalendarStepper: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<CalendarStage | null>(null);

  const stages: CalendarStage[] = [
    {
      id: 'stg-1',
      stageNumber: 1,
      titleEn: 'Application Ingestion',
      titleHi: 'आवेदन प्राप्ति',
      cutoffDate: 'March 15',
      status: 'COMPLETED',
      courtMandateRef: 'APH Ch. I Sec 1.2 / Parshvanath Precedent',
      description: 'Online registration, institutional fee submission, and automated digital document ingestion.',
    },
    {
      id: 'stg-2',
      stageNumber: 2,
      titleEn: 'Scrutiny Committee',
      titleHi: 'संवीक्षा समिति',
      cutoffDate: 'April 10',
      status: 'ACTIVE',
      daysLeft: 7,
      courtMandateRef: 'Supreme Court Mandate (Para 42) & APH Sec 1.3',
      description: 'Document verification by 3-member expert scrutiny committee. Maximum 7 days turnaround per file.',
    },
    {
      id: 'stg-3',
      stageNumber: 3,
      titleEn: 'Re-Scrutiny Window',
      titleHi: 'पुनः संवीक्षा',
      cutoffDate: 'April 25',
      status: 'UPCOMING',
      courtMandateRef: 'APH Ch. II Sec 2.7',
      description: '10-day statutory opportunity for institutions to upload rectifications for non-critical deficiencies.',
    },
    {
      id: 'stg-4',
      stageNumber: 4,
      titleEn: 'EVC Inspections',
      titleHi: 'विशेषज्ञ समिति दौरा',
      cutoffDate: 'May 10',
      status: 'UPCOMING',
      courtMandateRef: 'APH Ch. I Sec 1.5 (48h Reporting Rule)',
      description: 'Physical campus inspection of land, buildings, laboratories, computing power, and faculty roster.',
    },
    {
      id: 'stg-5',
      stageNumber: 5,
      titleEn: 'Hearing (SHC)',
      titleHi: 'स्थायी सुनवाई समिति',
      cutoffDate: 'May 20',
      status: 'UPCOMING',
      courtMandateRef: 'AICTE Act Sec 10(k) & APH Ch. VIII',
      description: 'Formal quasi-judicial hearing for institutions with contested or serious infrastructural deficiencies.',
    },
    {
      id: 'stg-6',
      stageNumber: 6,
      titleEn: 'Appeals (SAC)',
      titleHi: 'स्थायी अपीलीय समिति',
      cutoffDate: 'May 31',
      status: 'UPCOMING',
      courtMandateRef: 'Supreme Court Mandated Appellate Deadline',
      description: 'Final statutory appellate review chaired by retired High Court Judge before Council decision.',
    },
    {
      id: 'stg-7',
      stageNumber: 7,
      titleEn: 'Council Approval',
      titleHi: 'अंतिम अनुमोदन',
      cutoffDate: 'June 10',
      status: 'UPCOMING',
      courtMandateRef: 'National Cutoff Date (June 10 Non-Extendable)',
      description: 'Official issuance of Extension of Approval (EoA) and Letter of Approval (LoA) for academic cycle.',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gov-navy-900 text-amber-400 rounded-lg">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider">
                Supreme Court Statutory Approval Calendar
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                Parshvanath Precedent (2013) 3 SCC 385
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Statutory non-extendable cutoffs governing all AICTE regional scrutiny, inspection, and hearing milestones.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[11px] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Current Active
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Upcoming
          </span>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {stages.map((stg) => {
          const isCompleted = stg.status === 'COMPLETED';
          const isActive = stg.status === 'ACTIVE';

          return (
            <div
              key={stg.id}
              onClick={() => setSelectedStage(stg)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-amber-50 to-orange-50 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                  : isCompleted
                  ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-amber-500 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    Phase {stg.stageNumber}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isActive ? (
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  )}
                </div>

                <p className="font-bold text-xs text-slate-900 leading-tight">{stg.titleEn}</p>
                <p className="text-[10px] text-slate-500 font-serif">{stg.titleHi}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700">{stg.cutoffDate}</span>
                {isActive && (
                  <span className="font-bold text-amber-800 text-[10px] bg-amber-200/60 px-1.5 py-0.2 rounded">
                    Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Dialog for Stage Details */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gov-saffron-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                  Phase {selectedStage.stageNumber} Milestone Details
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedStage.titleEn} ({selectedStage.titleHi})
                </h3>
              </div>
              <button
                onClick={() => setSelectedStage(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Statutory Cutoff Deadline:</span>
                <span className="font-bold text-gov-navy-950 font-mono text-sm">
                  {selectedStage.cutoffDate}, 2026 (23:59 IST)
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Legal / Handbook Citation:</span>
                <p className="font-mono text-slate-700 bg-slate-100 p-2 rounded border border-slate-200 text-[11px]">
                  {selectedStage.courtMandateRef}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Regulatory Scope & SLA:</span>
                <p className="text-slate-600 leading-relaxed">{selectedStage.description}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedStage(null)}
                className="px-4 py-2 bg-gov-navy-900 hover:bg-gov-navy-800 text-white rounded text-xs font-bold"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
