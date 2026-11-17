import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PwaInstallProvider } from './context/PwaInstallContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { InstallHelpModal } from './components/pwa/InstallHelpModal';
import { OfflineBanner } from './components/pwa/OfflineBanner';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { FacultyRegister } from './pages/auth/FacultyRegister';
import { WardenRegister } from './pages/auth/WardenRegister';
import { WardenLogin } from './pages/auth/WardenLogin';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentFees } from './pages/student/StudentFees';
import { PayFees } from './pages/student/PayFees';
import { PaymentHistory } from './pages/student/PaymentHistory';
import { Receipts } from './pages/student/Receipts';
import { Attendance } from './pages/student/Attendance';
import { Fines } from './pages/student/Fines';
import { StudentDocuments } from './pages/student/StudentDocuments';
import { StudentTimetable } from './pages/student/StudentTimetable';
import { StudentResults } from './pages/student/StudentResults';
import { StudentMaterials } from './pages/student/StudentMaterials';
import { StudentNotices } from './pages/student/StudentNotices';
import { StudentComplaints } from './pages/student/StudentComplaints';
import { StudentHostel } from './pages/student/StudentHostel';
import { StudentTransport } from './pages/student/StudentTransport';
import { StudentHostelTransport } from './pages/student/StudentHostelTransport';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { FacultyClasses } from './pages/faculty/FacultyClasses';
import { FacultyAttendance } from './pages/faculty/FacultyAttendance';
import { FacultyMarks } from './pages/faculty/FacultyMarks';
import { FacultyTimetable } from './pages/faculty/FacultyTimetable';
import { FacultyMaterials } from './pages/faculty/FacultyMaterials';
import { FacultyNotices } from './pages/faculty/FacultyNotices';
import { FacultyProfile } from './pages/faculty/FacultyProfile';

// Warden Pages
import { WardenDashboard } from './pages/warden/WardenDashboard';
import { WardenHostel } from './pages/warden/WardenHostel';
import { WardenBeds } from './pages/warden/WardenBeds';
import { WardenApplications } from './pages/warden/WardenApplications';
import { WardenAllocations } from './pages/warden/WardenAllocations';
import { WardenPayments } from './pages/warden/WardenPayments';
import { WardenComplaints } from './pages/warden/WardenComplaints';
import { WardenOutings } from './pages/warden/WardenOutings';
import { WardenNotices } from './pages/warden/WardenNotices';
import { WardenReports } from './pages/warden/WardenReports';
import { WardenProfile } from './pages/warden/WardenProfile';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudents } from './pages/admin/AdminStudents';
import { StudentDetails } from './pages/admin/StudentDetails';
import { AdminWardens } from './pages/admin/AdminWardens';
import { AdminFaculty } from './pages/admin/AdminFaculty';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminTimetable } from './pages/admin/AdminTimetable';
import { AdminExams } from './pages/admin/AdminExams';
import { AdminFees } from './pages/admin/AdminFees';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminAttendance } from './pages/admin/AdminAttendance';
import { AdminFines } from './pages/admin/AdminFines';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminNotices } from './pages/admin/AdminNotices';
import { AdminComplaints } from './pages/admin/AdminComplaints';
import { AdminHostel } from './pages/admin/AdminHostel';
import { AdminTransport } from './pages/admin/AdminTransport';

// Root Redirect component based on auth status and role
const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'WARDEN') return <Navigate to="/warden/dashboard" replace />;
  if (role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <PwaInstallProvider>
      <AuthProvider>
        <OfflineBanner />
        <InstallHelpModal />
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/warden/login" element={<WardenLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/faculty/register" element={<FacultyRegister />} />
            <Route path="/register/faculty" element={<FacultyRegister />} />
            <Route path="/warden/register" element={<WardenRegister />} />
            <Route path="/register/warden" element={<WardenRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/profile" element={<StudentProfile />} />
                <Route path="/timetable" element={<StudentTimetable />} />
                <Route path="/results" element={<StudentResults />} />
                <Route path="/study-materials" element={<StudentMaterials />} />
                <Route path="/fees" element={<StudentFees />} />
                <Route path="/pay-fees" element={<PayFees />} />
                <Route path="/payments" element={<PaymentHistory />} />
                <Route path="/receipts" element={<Receipts />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/fines" element={<Fines />} />
                <Route path="/documents" element={<StudentDocuments />} />
                <Route path="/hostel" element={<StudentHostel />} />
                <Route path="/transport" element={<StudentTransport />} />
                <Route path="/hostel-transport" element={<StudentHostelTransport />} />
                <Route path="/notices" element={<StudentNotices />} />
                <Route path="/complaints" element={<StudentComplaints />} />
              </Route>
            </Route>

            {/* Protected Faculty Routes */}
            <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                <Route path="/faculty/classes" element={<FacultyClasses />} />
                <Route path="/faculty/attendance" element={<FacultyAttendance />} />
                <Route path="/faculty/marks" element={<FacultyMarks />} />
                <Route path="/faculty/timetable" element={<FacultyTimetable />} />
                <Route path="/faculty/materials" element={<FacultyMaterials />} />
                <Route path="/faculty/notices" element={<FacultyNotices />} />
                <Route path="/faculty/profile" element={<FacultyProfile />} />
              </Route>
            </Route>

            {/* Protected Warden Routes */}
            <Route element={<ProtectedRoute allowedRoles={['WARDEN']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/warden/dashboard" element={<WardenDashboard />} />
                <Route path="/warden/hostel" element={<WardenHostel />} />
                <Route path="/warden/beds" element={<WardenBeds />} />
                <Route path="/warden/applications" element={<WardenApplications />} />
                <Route path="/warden/allocations" element={<WardenAllocations />} />
                <Route path="/warden/payments" element={<WardenPayments />} />
                <Route path="/warden/complaints" element={<WardenComplaints />} />
                <Route path="/warden/outings" element={<WardenOutings />} />
                <Route path="/warden/notices" element={<WardenNotices />} />
                <Route path="/warden/reports" element={<WardenReports />} />
                <Route path="/warden/profile" element={<WardenProfile />} />
              </Route>
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/students" element={<AdminStudents />} />
                <Route path="/admin/students/:id" element={<StudentDetails />} />
                <Route path="/admin/wardens" element={<AdminWardens />} />
                <Route path="/admin/faculty" element={<AdminFaculty />} />
                <Route path="/admin/courses" element={<AdminCourses />} />
                <Route path="/admin/timetable" element={<AdminTimetable />} />
                <Route path="/admin/exams" element={<AdminExams />} />
                <Route path="/admin/fees" element={<AdminFees />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/attendance" element={<AdminAttendance />} />
                <Route path="/admin/fines" element={<AdminFines />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/notices" element={<AdminNotices />} />
                <Route path="/admin/complaints" element={<AdminComplaints />} />
                <Route path="/admin/hostel" element={<AdminHostel />} />
                <Route path="/admin/transport" element={<AdminTransport />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </PwaInstallProvider>
  );
}
