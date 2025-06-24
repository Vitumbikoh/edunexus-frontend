import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import RoleBasedDashboard from "@/components/auth/RoleBasedDashboard";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Students from "./pages/Students";
import StudentForm from "./pages/StudentForm";
import Teachers from "./pages/teacher/Teachers";
import TeacherForm from "./pages/teacher/TeacherForm";
import CourseForm from "./pages/courses/CourseForm";
import Schedule from "./pages/Schedule";
import Finance from "./pages/Finance";
import PaymentForm from "./pages/PaymentForm";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Teacher specific pages
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherSchedule from "./pages/teacher/TeacherSchedule";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import LearningMaterials from "./pages/LearningMaterials";
import SubmitGrades from "./pages/SubmitGrades";

// Student specific pages
import StudentAssignments from "./pages/StudentAssignments";
import StudentGrades from "./pages/StudentGrades";
import StudentSchedule from "./pages/StudentSchedule";
import StudentMaterials from "./pages/StudentMaterials";

// Parent specific pages
import ParentChildrenPerformance from "./pages/ParentChildrenPerformance";
import ParentAttendance from "./pages/ParentAttendance";
import ParentMessages from "./pages/ParentMessages";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import CourseEnrollments from "./pages/courses/CourseEnrollments";
import StudentDetails from "./pages/StudentDetails";
import FinanceOfficers from "./pages/FinanceOfficers";
import FinanceForm from "./pages/FinanceForm";
import Courses from "./pages/courses/Courses";
import EnrollStudents from "./pages/courses/EnrollStudents";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Teacher route component - only accessible by teachers
const TeacherRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user || user.role !== "teacher") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Student route component - only accessible by students
const StudentRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user || user.role !== "student") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Parent route component - only accessible by parents
const ParentRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user || user.role !== "parent") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Admin route component - only accessible by admins
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Finance route component - only accessible by finance role
const FinanceRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user || user.role !== "finance") {
    return <Navigate to="/dashboard" replace />;
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
        path="/students"
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
                <StudentDetails  />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students/new"
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
        path="/teachers"
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
        path="/teachers/new"
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

      {/* Course Routes */}
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <Layout>
              <Courses />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses/new"
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

      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <Layout>
              {user?.role === "student" ? <StudentSchedule /> : <Schedule />}
            </Layout>
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
        path="/finance/officers"
        element={
          <ProtectedRoute>
            <Layout>
              <FinanceOfficers />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/new"
        element={
          <ProtectedRoute>
            <Layout>
              <FinanceForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/record"
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
          <BrowserRouter>
            <SidebarProvider>
              <AppRoutes />
              <Toaster />
              <Sonner />
            </SidebarProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
