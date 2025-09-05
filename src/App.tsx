import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useThemePersistence } from "@/hooks/useThemePersistence";
import Layout from "@/components/layout/Layout";
import RoleBasedDashboard from "@/components/auth/RoleBasedDashboard";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Students from "./pages/student/Students";
import StudentForm from "./pages/student/StudentForm";
import Teachers from "./pages/teacher/Teachers";
import TeacherForm from "./pages/teacher/TeacherForm";
import TeacherDetails from "./pages/teacher/TeacherDetails";
import CourseForm from "./pages/courses/CourseForm";
import Schedule from "./pages/Schedule";
import Finance from "./pages/finance/Finance";
import PaymentForm from "./pages/finance/PaymentForm";
import Settings from "./pages/settings/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AcademicCalendar from "./pages/setups/AcademicCalendar";
const GradesReportLazy = React.lazy(() => import('./pages/courses/GradesReport'));

// Teacher specific pages
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherSchedule from "./pages/teacher/TeacherSchedule";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import LearningMaterials from "./pages/LearningMaterials";
import SubmitGrades from "./pages/teacher/SubmitGrades";

// Student specific pages
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentGrades from "./pages/student/StudentGrades";
import StudentSchedule from "./pages/student/StudentSchedule";
import StudentMaterials from "./pages/student/StudentMaterials";
import StudentCourses from "./pages/student/StudentCourses";

// Parent specific pages
import ParentChildrenPerformance from "./pages/parent/ParentChildrenPerformance";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentMessages from "./pages/parent/ParentMessages";
import ParentFinance from "./pages/parent/ParentFinance";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import CourseEnrollments from "./pages/courses/CourseEnrollments";
import StudentDetails from "./pages/student/StudentDetails";
import FinanceOfficers from "./pages/finance/FinanceOfficers";
import FinanceForm from "./pages/finance/FinanceForm";
import FinanceOfficerDetails from "./pages/finance/FinanceOfficerDetails";
import Transactions from "./pages/finance/Transactions";
import Invoices from "./pages/finance/Invoices";
import FinanceReports from "./pages/finance/FinanceReports";
import Courses from "./pages/courses/Courses";
import EnrollStudents from "./pages/courses/EnrollStudents";
import ClassManagement from "./pages/Classes";
import ScheduleManagement from "./pages/schedules";
import Exams from "./pages/courses/Exams";
import ExamForm from "./pages/courses/ExamForm";

// Reports page
import Reports from "./pages/Reports/Reports";
import ExamDetails from "./pages/courses/ExamDetails";
import CourseView from "./pages/courses/CourseView";
import ExamResults from "./pages/courses/ExamResults";
import Activities from "./pages/activities/Activities";
import ActivityDetail from "./pages/activities/ActivityDetail";

// Admin specific pages
import SystemMonitoring from "./pages/admin/SystemMonitoring";
import StaffManagement from "./pages/admin/StaffManagement";
import GradingFormat from "./pages/admin/GradingFormat";

// Protected route component - immediately redirects if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  // Immediately redirect if not authenticated (no loading screen)
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading only if we're still checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verifying authentication...</div>
      </div>
    );
  }

  return <>{children}</>;
};

// Teacher route component - only accessible by teachers
const TeacherRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Immediately redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Immediately redirect if authenticated but wrong role
  if (!loading && user && user.role !== "teacher") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verifying permissions...</div>
      </div>
    );
  }

  return <>{children}</>;
};

// Student route component - only accessible by students
const StudentRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Immediately redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Immediately redirect if authenticated but wrong role
  if (!loading && user && user.role !== "student") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verifying permissions...</div>
      </div>
    );
  }

  return <>{children}</>;
};

// Parent route component - only accessible by parents
const ParentRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Immediately redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Immediately redirect if authenticated but wrong role
  if (!loading && user && user.role !== "parent") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verifying permissions...</div>
      </div>
    );
  }

  return <>{children}</>;
};

// Admin route component - only accessible by admins
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Immediately redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Immediately redirect if authenticated but wrong role
  if (!loading && user && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verifying permissions...</div>
      </div>
    );
  }

  return <>{children}</>;
};

