import React from 'react';
import { Region, Application } from '@saksham/shared';
import { Building2, Check } from 'lucide-react';

interface RegionalOffice {
  code: Region;
  shortName: string;
  headquarters: string;
  nameEn: string;
  states: string;
}

const REGIONAL_OFFICES: RegionalOffice[] = [
  {
    code: 'NORTH_WEST',
    shortName: 'NWRO',
    headquarters: 'Chandigarh',
    nameEn: 'North-Western Regional Office',
    states: 'Punjab, Haryana, HP, J&K, Ladakh, Chandigarh',
  },
  {
    code: 'WESTERN',
    shortName: 'WRO',
    headquarters: 'Mumbai',
    nameEn: 'Western Regional Office',
    states: 'Maharashtra, Goa',
  },
  {
    code: 'CENTRAL',
    shortName: 'CRO',
    headquarters: 'Bhopal',
    nameEn: 'Central Regional Office',
    states: 'Madhya Pradesh, Chhattisgarh, Gujarat',
  },
  {
    code: 'SOUTH_WEST',
    shortName: 'SWRO',
    headquarters: 'Bengaluru',
    nameEn: 'South-Western Regional Office',
    states: 'Karnataka, Kerala, Lakshadweep',
  },
  {
    code: 'SOUTH_CENTRAL',
    shortName: 'SCRO',
    headquarters: 'Hyderabad',
    nameEn: 'South-Central Regional Office',
    states: 'Andhra Pradesh, Telangana',
  },
  {
    code: 'SOUTHERN',
    shortName: 'SRO',
    headquarters: 'Chennai',
    nameEn: 'Southern Regional Office',
    states: 'Tamil Nadu, Puducherry',
  },
  {
    code: 'NORTHERN',
    shortName: 'NRO',
    headquarters: 'Kanpur',
    nameEn: 'Northern Regional Office',
    states: 'Uttar Pradesh, Uttarakhand',
  },
  {
    code: 'EASTERN',
    shortName: 'ERO',
    headquarters: 'Kolkata',
    nameEn: 'Eastern Regional Office',
    states: 'West Bengal, Odisha, Bihar, Jharkhand, North-East',
  },
];

interface RegionalJurisdictionHubProps {
  selectedRegion: Region | 'ALL';
  onSelectRegion: (region: Region | 'ALL') => void;
  applications?: Application[];
}

export const RegionalJurisdictionHub: React.FC<RegionalJurisdictionHubProps> = ({
  selectedRegion,
  onSelectRegion,
  applications = [],
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gov-navy-900 text-amber-400 rounded-lg">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider">
              AICTE Regional Jurisdictions Hub (8 Regional Offices)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select an office to inspect regional queue workload, jurisdictional pendency, and scrutiny allocations.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectRegion('ALL')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
            selectedRegion === 'ALL'
              ? 'bg-gov-navy-900 text-amber-300 shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>All Regions (National View)</span>
          {selectedRegion === 'ALL' && <Check className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 8 Regional Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {REGIONAL_OFFICES.map((ro) => {
          const count = applications.filter((a) => a.region === ro.code).length;
          const overdueCount = applications.filter(
            (a) => a.region === ro.code && (a.priority === 'CRITICAL_OVERDUE' || a.stageAgeingDays > 7)
          ).length;
          const isSelected = selectedRegion === ro.code;

          return (
            <div
              key={ro.code}
              onClick={() => onSelectRegion(isSelected ? 'ALL' : ro.code)}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-gov-navy-900 text-white border-gov-navy-900 ring-2 ring-amber-400 shadow-md'
                  : 'bg-slate-50 border-slate-200 hover:border-gov-navy-600 hover:bg-white text-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-mono font-extrabold text-xs px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-amber-400 text-gov-navy-950' : 'bg-slate-200 text-gov-navy-900'
                    }`}
                  >
                    {ro.shortName}
                  </span>
                  {overdueCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title={`${overdueCount} overdue files`}></span>
                  )}
                </div>

                <p className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {ro.headquarters}
                </p>
                <p className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {ro.nameEn.split(' ')[0]}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className={`text-[11px] font-semibold ${isSelected ? 'text-amber-300' : 'text-slate-700'}`}>
                  {count} Files
                </span>
                {overdueCount > 0 && (
                  <span className="text-[10px] font-bold text-rose-500">
                    +{overdueCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
