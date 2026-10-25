import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IndiaFlag, CouncilEmblem } from '../common/GovtEmblem';
import { useAuth, PRESET_USERS } from '../../context/AuthContext';
import { UserRole } from '@saksham/shared';
import { CommandPalette } from '../features/CommandPalette';
import {
  LayoutDashboard,
  FileText,
  GitPullRequest,
  Users,
  ShieldCheck,
  Clock,
  BarChart3,
  History,
  Scale,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
  Search,
  Volume2,
  Pause,
  Play,
  Languages,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { currentUser, switchRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tickerPaused, setTickerPaused] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState<number>(1);
  const [selectedLang, setSelectedLang] = useState<'EN' | 'HI'>('EN');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Change font scaling dynamically
  const changeFontSize = (delta: number) => {
    const newScale = Math.min(1.2, Math.max(0.85, fontSizeScale + delta));
    setFontSizeScale(newScale);
    document.documentElement.style.setProperty('--font-scale', newScale.toString());
  };

  const resetFontSize = () => {
    setFontSizeScale(1);
    document.documentElement.style.setProperty('--font-scale', '1');
  };

  const allNavItems = [
    { to: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { to: '/applications', label: 'Applications Register', icon: FileText, badge: '12' },
    { to: '/workflow-queue', label: 'Scrutiny Queue', icon: GitPullRequest, badge: '5' },
    { to: '/evc', label: 'EVC Inspections', icon: Users, alert: true },
    { to: '/compliance', label: 'Compliance & Undertakings', icon: ShieldCheck, badge: '4' },
    { to: '/document-validity', label: 'Document Validity', icon: Clock, alert: true },
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    {
      to: '/audit',
      label: 'Forensic Audit Trail',
      icon: History,
      requiredRoles: ['MEMBER_SECRETARY', 'SYSTEM_ADMIN'] as UserRole[],
    },
    { to: '/admin/rules', label: 'Regulatory Rules', icon: Scale },
  ];

  const navItems = allNavItems.filter((item) => {
    if (!item.requiredRoles) return true;
    return currentUser?.role && item.requiredRoles.includes(currentUser.role);
  });

  const getPageMeta = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return {
          title: 'Executive Pendency & Workflow Overview',
          subtitle: 'Live stage monitoring, queue bottlenecks, and statutory compliance indicators',
        };
      case '/applications':
        return {
          title: 'AICTE Applications Master Register',
          subtitle: 'Filter, inspect, and track applications across all 7 regional jurisdictions',
        };
      case '/workflow-queue':
        return {
          title: 'Scrutiny & Stage Pendency Queue',
          subtitle: 'Time-critical scrutiny queues, SLA ageing, and assigned officer workloads',
        };
      case '/evc':
        return {
          title: 'Expert Visit Committee (EVC) Operations',
          subtitle: 'Inspection scheduling, committee constitution, and 48-hour report submission tracking',
        };
      case '/compliance':
        return {
          title: 'Institutional Undertakings & Conditional Approvals',
          subtitle: 'Tracking time-bound affidavits, fire NOCs, faculty cadre ratios, and escalation notices',
        };
      case '/document-validity':
        return {
          title: 'Statutory Document Validity Monitoring',
          subtitle: 'Proactive expiry tracking for Land Leases, Fire Safety NOCs, Occupancy, and NBA accreditations',
        };
      case '/reports':
        return {
          title: 'Consolidated Operational Analytics & Reports',
          subtitle: 'Stage-wise pendency distribution, regional workload, and regulatory SLA compliance metrics',
        };
      case '/audit':
        return {
          title: 'Forensic Regulatory Audit Trail',
          subtitle: 'Cryptographically ordered, immutable record of all administrative decisions and stage transitions',
        };
      case '/admin/rules':
        return {
          title: 'Configurable Regulatory Rules Register',
          subtitle: 'Handbook citations, SLA parameters, and statutory transition rules (APH 2024–27)',
        };
      default:
        return {
          title: 'Portal Console',
          subtitle: 'AICTE Approval Workflow Automation & Compliance Management System',
        };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-slate-900 selection:bg-gov-navy-800 selection:text-white">
      {/* 1. Indian Flag National Tricolor Stripe */}
      <div className="tricolor-stripe"></div>

      {/* 2. Official Government Accessibility & Identity Header */}
      <div className="bg-[#07152B] text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 border-b border-gov-navy-800">
        <div className="w-full max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Flag & Government / Ministry Identity */}
          <div className="flex items-center space-x-3">
            <IndiaFlag width={22} height={14} />
            <div className="flex items-center space-x-2 font-medium">
              <span className="font-semibold text-white tracking-wide">भारत सरकार</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-200">Government of India</span>
              <span className="hidden md:inline text-slate-500">•</span>
              <span className="hidden md:inline text-slate-300">शिक्षा मंत्रालय (Ministry of Education)</span>
            </div>
            <span className="hidden lg:inline px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold text-[10px]">
              SIH 26262 Prototype
            </span>
          </div>

          {/* Right: Accessibility Controls & Language */}
          <div className="flex items-center space-x-4 text-slate-300">
            {/* Font Resizing */}
            <div className="flex items-center space-x-1 border border-slate-700 rounded px-1.5 py-0.5 bg-slate-900/60">
              <button
                onClick={() => changeFontSize(-0.05)}
                className="hover:text-white px-1 font-bold text-[10px]"
                title="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={resetFontSize}
                className="hover:text-white px-1 font-semibold text-[10px] text-amber-300"
                title="Reset font size"
              >
                A
              </button>
              <button
                onClick={() => changeFontSize(0.05)}
                className="hover:text-white px-1 font-bold text-[11px]"
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Language Switcher */}
            <button
              onClick={() => setSelectedLang(selectedLang === 'EN' ? 'HI' : 'EN')}
              className="flex items-center space-x-1 hover:text-white font-medium"
            >
              <Languages className="w-3.5 h-3.5 text-gov-saffron-400" />
              <span>{selectedLang === 'EN' ? 'English' : 'हिन्दी'}</span>
            </button>

            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-300 font-mono">
              Academic Cycle: <strong>2026–2027</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Official Ministry & Council Header Banner */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8 shadow-sm">
        <div className="w-full max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Dual Emblem Branding */}
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <NavLink to="/dashboard" className="flex items-center space-x-3.5 group">
              <CouncilEmblem size={58} className="group-hover:scale-105 transition-transform" />
              <div>
                <h2 className="text-[11px] font-bold text-[#8B1A10] uppercase tracking-wide">
                  अखिल भारतीय तकनीकी शिक्षा परिषद
                </h2>
                <h1 className="text-base sm:text-lg font-extrabold text-gov-navy-950 tracking-tight leading-tight">
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                </h1>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="font-extrabold text-xs text-gov-navy-800 tracking-wider">
                    PRAVAH
                  </span>
                  <span className="text-[11px] text-slate-600 hidden sm:inline">
                    — Approval Workflow Automation & Compliance Management System
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-gov-saffron-100 text-gov-saffron-800 border border-gov-saffron-300 font-bold uppercase">
                    SIH PS 26262
                  </span>
                </div>
              </div>
            </NavLink>
          </div>

          {/* Quick Header Search Bar & Authorized Officer Profile */}
          <div className="flex items-center justify-between md:justify-end space-x-4 w-full md:w-auto">
            {/* Search Input with Command Palette trigger */}
            <div
              onClick={() => setCommandPaletteOpen(true)}
              className="relative w-full sm:w-80 cursor-pointer"
            >
              <input
                type="text"
                readOnly
                placeholder="Search or press Ctrl + K..."
                className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 pl-9 pr-16 text-xs text-slate-900 placeholder-slate-500 cursor-pointer hover:border-gov-navy-600 focus:outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <kbd className="absolute right-2 top-2 text-[10px] font-mono text-slate-500 bg-slate-200/80 border border-slate-300 rounded px-1.5 py-0.5">
                Ctrl K
              </kbd>
            </div>

            {/* Notification Bell */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-md border border-slate-200 text-slate-700 hover:text-gov-navy-900 hover:bg-slate-100 relative transition"
                aria-label="View alerts"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white"></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800">Operational Notices (3 Critical)</span>
                    <button
                      className="text-[11px] text-gov-navy-700 hover:underline"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto text-xs py-1">
                    <div className="py-2 space-y-1">
                      <p className="font-semibold text-rose-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-rose-600" /> EVC Report Overdue (+114h)
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Ganga Valley College of Architecture inspection report overdue by 4.7 days.
                      </p>
                    </div>
                    <div className="py-2 space-y-1">
                      <p className="font-semibold text-amber-700 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-600" /> Land Lease Expiry (52 Days)
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Sahyadri College 30-year registered lease expiring in 52 days.
                      </p>
                    </div>
                    <div className="py-2 space-y-1">
                      <p className="font-semibold text-rose-700 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-600" /> NBA Accreditation Lapsed
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Kalinga Institute of Pharmacy intake increase blocked by expired accreditation.
                      </p>
                    </div>
                  </div>
                  <NavLink
                    to="/document-validity"
                    onClick={() => setNotificationsOpen(false)}
                    className="block text-center text-xs font-semibold text-gov-navy-800 pt-2 border-t border-slate-100 hover:text-gov-navy-950"
                  >
                    View All Priority Alerts &rarr;
                  </NavLink>
                </div>
              )}
            </div>

            {/* Officer Profile Dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 text-left p-1.5 rounded-md border border-slate-200 hover:border-gov-navy-700 hover:bg-slate-50 transition text-xs"
              >
                <div className="w-8 h-8 rounded-full bg-gov-navy-900 text-amber-400 flex items-center justify-center font-bold text-xs ring-1 ring-amber-400/40">
                  {currentUser?.name?.charAt(0) || 'O'}
                </div>
                <div className="hidden lg:block">
                  <p className="font-bold text-slate-900 leading-tight">{currentUser?.name || 'Officer'}</p>
                  <p className="text-[10px] text-gov-saffron-700 font-semibold truncate max-w-[130px]">
                    {currentUser?.role ? currentUser.role.replace(/_/g, ' ') : 'OFFICER'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 text-xs">
                    <p className="text-slate-500 font-medium">Logged in Officer:</p>
                    <p className="font-bold text-slate-900">{currentUser?.name || 'Officer'}</p>
                    <p className="text-[11px] text-slate-600">{currentUser?.designation || 'Technical Officer'}</p>
                    <p className="text-[10px] text-gov-navy-800 font-medium mt-0.5">{currentUser?.region || 'National Scope'}</p>
                  </div>

                  {/* Development Persona Simulator: Isolated behind DEV configuration */}
                  {import.meta.env.DEV && (
                    <div className="px-3 py-2 text-xs border-b border-slate-100 bg-amber-50/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                          Dev Persona Simulator
                        </span>
                        <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-semibold">DEV ONLY</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-1.5">
                        Authenticates via backend Argon2id & sets HttpOnly cookie session.
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {Object.entries(PRESET_USERS).map(([roleKey, profile]) => (
                          <button
                            key={roleKey}
                            onClick={async () => {
                              try {
                                await switchRole(roleKey as UserRole);
                              } catch {
                                // Handled in AuthContext
                              }
                              setUserDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between ${
                              currentUser?.role === roleKey
                                ? 'bg-gov-navy-900 text-white font-semibold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="truncate">{profile.name}</span>
                            <span className="text-[10px] opacity-75 font-mono uppercase">
                              {roleKey.split('_')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-1 px-2">
                    <button
                      onClick={async () => {
                        await logout();
                        setUserDropdownOpen(false);
                        navigate('/login');
                      }}
                      className="w-full text-left px-3 py-1.5 rounded text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-1.5 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Officer Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 4. Official "LATEST UPDATES / त्वरित सूचनाएं" Marquee Ticker Bar (like UdyamMitra) */}
      <div className="bg-[#FFF8EE] border-y border-[#F3E2CB] py-2 px-4 sm:px-8 flex items-center overflow-hidden">
        <div className="w-full max-w-[1720px] mx-auto flex items-center">
          {/* Badge */}
          <div className="flex items-center space-x-2 bg-[#D97706] text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex-shrink-0 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span>Latest Updates</span>
          </div>

          {/* Scrolling Ticker Text */}
          <div className="flex-1 overflow-hidden ml-3 relative">
            <div
              className={`ticker-track text-xs text-slate-800 font-medium ${
                tickerPaused ? '[animation-play-state:paused]' : ''
              }`}
            >
              <span className="mx-4">
                • <strong>AICTE Approval Process 2026–2027</strong>: Scrutiny desk processing active in accordance with APH 2024–25 to 2026–27 regulations.
              </span>
              <span className="mx-4">
                • <strong>SLA Mandate</strong>: Strict 7-day turnaround for Scrutiny and Re-Scrutiny verification per AICTE Act norms.
              </span>
              <span className="mx-4">
                • <strong>EVC Inspection 48h Rule</strong>: Expert Visit Committee conveners must submit signed geo-tagged observation reports within 48 hours.
              </span>
              <span className="mx-4">
                • <strong>Land Lease Validity</strong>: Institutions holding &lt;30 years registered lease must furnish renewal registration to avoid intake sanction freeze.
              </span>
              <span className="mx-4">
                • <strong>Time-Bound Undertakings</strong>: 90-day conditional approvals approaching grace deadline flagged for automatic show-cause notice.
              </span>
              {/* Duplicate for infinite loop */}
              <span className="mx-4">
                • <strong>AICTE Approval Process 2026–2027</strong>: Scrutiny desk processing active in accordance with APH 2024–25 to 2026–27 regulations.
              </span>
              <span className="mx-4">
                • <strong>SLA Mandate</strong>: Strict 7-day turnaround for Scrutiny and Re-Scrutiny verification per AICTE Act norms.
              </span>
            </div>
          </div>

          {/* Pause / Play Button */}
          <button
            onClick={() => setTickerPaused(!tickerPaused)}
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-[#F3E2CB] ml-2 flex-shrink-0"
            title={tickerPaused ? 'Play Ticker' : 'Pause Ticker'}
            aria-label="Toggle ticker animation"
          >
            {tickerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 5. Primary Full-Width Government Navigation Mega-Bar */}
      <nav
        aria-label="Main Navigation Bar"
        className="bg-[#0A1B38] text-white border-b-2 border-gov-saffron-500 sticky top-0 z-30 shadow-md"
      >
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 flex items-center justify-between">
          {/* Desktop Horizontal Navigation Items */}
          <div className="hidden lg:flex items-center space-x-1 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-2.5 rounded-md text-xs font-semibold transition-all border-b-2 ${
                      isActive
                        ? 'bg-gov-navy-800 text-amber-300 border-amber-400 font-bold shadow-inner'
                        : 'border-transparent text-slate-200 hover:bg-gov-navy-900 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0 opacity-90" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 animate-pulse"></span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="flex items-center justify-between w-full lg:w-auto py-2.5 lg:py-0">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider lg:hidden">
              Menu Navigation
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded text-slate-200 hover:text-white hover:bg-gov-navy-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Right Status Indicator */}
          <div className="hidden xl:flex items-center space-x-3 text-xs text-slate-300 py-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] text-slate-300 font-medium">Approval Engine Online</span>
            </span>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-gov-navy-950 border-t border-gov-navy-800 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded text-xs font-semibold ${
                      isActive ? 'bg-gov-navy-800 text-amber-300' : 'text-slate-200 hover:bg-gov-navy-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* 6. Main Content Area (Full Screen Utilization) */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs & Page Metadata Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-300 pb-3">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <NavLink to="/dashboard" className="hover:text-gov-navy-900 font-medium">
                मुख्य पृष्ठ (Home)
              </NavLink>
              <span>/</span>
              <span className="text-slate-700 font-semibold capitalize">
                {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gov-navy-950 tracking-tight">
              {meta.title}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">{meta.subtitle}</p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-xs font-semibold text-gov-navy-900 px-3 py-1 bg-white border border-slate-300 rounded shadow-sm">
              Jurisdiction: <strong>{currentUser?.region || 'National Scope'}</strong>
            </span>
          </div>
        </div>

        {/* Nested Page Component View */}
        <Outlet />
      </main>

      {/* 7. Official Indian Government Portal Footer */}
      <footer className="bg-[#0A1B38] text-white border-t-4 border-gov-saffron-500 mt-16 pt-8 pb-6 px-4 sm:px-8 text-xs">
        <div className="w-full max-w-[1720px] mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-gov-navy-800">
            {/* Col 1: Identity */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <CouncilEmblem size={44} />
                <div>
                  <p className="font-extrabold text-sm text-white">PRAVAH PORTAL</p>
                  <p className="text-[11px] text-amber-300">All India Council for Technical Education</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System. Developed for Smart India Hackathon Problem Statement 26262.
              </p>
            </div>

            {/* Col 2: Official Portals */}
            <div className="space-y-2">
              <p className="font-bold text-amber-400 text-xs uppercase tracking-wider">Related National Portals</p>
              <ul className="space-y-1 text-[11px] text-slate-300">
                <li><a href="https://www.aicte.gov.in" target="_blank" rel="noreferrer" className="hover:text-amber-300">AICTE Official Portal &rarr;</a></li>
                <li><a href="https://www.education.gov.in" target="_blank" rel="noreferrer" className="hover:text-amber-300">Ministry of Education, GoI &rarr;</a></li>
                <li><a href="https://www.nbaind.org" target="_blank" rel="noreferrer" className="hover:text-amber-300">National Board of Accreditation (NBA) &rarr;</a></li>
                <li><a href="https://sih.gov.in" target="_blank" rel="noreferrer" className="hover:text-amber-300">Smart India Hackathon (SIH 2026) &rarr;</a></li>
              </ul>
            </div>

            {/* Col 3: Regulatory Compliance */}
            <div className="space-y-2">
              <p className="font-bold text-amber-400 text-xs uppercase tracking-wider">Statutory Directives</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Regulated under the All India Council for Technical Education Act 1987 (Act 52 of 1987) and Approval Process Handbook 2024–25 to 2026–27. Decision support for statutory regional committees.
              </p>
            </div>

            {/* Col 4: Prototype Disclaimer */}
            <div className="space-y-2">
              <p className="font-bold text-amber-400 text-xs uppercase tracking-wider">Security & Verification</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Prototype demonstration backed by deterministic synthetic dataset. Autonomous regulatory approval prohibited. All administrative actions cryptographically logged.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <p>© 2026 All India Council for Technical Education (AICTE). All Rights Reserved.</p>
            <p>Designed per Guidelines for Indian Government Websites (GIGW) | Best viewed in modern browsers.</p>
          </div>
        </div>
      </footer>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};

