import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { GeometricMark } from '../../components/common/GeometricMark';
import { verifyEmail } from '../../services/authService';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async (tokenToUse: string) => {
    if (!tokenToUse.trim()) {
      setErrorMessage('Verification token is missing.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      await verifyEmail(tokenToUse.trim());
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Email verification failed. The link may have expired.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

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
            Institutional Email Verification
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 text-center space-y-4">
          {isSuccess ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Email Address Verified!
              </h2>
              <p className="text-xs text-slate-600">
                Your institutional representative credentials have been authenticated. You may now sign in to PRAVAH Institution Portal.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-lg bg-gov-navy-950 text-white text-xs font-bold hover:bg-gov-navy-900 shadow-md transition"
                >
                  <span>Sign In to Institution Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Verify Representative Account
                </h2>
                {emailFromUrl && (
                  <p className="text-xs text-slate-500 mt-1">
                    Verifying email: <strong>{emailFromUrl}</strong>
                  </p>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cryptographic Verification Token
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste 64-character verification token"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerify(token)}
                disabled={isVerifying || !token.trim()}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-gov-navy-950 text-white text-xs font-bold hover:bg-gov-navy-900 transition disabled:opacity-50"
              >
                {isVerifying ? <span>Verifying...</span> : <span>Confirm Email Verification</span>}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500">
        AICTE PRAVAH Identity Verification Service
      </footer>
    </div>
  );
};
