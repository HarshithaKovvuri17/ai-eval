import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import LoginPage          from './pages/auth/LoginPage';
import RegisterPage       from './pages/auth/RegisterPage';
import VerifyOtpPage      from './pages/auth/VerifyOtpPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from './pages/auth/ResetPasswordPage';

// Student pages
import CoursesPage      from './pages/student/CoursesPage';
import CourseDetail     from './pages/student/CourseDetail';
import TestPage         from './pages/student/TestPage';
import ResultPage       from './pages/student/ResultPage';
import DashboardPage    from './pages/student/DashboardPage';
import CertificatesPage from './pages/student/CertificatesPage';

// Admin pages
import AdminDashboard  from './pages/admin/AdminDashboard';
import AdminCourses    from './pages/admin/AdminCourses';
import AdminCourseForm from './pages/admin/AdminCourseForm';
import AdminUsers      from './pages/admin/AdminUsers';

// Layout
import StudentLayout from './components/layout/StudentLayout';
import AdminLayout   from './components/layout/AdminLayout';

// ── Route guards ──────────────────────────────────────────────────────────────
const RequireAuth = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner"/>
    </div>
  );
  if (!user) return <Navigate to="/login" replace/>;
  if (role && user.role !== role)
    return <Navigate to={user.role === 'admin' ? '/admin' : '/courses'} replace/>;
  return children;
};

const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/courses'} replace/>;
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background:'#0d1228', color:'#e2e8f0',
                border:'1px solid #1e2d4a', borderRadius:'10px',
                fontSize:14,
              },
              success: { iconTheme:{ primary:'#4ade80', secondary:'#0d1228' } },
              error:   { iconTheme:{ primary:'#f43f5e', secondary:'#0d1228' } },
              duration: 4000,
            }}
          />
          <Routes>
            {/* ── Public auth routes ──────────────────────────────────────── */}
            <Route path="/login"           element={<PublicOnly><LoginPage/></PublicOnly>}/>
            <Route path="/register"        element={<PublicOnly><RegisterPage/></PublicOnly>}/>
            {/* OTP screen is public – no auth needed */}
            <Route path="/verify-otp"      element={<VerifyOtpPage/>}/>
            <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage/></PublicOnly>}/>
            <Route path="/reset-password/:token" element={<PublicOnly><ResetPasswordPage/></PublicOnly>}/>

            {/* ── Student routes ──────────────────────────────────────────── */}
            <Route path="/" element={<RequireAuth role="student"><StudentLayout/></RequireAuth>}>
              <Route index                          element={<Navigate to="/courses" replace/>}/>
              <Route path="courses"                 element={<CoursesPage/>}/>
              <Route path="courses/:id"             element={<CourseDetail/>}/>
              <Route path="test/:courseId/level/:level" element={<TestPage/>}/>
              <Route path="result"                  element={<ResultPage/>}/>
              <Route path="dashboard"               element={<DashboardPage/>}/>
              <Route path="certificates"            element={<CertificatesPage/>}/>
            </Route>

            {/* ── Admin routes ────────────────────────────────────────────── */}
            <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout/></RequireAuth>}>
              <Route index                     element={<AdminDashboard/>}/>
              <Route path="courses"            element={<AdminCourses/>}/>
              <Route path="courses/new"        element={<AdminCourseForm/>}/>
              <Route path="courses/:id/edit"   element={<AdminCourseForm/>}/>
              <Route path="users"              element={<AdminUsers/>}/>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace/>}/>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
