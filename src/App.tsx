import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentForm from "./pages/StudentForm";
import Teachers from "./pages/Teachers";
import TeacherForm from "./pages/TeacherForm";
import Subjects from "./pages/Subjects";
import SubjectForm from "./pages/SubjectForm";
import Schedule from "./pages/Schedule";
import Finance from "./pages/Finance";
import FinanceReports from "./pages/FinanceReports";
import FinanceBudgets from "./pages/FinanceBudgets";
import PaymentForm from "./pages/PaymentForm";
import FinanceBudgets from "./pages/FinanceBudgets";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Teacher specific pages
import TeacherStudents from "./pages/TeacherStudents";
import TeacherSubjects from "./pages/TeacherSubjects";
import TeacherSchedule from "./pages/TeacherSchedule";
import TeacherAttendance from "./pages/TeacherAttendance";
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

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user || user.role !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Student route component - only accessible by students
const StudentRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user || user.role !== 'student') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Finance route component - only accessible by finance users
const FinanceRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user || user.role !== 'finance') {
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
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Student Routes */}
      <Route path="/students" element={
        <ProtectedRoute>
          <Layout>
            <Students />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/students/new" element={
        <ProtectedRoute>
          <Layout>
            <StudentForm />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Teacher Routes */}
      <Route path="/teachers" element={
        <ProtectedRoute>
          <Layout>
            <Teachers />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/teachers/new" element={
        <ProtectedRoute>
          <Layout>
            <TeacherForm />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Subject Routes */}
      <Route path="/subjects" element={
        <ProtectedRoute>
          <Layout>
            <Subjects />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/subjects/new" element={
        <ProtectedRoute>
          <Layout>
            <SubjectForm />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/schedule" element={
        <ProtectedRoute>
          <Layout>
            {user?.role === 'student' ? <StudentSchedule /> : <Schedule />}
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Finance Routes */}
      <Route path="/finance" element={
        <ProtectedRoute>
          <Layout>
            <Finance />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/finance/record" element={
        <ProtectedRoute>
          <Layout>
            <PaymentForm />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/finance/budgets" element={
        <FinanceRoute>
          <Layout>
            <FinanceBudgets />
          </Layout>
        </FinanceRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Teacher specific routes */}
      <Route path="/my-students" element={
        <TeacherRoute>
          <Layout>
            <TeacherStudents />
          </Layout>
        </TeacherRoute>
      } />
      
      <Route path="/my-subjects" element={
        <TeacherRoute>
          <Layout>
            <TeacherSubjects />
          </Layout>
        </TeacherRoute>
      } />
      
      <Route path="/my-schedule" element={
        <TeacherRoute>
          <Layout>
            <TeacherSchedule />
          </Layout>
        </TeacherRoute>
      } />
      
      <Route path="/take-attendance" element={
        <TeacherRoute>
          <Layout>
            <TeacherAttendance />
          </Layout>
        </TeacherRoute>
      } />
      
      <Route path="/learning-materials" element={
        <TeacherRoute>
          <Layout>
            <LearningMaterials />
          </Layout>
        </TeacherRoute>
      } />
      
      <Route path="/submit-grades" element={
        <TeacherRoute>
          <Layout>
            <SubmitGrades />
          </Layout>
        </TeacherRoute>
      } />
      
      {/* Student specific routes */}
      <Route path="/assignments" element={
        <StudentRoute>
          <Layout>
            <StudentAssignments />
          </Layout>
        </StudentRoute>
      } />
      
      <Route path="/grades" element={
        <StudentRoute>
          <Layout>
            <StudentGrades />
          </Layout>
        </StudentRoute>
      } />
      
      <Route path="/materials" element={
        <StudentRoute>
          <Layout>
            <StudentMaterials />
          </Layout>
        </StudentRoute>
      } />
      
      {/* Parent specific routes */}
      <Route path="/children/performance" element={
        <ParentRoute>
          <Layout>
            <ParentChildrenPerformance />
          </Layout>
        </ParentRoute>
      } />
      
      <Route path="/attendance" element={
        <ParentRoute>
          <Layout>
            <ParentAttendance />
          </Layout>
        </ParentRoute>
      } />
      
      <Route path="/messages" element={
        <ParentRoute>
          <Layout>
            <ParentMessages />
          </Layout>
        </ParentRoute>
      } />
      
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