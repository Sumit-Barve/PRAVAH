import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GeometricMark } from '../components/common/GeometricMark';
import { useAuth, PRESET_USERS } from '../context/AuthContext';
import { UserRole } from '@saksham/shared';
import {
  Building2,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Mail,
  UserPlus,
  HelpCircle,
  FileCheck,
  Landmark,
} from 'lucide-react';
import './LoginPage.css';

/**
 * Decorative hero illustration: abstract institutional building, 24-spoke wheel motif,
 * dot grid and softly floating geometric shapes. Pure inline SVG for fast loading.
 */
const HeroArt: React.FC = () => (
  <svg
    className="lp-hero-art"
    viewBox="0 0 800 900"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <pattern id="lp-dots" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.1" fill="#ffffff" fillOpacity="0.09" />
      </pattern>
      <linearGradient id="lp-fade-bottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#06152d" stopOpacity="0" />
        <stop offset="1" stopColor="#06152d" stopOpacity="0.85" />
      </linearGradient>
    </defs>

    <rect width="800" height="900" fill="url(#lp-dots)" />

    {/* 24-spoke wheel motif */}
    <g className="lp-wheel" transform="translate(600 210)" fill="none" stroke="#ffffff" strokeOpacity="0.1">
      <circle r="150" strokeWidth="1.5" />
      <circle r="132" strokeWidth="1" />
      <circle r="26" strokeWidth="1.5" />
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="0"
          y1="-30"
          x2="0"
          y2="-130"
          strokeWidth="1"
          transform={`rotate(${i * 15})`}
        />
      ))}
    </g>

    {/* Floating geometric shapes */}
    <g>
      <rect
        className="lp-float"
        style={{ ['--lp-rot' as string]: '12deg' }}
        x="90"
        y="150"
        width="46"
        height="46"
        rx="6"
        fill="none"
        stroke="#f59e0b"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <polygon
        className="lp-float lp-float-b"
        style={{ ['--lp-rot' as string]: '0deg' }}
        points="690,470 724,530 656,530"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      <circle
        className="lp-float lp-float-c"
        cx="170"
        cy="470"
        r="14"
        fill="#059669"
        fillOpacity="0.35"
      />
      <rect
        className="lp-float lp-float-c"
        style={{ ['--lp-rot' as string]: '45deg' }}
        x="470"
        y="95"
        width="22"
        height="22"
        fill="#f59e0b"
        fillOpacity="0.28"
      />
    </g>

    {/* Abstract institutional building: pediment, columns, plinth steps */}
    <g fill="#ffffff" fillOpacity="0.07" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1">
      <polygon points="150,640 400,520 650,640" />
      <rect x="150" y="640" width="500" height="22" />
      {[190, 262, 334, 406, 478, 550].map((x) => (
        <rect key={x} x={x} y="662" width="40" height="150" />
      ))}
      <rect x="130" y="812" width="540" height="18" />
      <rect x="110" y="830" width="580" height="18" />
      <rect x="90" y="848" width="620" height="52" />
    </g>
    <circle cx="400" cy="610" r="16" fill="none" stroke="#f59e0b" strokeOpacity="0.5" strokeWidth="1.5" />

    <rect y="560" width="800" height="340" fill="url(#lp-fade-bottom)" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { login, authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Selected entry portal view (Institution vs Officer)
  const [activePortal, setActivePortal] = useState<'INSTITUTION' | 'OFFICER'>('INSTITUTION');
  const [emailOrUsername, setEmailOrUsername] = useState('director@apextech.ac.in');
  const [password, setPassword] = useState('AicteDev@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handlePortalSwitch = (portal: 'INSTITUTION' | 'OFFICER') => {
    setActivePortal(portal);
    clearError();
    setLocalError(null);

    if (portal === 'INSTITUTION') {
      setEmailOrUsername('director@apextech.ac.in');
      setPassword('AicteDev@2026!');
    } else {
      setEmailOrUsername('rk.sharma@aicte.gov.in');
      setPassword('AicteDev@2026!');
    }
  };

  const handleQuickFill = (role: UserRole) => {
    const persona = PRESET_USERS[role];
    if (persona) {
      setEmailOrUsername(persona.username);
      setPassword('AicteDev@2026!');
      clearError();
      setLocalError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password.trim()) {
      setLocalError('Please enter your email/username and password.');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      const user = await login(emailOrUsername.trim(), password);

      // Resolve intended redirect according to user role:
      const fromPath = (location.state as any)?.from?.pathname;
      if (user.role === 'INSTITUTION_USER') {
        if (fromPath && fromPath.startsWith('/institution')) {
          navigate(fromPath, { replace: true });
        } else {
          navigate('/institution/dashboard', { replace: true });
        }
      } else {
        if (fromPath && !fromPath.startsWith('/institution') && fromPath !== '/login') {
          navigate(fromPath, { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-gov-navy-800 selection:text-white">
      {/* Tricolor ribbon */}
      <div className="tricolor-stripe" aria-hidden="true" />

      {/* Prototype Environment Notice */}
      <div className="bg-amber-50 border-b border-amber-200 py-1.5 px-4 text-center">
        <div className="inline-flex items-center space-x-2 text-xs text-amber-900 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>PRAVAH Prototype Environment — SIH Problem Statement 26262</span>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1.05fr_1fr]">
        {/* ------------------------- Brand / hero panel ------------------------- */}
        <section className="lp-hero px-6 py-8 sm:px-10 lg:px-14 lg:py-14 flex flex-col justify-between">
          <HeroArt />

          <div className="lp-rise lp-rise-1 flex items-center gap-3">
            <div className="bg-white/95 rounded-xl p-1.5 shadow-md">
              <GeometricMark size={44} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                All India Council for Technical Education
              </p>
              <p className="text-xs text-slate-300">Digital Approval &amp; Compliance Platform</p>
            </div>
          </div>

          <div className="lp-rise lp-rise-2 mt-8 lg:mt-0 max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              PRAVAH
            </h1>
            <p className="mt-2 text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-widest">
              AICTE Approval Workflow &amp; Compliance Management System
            </p>
            <p className="mt-3 text-sm text-slate-300 italic font-serif">
              “Intelligent Scrutiny. Automated Workflows. Transparent Compliance.”
            </p>

            <div className="hidden lg:flex flex-wrap gap-2 mt-7">
              <span className="lp-chip">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                Statutory document scrutiny
              </span>
              <span className="lp-chip">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                Role-based secure access
              </span>
              <span className="lp-chip">
                <Landmark className="w-3.5 h-3.5 text-sky-300" />
                APH 2024–27 aligned
              </span>
            </div>
          </div>

          <p className="hidden lg:block lp-rise lp-rise-3 text-[11px] text-slate-400 max-w-md leading-relaxed">
            Statutory approval powers remain vested in the authorized AICTE committees. This portal
            supports, and does not replace, their decisions.
          </p>
        </section>

        {/* --------------------------- Sign-in panel --------------------------- */}
        <main className="flex flex-col justify-center py-10 px-4 sm:px-8 lg:px-12 bg-slate-50">
          <div className="w-full max-w-md mx-auto lp-rise lp-rise-2">
            {/* Portal Selector Toggle */}
            <div
              className="lp-tabs bg-slate-200/80 p-1 rounded-xl grid grid-cols-2 gap-1 mb-5 border border-slate-300"
              role="tablist"
              aria-label="Select portal"
            >
              <span className="lp-tab-indicator" data-portal={activePortal} aria-hidden="true" />
              <button
                type="button"
                role="tab"
                aria-selected={activePortal === 'INSTITUTION'}
                onClick={() => handlePortalSwitch('INSTITUTION')}
                className={`relative z-10 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                  activePortal === 'INSTITUTION'
                    ? 'text-gov-navy-950'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Institution Portal</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePortal === 'OFFICER'}
                onClick={() => handlePortalSwitch('OFFICER')}
                className={`relative z-10 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                  activePortal === 'OFFICER'
                    ? 'text-gov-navy-950'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>AICTE Officer Portal</span>
              </button>
            </div>

            {/* Central Sign-in Card */}
            <div className="lp-card bg-white py-8 px-6 border border-slate-200 rounded-2xl sm:px-9 border-t-4 border-t-gov-navy-900">
              <div className="mb-6 lp-fade" key={activePortal}>
                <h2 className="text-lg font-bold text-slate-900">
                  {activePortal === 'INSTITUTION' ? 'Sign in to Institution Portal' : 'AICTE Officer Authorization'}
                </h2>
                <span className="lp-accent mt-1.5" aria-hidden="true" />
                <p className="text-xs text-slate-500 mt-2">
                  {activePortal === 'INSTITUTION'
                    ? 'Manage university/polytechnic approval applications and compliance'
                    : 'Scrutiny officers, regional bureaus, EVC panels, and secretariat'}
                </p>
              </div>

              {/* Error Message */}
              {activeError && (
                <div
                  role="alert"
                  className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold">{activeError}</span>
                  </div>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="login-identifier" className="block text-xs font-semibold text-slate-700 mb-1">
                    {activePortal === 'INSTITUTION' ? 'Official Institutional Email' : 'Officer Email / NIC User ID'}
                  </label>
                  <div className="relative">
                    <input
                      id="login-identifier"
                      type="text"
                      required
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder={activePortal === 'INSTITUTION' ? 'director@college.edu.in' : 'officer@aicte.gov.in'}
                      className="lp-input w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                      Password / Digital Token
                    </label>
                    {activePortal === 'INSTITUTION' && (
                      <Link
                        to="/institution/forgot-password"
                        className="text-xs text-blue-700 hover:text-blue-900 font-medium hover:underline"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="lp-input w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="lp-submit w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-gov-navy-950 hover:bg-gov-navy-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-navy-900 shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Authenticating...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1.5">
                        <span>Sign In Securely</span>
                        <ArrowRight className="lp-arrow w-4 h-4" />
                      </span>
                    )}
                  </button>
                </div>
              </form>

              {/* Institution Registration Link */}
              {activePortal === 'INSTITUTION' && (
                <div className="lp-fade mt-6 pt-5 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-600 mb-2">
                    New institution representative or unassociated PID?
                  </p>
                  <Link
                    to="/institution/signup"
                    className="inline-flex items-center justify-center space-x-1.5 w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition"
                  >
                    <UserPlus className="w-4 h-4 text-blue-600" />
                    <span>Register Institutional Representative</span>
                  </Link>
                </div>
              )}

              {/* Demo Quick-Fill Presets for Seamless SIH Demo */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Prototype Demo Credentials
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    Argon2id Hash Verified
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 lp-fade" key={`demo-${activePortal}`}>
                  {activePortal === 'INSTITUTION' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('INSTITUTION_USER')}
                        className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition text-[11px]"
                      >
                        <div className="font-semibold text-slate-800">Apex Institute</div>
                        <div className="text-slate-500 text-[10px]">director@apextech.ac.in</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailOrUsername('principal@sahyadri.ac.in');
                          setPassword('AicteDev@2026!');
                        }}
                        className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition text-[11px]"
                      >
                        <div className="font-semibold text-slate-800">Sahyadri College</div>
                        <div className="text-slate-500 text-[10px]">principal@sahyadri.ac.in</div>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('SCRUTINY_OFFICER')}
                        className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition text-[11px]"
                      >
                        <div className="font-semibold text-slate-800">Dr. R.K. Sharma</div>
                        <div className="text-slate-500 text-[10px]">Scrutiny Officer</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('REGIONAL_OFFICER')}
                        className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition text-[11px]"
                      >
                        <div className="font-semibold text-slate-800">Dr. Neelesh Verma</div>
                        <div className="text-slate-500 text-[10px]">Regional Officer (CRO)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('EVC_EXPERT')}
                        className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition text-[11px]"
                      >
                        <div className="font-semibold text-slate-800">Prof. C.M. Rao</div>
                        <div className="text-slate-500 text-[10px]">EVC Committee</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('MEMBER_SECRETARY')}
                        className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition text-[11px]"
                      >
                        <div className="font-semibold text-slate-800">Member Secretary</div>
                        <div className="text-slate-500 text-[10px]">National Bureau</div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p>
          PRAVAH Approval &amp; Compliance Workflow Platform • All AICTE statutory powers remain vested in authorized committee authorities.
        </p>
      </footer>
    </div>
  );
};
