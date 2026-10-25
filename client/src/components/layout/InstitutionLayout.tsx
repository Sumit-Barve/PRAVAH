import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { GeometricMark } from '../common/GeometricMark';
import { useAuth } from '../../context/AuthContext';
import { getInstitutionNotifications, markNotificationAsRead } from '../../services/institutionService';
import { Notification } from '@saksham/shared';
import {
  Building2,
  FileText,
  ShieldCheck,
  User,
  Plus,
  Bell,
  LogOut,
  Menu,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

export const InstitutionLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const items = await getInstitutionNotifications();
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.isRead).length);
    } catch {
      // Fail silently for background notification poll
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.link) {
      setNotificationsOpen(false);
      navigate(notif.link);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/institution/dashboard', icon: Building2 },
    { name: 'Applications', path: '/institution/applications', icon: FileText },
    { name: 'Documents', path: '/institution/documents', icon: FileText },
    { name: 'Compliance', path: '/institution/compliance', icon: ShieldCheck },
    { name: 'Profile', path: '/institution/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 selection:bg-gov-navy-800 selection:text-white">
      {/* Top AICTE Statutory Bar */}
      <div className="bg-gov-navy-950 text-white text-[11px] py-1.5 px-4 sm:px-8 border-b border-gov-navy-900 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-medium tracking-wide">
            AICTE National Approval Portal • Institutional Interface
          </span>
        </div>
        <div className="flex items-center space-x-4 text-slate-300">
          <span className="hidden sm:inline">Academic Year: 2026–27</span>
          <span className="bg-gov-navy-800 px-2 py-0.5 rounded text-[10px] text-amber-300 font-mono font-bold">
            PID: {currentUser?.permanentInstituteId || 'Pending'}
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Brand & Institution Info */}
            <div className="flex items-center space-x-4">
              <Link to="/institution/dashboard" className="flex items-center space-x-3">
                <GeometricMark size={36} />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base font-black text-gov-navy-950 tracking-tight">PRAVAH</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold uppercase">
                      Institution
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 line-clamp-1">
                    {currentUser?.institutionName || 'Institutional Representative Portal'}
                  </p>
                </div>
              </Link>
            </div>

            {/* Middle: Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                        isActive
                          ? 'bg-gov-navy-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Actions, Notifications & Sign Out */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                to="/institution/applications/new"
                className="hidden sm:inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Application</span>
              </Link>

              {/* Notification Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative focus:outline-none"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Notifications & Deficiencies</span>
                      <span className="text-[10px] text-slate-500">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No notifications at this time.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition ${
                              !n.isRead ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-2">
                              {n.type === 'WARNING' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              ) : n.type === 'SUCCESS' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-900">{n.title}</p>
                                <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(n.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown / Sign Out */}
              <div className="border-l border-slate-200 pl-2 sm:pl-3 flex items-center space-x-2">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser?.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {currentUser?.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out of PRAVAH"
                  className="p-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            <div className="p-2 bg-slate-50 rounded-lg mb-2">
              <div className="text-xs font-bold text-slate-900">{currentUser?.institutionName}</div>
              <div className="text-[11px] text-slate-500 font-mono">PID: {currentUser?.permanentInstituteId}</div>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold ${
                      isActive ? 'bg-gov-navy-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <Link
              to="/institution/applications/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Application</span>
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Government Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            <strong>PRAVAH AICTE Portal</strong> • Approval Process Handbook (APH 2024–27 Compliance Subsystem)
          </div>
          <div className="text-[11px] text-slate-600">
            Intelligent Scrutiny • Automated Workflows • Transparent Compliance
          </div>
        </div>
      </footer>
    </div>
  );
};
