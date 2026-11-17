import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  CreditCard,
  BadgeDollarSign,
  History,
  Receipt,
  CalendarCheck,
  AlertTriangle,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Award,
  BookOpen,
  Calendar,
  FileCheck2,
  FileText,
  MessageSquare,
  Home,
  Bus,
  GraduationCap,
  ClipboardList,
  UploadCloud,
  Layers,
  Bell
} from 'lucide-react';
import { BRANDING } from '../config/branding';
import { InstallAppButton } from '../components/pwa/InstallAppButton';
import { NotificationDropdown } from '../components/common/NotificationDropdown';

export const DashboardLayout = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/timetable', label: 'Class Timetable', icon: Calendar },
    { to: '/attendance', label: 'Attendance Register', icon: CalendarCheck },
    { to: '/results', label: 'Results & SGPA', icon: FileCheck2 },
    { to: '/study-materials', label: 'Study Material & Notes', icon: BookOpen },
    { to: '/fees', label: 'Fees & Installments', icon: CreditCard },
    { to: '/pay-fees', label: 'Pay Fees Online', icon: BadgeDollarSign, highlight: true },
    { to: '/payments', label: 'Payment History', icon: History },
    { to: '/receipts', label: 'Fee Receipts', icon: Receipt },
    { to: '/documents', label: 'Admit Card & Certificates', icon: Award, special: true },
    { to: '/hostel', label: 'Hostel Accommodation', icon: Home, highlight: true },
    { to: '/transport', label: 'Campus Transport', icon: Bus },
    { to: '/fines', label: 'Fines & Penalties', icon: AlertTriangle },
    { to: '/notices', label: 'College Notices', icon: Bell },
    { to: '/complaints', label: 'Support & Complaints', icon: MessageSquare }
  ];

  const facultyNavItems = [
    { to: '/faculty/dashboard', label: 'Faculty Desk', icon: LayoutDashboard },
    { to: '/faculty/classes', label: 'Assigned Classes', icon: Users },
    { to: '/faculty/attendance', label: 'Mark Attendance', icon: CalendarCheck, highlight: true },
    { to: '/faculty/marks', label: 'Marks & Internal Entry', icon: FileCheck2 },
    { to: '/faculty/timetable', label: 'My Timetable', icon: Calendar },
    { to: '/faculty/materials', label: 'Notes & Assignments', icon: UploadCloud },
    { to: '/faculty/notices', label: 'Campus Notices', icon: Bell },
    { to: '/faculty/profile', label: 'My Faculty Profile', icon: User }
  ];

  const wardenNavItems = [
    { to: '/warden/dashboard', label: 'Warden Dashboard', icon: LayoutDashboard },
    { to: '/warden/hostel', label: 'Hostel Buildings', icon: Home },
    { to: '/warden/beds', label: 'Bed Inventory & Status', icon: Layers, highlight: true },
    { to: '/warden/applications', label: 'Hostel Applications', icon: FileText },
    { to: '/warden/allocations', label: 'Allocations & Vacating', icon: Users },
    { to: '/warden/payments', label: 'Hostel Fee Payments', icon: Receipt },
    { to: '/warden/complaints', label: 'Hostel Grievances', icon: MessageSquare },
    { to: '/warden/outings', label: 'Outing / Gate Passes', icon: CalendarCheck },
    { to: '/warden/notices', label: 'Hostel Notice Board', icon: Bell },
    { to: '/warden/reports', label: 'Occupancy Analytics', icon: BarChart3 },
    { to: '/warden/profile', label: 'Warden Profile', icon: User }
  ];

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Student Directory', icon: Users },
    { to: '/admin/wardens', label: 'Warden Management', icon: GraduationCap, highlight: true },
    { to: '/admin/faculty', label: 'Faculty Management', icon: GraduationCap },
    { to: '/admin/courses', label: 'Courses & Subjects', icon: Layers },
    { to: '/admin/timetable', label: 'Timetable Scheduling', icon: Calendar },
    { to: '/admin/exams', label: 'Exam Schedules', icon: ClipboardList },
    { to: '/admin/fees', label: 'Fees & Master Templates', icon: CreditCard },
    { to: '/admin/payments', label: 'Payment Ledger & Refunds', icon: History },
    { to: '/admin/attendance', label: 'Attendance Records', icon: CalendarCheck },
    { to: '/admin/fines', label: 'Disciplinary Fines', icon: AlertTriangle },
    { to: '/admin/reports', label: 'Financial Reports & CSV', icon: BarChart3 },
    { to: '/admin/notices', label: 'Notice Board Publisher', icon: Bell },
    { to: '/admin/complaints', label: 'Grievance Desk', icon: MessageSquare },
    { to: '/admin/hostel', label: 'Hostel Bed Allocation', icon: Home },
    { to: '/admin/transport', label: 'Transport Bus Routes', icon: Bus }
  ];

  let navItems = studentNavItems;
  if (role === 'ADMIN') navItems = adminNavItems;
  else if (role === 'WARDEN') navItems = wardenNavItems;
  else if (role === 'FACULTY') navItems = facultyNavItems;


  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <img 
              src={BRANDING.LOGO} 
              alt={BRANDING.LOGO_ALT} 
              className="h-11 w-11 object-contain drop-shadow-md rounded-full ring-1 ring-amber-400/40 p-0.5 bg-slate-900"
            />
            <div>
              <h1 className="text-xs font-black tracking-wider uppercase text-white leading-tight">
                {BRANDING.COLLEGE_NAME}
              </h1>
              <p className="text-[10px] font-semibold text-amber-400">
                ERP Portal &bull; {role}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card Banner */}
        <div className="m-4 rounded-xl bg-slate-800/80 p-3.5 border border-slate-700/60 flex items-center gap-3">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user?.fullName || user?.name || 'User'}
              className="h-10 w-10 rounded-lg object-cover border border-indigo-500/30"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-black border border-indigo-500/30">
              {(user?.fullName || user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate">
              {user?.fullName || user?.name || 'Authorized User'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {role === 'ADMIN'
                ? 'System Administrator'
                : role === 'WARDEN'
                ? `Chief Warden | ${user?.hostelAssigned || 'Campus Hostels'}`
                : role === 'FACULTY'
                ? `${user?.employeeId || 'Faculty'} | ${user?.department || 'Department'}`
                : `${user?.universityRollNumber || 'Student'} | Sem ${user?.semester || 1}`}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-4 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : item.special
                    ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                    : item.highlight
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : item.special ? 'text-amber-400' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-80" />}
              </NavLink>
            );
          })}
        </nav>

        {/* PWA Install Button in Sidebar */}
        <div className="px-4 py-2 border-t border-slate-800/60">
          <InstallAppButton variant="sidebar" />
        </div>

        {/* Campus Info & Sign Out Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <p className="text-[10px] text-slate-400 mb-3 px-1 leading-tight text-center">
            {BRANDING.ADDRESS}
          </p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-900 border border-slate-700/60 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-xs z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                {BRANDING.COLLEGE_NAME}
              </h2>
              <p className="text-[11px] text-slate-500">
                Institutional Academic & Administrative Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Install App Button in Top Navbar */}
            <InstallAppButton variant="header" />

            {/* Notification Center Popover */}
            <NotificationDropdown />

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Session 2024-2025</span>
            </div>

            <div className="flex items-center gap-3">
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user?.fullName || user?.name || 'User'}
                  className="h-9 w-9 rounded-full object-cover border border-indigo-200"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200">
                  {(user?.fullName || user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.fullName || user?.name}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {role} Account
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
