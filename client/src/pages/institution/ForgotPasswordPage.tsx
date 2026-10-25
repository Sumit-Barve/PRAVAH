import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GeometricMark } from '../../components/common/GeometricMark';
import { forgotPassword, fetchDevEmails } from '../../services/authService';
import { User, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await forgotPassword(email.trim());
      setIsSubmitted(true);

      const outbox = await fetchDevEmails();
      const match = outbox.find((item) => item.to.toLowerCase() === email.trim().toLowerCase());
      if (match && match.token) {
        setDevResetToken(match.token);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 selection:bg-gov-navy-800 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <GeometricMark size={48} />
          </div>
          <h1 className="text-2xl font-black text-gov-navy-950 tracking-tight">
            PRAVAH
          </h1>
          <p className="text-xs font-bold text-gov-navy-800 uppercase tracking-widest">
            Institutional Password Recovery
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Instructions Dispatched
              </h2>
              <p className="text-xs text-slate-600">
                If the institutional address <strong>{email}</strong> is registered on PRAVAH, a secure password reset link has been dispatched.
              </p>

              {devResetToken && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-1.5">
                  <div className="font-bold flex items-center space-x-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    <span>Demo Intercepted Reset Token</span>
                  </div>
                  <div className="font-mono bg-white p-2 rounded border border-amber-300 break-all text-[11px]">
                    {devResetToken}
                  </div>
                  <Link
                    to={`/institution/reset-password?token=${devResetToken}&email=${encodeURIComponent(email)}`}
                    className="inline-flex text-xs font-bold text-blue-700 hover:text-blue-900 underline"
                  >
                    Click to reset password directly &rarr;
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-gov-navy-950 text-white text-xs font-bold hover:bg-gov-navy-900 transition"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  Forgot Password
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Enter your registered institutional email to receive a password reset link.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@apextech.ac.in"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-gov-navy-950 text-white text-xs font-bold hover:bg-gov-navy-900 transition disabled:opacity-50"
                >
                  {isSubmitting ? <span>Sending Instructions...</span> : <span>Send Reset Instructions</span>}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500">
        AICTE PRAVAH Identity Verification Service
      </footer>
    </div>
  );
};
