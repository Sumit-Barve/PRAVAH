import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GeometricMark } from '../../components/common/GeometricMark';
import { registerInstitution, fetchDevEmails } from '../../services/authService';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

export const InstitutionSignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    institutionName: '',
    trustName: '',
    state: 'Maharashtra',
    district: '',
    permanentInstituteId: '',
    representativeName: '',
    email: '',
    mobilePhone: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ email: string; message: string } | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!formData.acceptedTerms) {
      setErrorMessage('Please accept the AICTE regulatory declarations to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerInstitution({
        institutionName: formData.institutionName.trim(),
        trustName: formData.trustName.trim(),
        state: formData.state,
        district: formData.district.trim() || undefined,
        permanentInstituteId: formData.permanentInstituteId.trim() || undefined,
        representativeName: formData.representativeName.trim(),
        email: formData.email.trim(),
        mobilePhone: formData.mobilePhone.trim() || undefined,
        password: formData.password,
      });

      setSuccessInfo({ email: res.email, message: res.message });

      // In development, retrieve token from dev outbox for instant verification convenience
      const outbox = await fetchDevEmails();
      const match = outbox.find((item) => item.to.toLowerCase() === res.email.toLowerCase());
      if (match && match.token) {
        setDevToken(match.token);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check form inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-between selection:bg-gov-navy-800 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <GeometricMark size={48} />
          </div>
          <h1 className="text-2xl font-black text-gov-navy-950 tracking-tight">
            PRAVAH
          </h1>
          <p className="text-xs font-bold text-gov-navy-800 uppercase tracking-widest">
            Institutional Representative Onboarding
          </p>
        </div>

        {/* Success View */}
        {successInfo ? (
          <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Registration Received!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              A verification link has been dispatched to <strong>{successInfo.email}</strong>. Please confirm your email address to complete activation.
            </p>

            {devToken && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-2">
                <div className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Prototype Demonstration Catcher</span>
                </div>
                <p>
                  In this local demonstration environment, your verification token was intercepted:
                </p>
                <div className="font-mono bg-white p-2 rounded border border-amber-300 break-all text-[11px]">
                  {devToken}
                </div>
                <Link
                  to={`/institution/verify-email?token=${devToken}&email=${encodeURIComponent(successInfo.email)}`}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 underline"
                >
                  <span>Click here to verify email directly &rarr;</span>
                </Link>
              </div>
            )}

            <div className="pt-4 flex justify-center space-x-3">
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-lg bg-gov-navy-950 text-white text-xs font-bold hover:bg-gov-navy-900 transition"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                Register Authorized Representative
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized heads of institutions, directors, and compliance officers
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Name of Institution *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleChange}
                      placeholder="e.g. Pune Institute of Advanced Technology"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sponsoring Trust / Society / University *
                  </label>
                  <input
                    type="text"
                    required
                    name="trustName"
                    value={formData.trustName}
                    onChange={handleChange}
                    placeholder="e.g. Vidya Vikas Educational Charitable Trust"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State / UT *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Telangana">Telangana</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Permanent Institute ID (PID, if existing)
                  </label>
                  <input
                    type="text"
                    name="permanentInstituteId"
                    value={formData.permanentInstituteId}
                    onChange={handleChange}
                    placeholder="e.g. 1-4829104 (or leave blank if new)"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Authorized Representative Credentials
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Representative Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      name="representativeName"
                      value={formData.representativeName}
                      onChange={handleChange}
                      placeholder="e.g. Dr. Sunil Kulkarni"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="mobilePhone"
                      value={formData.mobilePhone}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Institutional Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="principal@college.edu.in"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Account activation notices and deficiency intimations will be delivered to this authoritative address.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password (min 8 chars) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    name="acceptedTerms"
                    checked={formData.acceptedTerms}
                    onChange={handleChange}
                    className="mt-0.5 rounded border-slate-300 text-gov-navy-950 focus:ring-gov-navy-600"
                  />
                  <span>
                    I hereby certify that I am the authorized representative of the applicant institution and agree to adhere to the statutory provisions of the AICTE Act 1987 and Approval Process Handbook regulations.
                  </span>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-gov-navy-950 text-white text-sm font-bold hover:bg-gov-navy-900 shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Registering Institution...</span>
                  ) : (
                    <span>Complete Institutional Registration</span>
                  )}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold">
                Sign in to Portal
              </Link>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-center text-xs text-slate-500">
        PRAVAH AICTE Portal • Secure Institutional Registration Subsystem
      </footer>
    </div>
  );
};
