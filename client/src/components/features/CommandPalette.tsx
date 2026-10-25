import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Application, UserRole } from '@saksham/shared';
import { fetchApplications } from '../../services/applicationService';
import { useAuth, PRESET_USERS } from '../../context/AuthContext';
import {
  Search,
  Command,
  FileText,
  GitPullRequest,
  Users,
  ShieldCheck,
  Clock,
  BarChart3,
  History,
  Scale,
  UserCheck,
  ArrowRight,
  X,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [apps, setApps] = useState<Application[]>([]);
  const navigate = useNavigate();
  const { switchRole } = useAuth();

  // Handle global Esc and Ctrl+K shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggle or open
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetchApplications({ search: query.trim() || undefined, limit: 5 })
        .then((res) => setApps(res.data))
        .catch(() => setApps([]));
    }
  }, [isOpen, query]);

  if (!isOpen) return null;

  const filteredApps = apps;

  const quickRoutes = [
    { label: 'Scrutiny & Stage Pendency Queue', path: '/workflow-queue', icon: GitPullRequest, hint: 'Queue' },
    { label: 'EVC Committee & Inspections', path: '/evc', icon: Users, hint: '48h SLA' },
    { label: 'Time-Bound Undertakings', path: '/compliance', icon: ShieldCheck, hint: 'Compliance' },
    { label: 'Document Validity & Lease Expiry', path: '/document-validity', icon: Clock, hint: 'Validity' },
    { label: 'Forensic Audit Trail', path: '/audit', icon: History, hint: 'Audit' },
    { label: 'Regulatory Rules Register', path: '/admin/rules', icon: Scale, hint: 'APH Rules' },
  ].filter((r) => query === '' || r.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelectRoute = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Application No, Institute, Stage Queue, or jump to role..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center space-x-1.5 flex-shrink-0 text-slate-400">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 border border-slate-300 rounded text-slate-600">
              ESC
            </kbd>
            <button onClick={onClose} className="p-1 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Route Jumps */}
          <div>
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Statutory Desks & Portals
            </div>
            {quickRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <div
                  key={route.path}
                  onClick={() => handleSelectRoute(route.path)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gov-navy-50 cursor-pointer text-slate-800 hover:text-gov-navy-950 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 text-gov-navy-800" />
                    <span className="font-semibold text-xs">{route.label}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                    {route.hint}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Applications Matching Query */}
          {filteredApps.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 pt-2">
                Matching Applications ({filteredApps.length})
              </div>
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    navigate(`/applications?search=${encodeURIComponent(app.applicationNumber)}`);
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer transition"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-gov-navy-900 text-xs">
                        {app.applicationNumber}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                        {app.currentStage}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 text-xs truncate mt-0.5">
                      {app.instituteName}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Quick Officer Switch Persona */}
          <div className="border-t border-slate-100 pt-2">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Switch Officer Role Persona
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-2">
              <button
                onClick={() => handleSelectRole('SCRUTINY_OFFICER')}
                className="text-left px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
              >
                👤 Scrutiny Officer
              </button>
              <button
                onClick={() => handleSelectRole('REGIONAL_OFFICER')}
                className="text-left px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
              >
                🏛️ Regional Officer (RO)
              </button>
              <button
                onClick={() => handleSelectRole('EVC_EXPERT')}
                className="text-left px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
              >
                📋 EVC Committee Convener
              </button>
              <button
                onClick={() => handleSelectRole('MEMBER_SECRETARY')}
                className="text-left px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
              >
                ⚖️ Member Secretary / Council
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate with Arrows or Click</span>
          <span>PRAVAH Command Palette</span>
        </div>
      </div>
    </div>
  );
};
