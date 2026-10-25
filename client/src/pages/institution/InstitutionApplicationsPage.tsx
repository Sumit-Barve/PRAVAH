import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInstitutionApplications } from '../../services/institutionService';
import { Application } from '@saksham/shared';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
} from 'lucide-react';

export const InstitutionApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      setIsLoading(true);
      try {
        const data = await getInstitutionApplications();
        setApplications(data);
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, []);

  const filtered = applications.filter((app) => {
    const matchSearch =
      searchTerm.trim() === '' ||
      app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'ALL' || app.category === categoryFilter;

    let matchStatus = true;
    if (statusFilter === 'DRAFT') {
      matchStatus = !!app.isDraft;
    } else if (statusFilter === 'SUBMITTED') {
      matchStatus = !app.isDraft && app.currentStage === 'SUBMITTED';
    } else if (statusFilter === 'SCRUTINY') {
      matchStatus = !app.isDraft && (app.currentStage === 'SCRUTINY' || app.currentStage === 'RE_SCRUTINY');
    } else if (statusFilter === 'EVC') {
      matchStatus = !app.isDraft && (app.currentStage === 'EVC_SCHEDULED' || app.currentStage === 'EVC_COMPLETED');
    }

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Application Register</h1>
          <p className="text-xs text-slate-500">
            Authoritative registry of your institution's AICTE approval applications
          </p>
        </div>
        <Link
          to="/institution/applications/new"
          className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by PRAVAH Application Ref or Category..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="NEW_INSTITUTE">New Institute</option>
            <option value="EOA_EXISTING">Extension of Approval (EoA)</option>
            <option value="INTAKE_INCREASE">Intake Increase</option>
            <option value="SUPERNUMERARY_SEATS">Supernumerary Seats</option>
            <option value="CLOSURE">Progressive Closure</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Drafts (Unsubmitted)</option>
            <option value="SUBMITTED">Submitted to Queue</option>
            <option value="SCRUTINY">Under Scrutiny</option>
            <option value="EVC">EVC Inspection</option>
          </select>
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No applications found</h3>
            <p className="text-xs text-slate-500 mt-1">Try modifying your search or filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Application Reference</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Cycle</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Requested Intake</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-gov-navy-950">
                      {app.applicationNumber}
                      {app.isDeficient && (
                        <span className="ml-2 inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Deficiency</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {app.category.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {app.academicCycle || '2026-27'}
                    </td>
                    <td className="py-3.5 px-4">
                      {app.isDraft ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Draft (Unsubmitted)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {app.currentStage.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {app.requestedIntake} seats
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(app.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/institution/applications/${app.id}`}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-gov-navy-950 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                      >
                        <span>{app.isDraft ? 'Edit Draft' : 'View Details'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
