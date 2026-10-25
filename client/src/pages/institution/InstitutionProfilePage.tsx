import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getInstitutionProfile, updateInstitutionProfile } from '../../services/institutionService';
import { Institution } from '@saksham/shared';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Save,
  AlertCircle,
} from 'lucide-react';

export const InstitutionProfilePage: React.FC = () => {
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<Institution | null>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const inst = await getInstitutionProfile();
        setProfile(inst);
        setContactEmail(inst.contactEmail || '');
        setContactPhone(inst.contactPhone || '');
        setAddress(inst.address || '');
        setDistrict(inst.district || '');
        setPincode(inst.pincode || '');
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await updateInstitutionProfile({
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        address: address.trim(),
        district: district.trim(),
        pincode: pincode.trim(),
      });
      setProfile(updated);
      setSuccessMsg('Institution contact details updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update institution profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading institution profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Institution Profile & Authorizations</h1>
        <p className="text-xs text-slate-500">
          Statutory record and authorized contact particulars for AICTE notifications
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Identity Cards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <Building2 className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">{profile?.name}</h2>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-xs font-mono font-bold text-gov-navy-950">
                PID: {profile?.permanentInstituteId}
              </span>
              <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                {profile?.isVerified ? 'Verified Institution' : 'Pending Authorization'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-500">Sponsoring Trust / Society:</span>
            <div className="font-bold text-slate-900 mt-0.5">{profile?.trustName}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-500">Institution Category:</span>
            <div className="font-bold text-slate-900 mt-0.5">{profile?.institutionType?.replace(/_/g, ' ')}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-500">Regional Bureau Jurisdiction:</span>
            <div className="font-bold text-slate-900 mt-0.5">{profile?.region?.replace(/_/g, ' ')}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-500">Current Representative:</span>
            <div className="font-bold text-slate-900 mt-0.5">{currentUser?.fullName} ({currentUser?.email})</div>
          </div>
        </div>
      </div>

      {/* Editable Contact Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Official Communication Particulars
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Institutional Email *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Contact Phone / Landline
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 20 25678900"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campus Postal Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Survey No. 42, Knowledge Park, Technology Corridor"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                District / City
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Pune"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Postal PIN Code
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="411007"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 py-2 px-5 rounded-lg bg-gov-navy-950 text-white text-xs font-bold hover:bg-gov-navy-900 shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