// Finance route component - accessible by finance and admin roles
const FinanceRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Immediately redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Immediately redirect if authenticated but wrong role
  if (!loading && user && user.role !== "finance" && user.role !== "admin" && user.role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verifying permissions...</div>
      </div>
    );
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <RoleBasedDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Student Routes - Restricted based on role */}
      <Route
        path="/students/view"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Students />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students/:id"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <StudentDetails />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students/add"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <StudentForm />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students/:id/edit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <StudentForm />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes - Restricted to admin only */}
      <Route
        path="/teachers/view"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Teachers />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teachers/add"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <TeacherForm />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teachers/:id/edit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <TeacherForm />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teachers/:id"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <TeacherDetails />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      {/* Course Routes */}
      <Route
        path="/courses/view"
        element={
          <ProtectedRoute>
            <Layout>
              <Courses />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses/add"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <CourseForm />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses/:id/edit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <CourseForm />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      {/* Course View Route */}
      <Route
        path="/courses/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <CourseView />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* New Enrollment Management Route */}
      <Route
        path="/courses/:id/enrollments"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <CourseEnrollments />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses/:id/enroll"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <EnrollStudents />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      {/* Exams Route */}
      <Route
        path="/courses/exams"
        element={
          <ProtectedRoute>
            <Layout>
              <Exams />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/exams/:examId"
        element={
          <ProtectedRoute>
            <Layout>
              <ExamDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses/exam-results"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <ExamResults />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses/grades-report"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <React.Suspense fallback={<div>Loading...</div>}>
                  <GradesReportLazy />
                </React.Suspense>
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      {/* <Route
        path="/classes/view"
        element={
          <ProtectedRoute>
            <Layout>
              {user?.role === "student" ? <StudentSchedule /> : <Schedule />}
            </Layout>
          </ProtectedRoute>
        }
      /> */}

      <Route
        path="/classes/view"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <ClassManagement />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/schedules/view"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <ScheduleManagement />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
        <Route
          path="/setups/academic-calendar"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <Layout>
                  <AcademicCalendar />
                </Layout>
              </AdminRoute>
            </ProtectedRoute>
          }
        />

      {/* Finance Routes */}
      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <Layout>
              <Finance />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/officers/view"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <FinanceOfficers />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/officers/add"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <FinanceForm />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/officers/:id"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <FinanceOfficerDetails />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/officers/:id/edit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <FinanceForm />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/record"
        element={
          <ProtectedRoute>
            <Layout>
              <PaymentForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/records"
        element={
          <ProtectedRoute>
            <FinanceRoute>
              <Layout>
                <PaymentForm />
              </Layout>
            </FinanceRoute>
          </ProtectedRoute>
        }
      />

      {/* Finance Role Specific Routes */}
      <Route
        path="/finance/transactions"
        element={
          <ProtectedRoute>
            <FinanceRoute>
              <Layout>
                <Transactions />
              </Layout>
            </FinanceRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/invoices"
        element={
          <ProtectedRoute>
            <FinanceRoute>
              <Layout>
                <Invoices />
              </Layout>
            </FinanceRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/reports"
        element={
          <ProtectedRoute>
            <FinanceRoute>
              <Layout>
                <FinanceReports />
              </Layout>
            </FinanceRoute>
          </ProtectedRoute>
        }
      />

      {/* Reports Route - Admin only */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Reports />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports/academic"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Reports />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/activities"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Activities />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/activities/:id"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <ActivityDetail />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      {/* Admin specific routes */}
      <Route
        path="/admin/system-monitoring"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <SystemMonitoring />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/staff-management"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <StaffManagement />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/grading-format"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <GradingFormat />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Teacher specific routes */}
      <Route
        path="/my-students"
        element={
          <TeacherRoute>
            <Layout>
              <TeacherStudents />
            </Layout>
          </TeacherRoute>
        }
      />

      <Route
        path="/my-courses"
        element={
          <TeacherRoute>
            <Layout>
              <TeacherCourses />
            </Layout>
          </TeacherRoute>
        }
      />

      <Route
        path="/my-schedule"
        element={
          <TeacherRoute>
            <Layout>
              <TeacherSchedule />
            </Layout>
          </TeacherRoute>
        }
      />

      <Route
        path="/take-attendance"
        element={
          <TeacherRoute>
            <Layout>
              <TeacherAttendance />
            </Layout>
          </TeacherRoute>
        }
      />

      <Route
        path="/learning-materials"
        element={
          <TeacherRoute>
            <Layout>
              <LearningMaterials />
            </Layout>
          </TeacherRoute>
        }
      />

      <Route
        path="/submit-grades"
        element={
          <TeacherRoute>
            <Layout>
              <SubmitGrades />
            </Layout>
          </TeacherRoute>
        }
      />

      {/* Exam Creation Route for Teachers */}
      <Route
        path="/courses/:courseId/create-exam"
        element={
          <TeacherRoute>
            <Layout>
              <ExamForm />
            </Layout>
          </TeacherRoute>
        }
      />

      {/* Student specific routes */}
      <Route
        path="/assignments"
        element={
          <StudentRoute>
            <Layout>
              <StudentAssignments />
            </Layout>
          </StudentRoute>
        }
      />

      <Route
        path="/grades"
        element={
          <StudentRoute>
            <Layout>
              <StudentGrades />
            </Layout>
          </StudentRoute>
        }
      />

      <Route
        path="/materials"
        element={
          <StudentRoute>
            <Layout>
              <StudentMaterials />
            </Layout>
          </StudentRoute>
        }
      />

      <Route
        path="/schedule"
        element={
          <StudentRoute>
            <Layout>
              <StudentSchedule />
            </Layout>
          </StudentRoute>
        }
      />

      <Route
        path="/courses"
        element={
          <StudentRoute>
            <Layout>
              <StudentCourses />
            </Layout>
          </StudentRoute>
        }
      />

      {/* Parent specific routes */}
      <Route
        path="/children/performance"
        element={
          <ParentRoute>
            <Layout>
              <ParentChildrenPerformance />
            </Layout>
          </ParentRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ParentRoute>
            <Layout>
              <ParentAttendance />
            </Layout>
          </ParentRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ParentRoute>
            <Layout>
              <ParentMessages />
            </Layout>
          </ParentRoute>
        }
      />

      <Route
        path="/parent/finance"
        element={
          <ParentRoute>
            <Layout>
              <ParentFinance />
            </Layout>
          </ParentRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeProvider>
            <BrowserRouter>
              <SidebarProvider>
                <AppRoutes />
                <Toaster />
                <Sonner />
              </SidebarProvider>
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
