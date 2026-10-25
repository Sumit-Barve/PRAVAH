import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, AuthenticatedUser } from '@saksham/shared';
import {
  loginWithCredentials,
  fetchCurrentOfficerProfile,
  logoutOfficer,
} from '../services/authService';

export interface UserProfile extends AuthenticatedUser {
  name: string;
  designation: string;
}

export interface DemoPersona {
  role: UserRole;
  username: string;
  name: string;
  designation: string;
  region: string;
}

export const PRESET_USERS: Record<UserRole, DemoPersona> = {
  INSTITUTION_USER: {
    role: 'INSTITUTION_USER',
    username: 'director@apextech.ac.in',
    name: 'Dr. Vikram Malhotra',
    designation: 'Institutional Representative (Apex Institute)',
    region: 'North Western Regional Office (NWRO)',
  },
  SCRUTINY_OFFICER: {
    role: 'SCRUTINY_OFFICER',
    username: 'rk.sharma@aicte.gov.in',
    name: 'Dr. R. K. Sharma',
    designation: 'Senior Scrutiny Committee Expert',
    region: 'North Western Regional Office (NWRO)',
  },
  REGIONAL_OFFICER: {
    role: 'REGIONAL_OFFICER',
    username: 'neelesh.verma@aicte.gov.in',
    name: 'Dr. Neelesh Verma',
    designation: 'Regional Officer (RO-Central)',
    region: 'Central Regional Office (CRO)',
  },
  EVC_EXPERT: {
    role: 'EVC_EXPERT',
    username: 'cm.rao@aicte.gov.in',
    name: 'Prof. C. M. Rao',
    designation: 'Expert Visit Committee Panelist',
    region: 'South Western Regional Office (SWRO)',
  },
  EVC_CONVENER: {
    role: 'EVC_CONVENER',
    username: 'cm.rao@aicte.gov.in',
    name: 'Prof. C. M. Rao',
    designation: 'EVC Committee Convener',
    region: 'South Western Regional Office (SWRO)',
  },
  SAC_SHC_MEMBER: {
    role: 'SAC_SHC_MEMBER',
    username: 'bn.panda@aicte.gov.in',
    name: 'Justice (Retd.) B. N. Panda',
    designation: 'Standing Appellate Committee Chairman',
    region: 'National Headquarters, New Delhi',
  },
  MEMBER_SECRETARY: {
    role: 'MEMBER_SECRETARY',
    username: 'rajendra.prasad@aicte.gov.in',
    name: 'Prof. Rajendra Prasad',
    designation: 'Member Secretary / Bureau Head',
    region: 'Council Headquarters, New Delhi',
  },
  SYSTEM_ADMIN: {
    role: 'SYSTEM_ADMIN',
    username: 'itadmin.saksham@aicte.gov.in',
    name: 'Administrative IT Cell',
    designation: 'Platform Administrator',
    region: 'AICTE e-Governance Division',
  },
};

const DEFAULT_DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || 'AicteDev@2026!';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  authError: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapToProfile(user: AuthenticatedUser): UserProfile {
  let designation = user.department || user.role.replace(/_/g, ' ');
  if (user.role === 'INSTITUTION_USER') {
    designation = user.institutionName
      ? `${user.institutionName} (PID: ${user.permanentInstituteId || 'Pending'})`
      : 'Institutional Representative';
  }

  return {
    ...user,
    name: user.fullName || user.username,
    designation,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Restore authenticated session from backend on page load / reload
  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await fetchCurrentOfficerProfile();
      setCurrentUser(mapToProfile(user));
    } catch {
      // Session missing, expired, or invalid
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (username: string, password?: string): Promise<UserProfile> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const effectivePassword = password || DEFAULT_DEMO_PASSWORD;
      const user = await loginWithCredentials(username, effectivePassword);
      const profile = mapToProfile(user);
      setCurrentUser(profile);
      return profile;
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      setAuthError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutOfficer();
    } catch {
      // Proceed with local clearance even if network fails
    } finally {
      setCurrentUser(null);
      setAuthError(null);
    }
  };

  /**
   * Prototype Dev Persona Switcher: Authenticates through the real backend
   */
  const switchRole = async (role: UserRole) => {
    const persona = PRESET_USERS[role];
    if (persona) {
      await login(persona.username, DEFAULT_DEMO_PASSWORD);
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        switchRole,
        authError,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
