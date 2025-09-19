import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { 
  ChartPie, DollarSign, Users, MessageSquare, 
  Check, Upload, FileText, Calendar,
  Award, Download, CreditCard, TrendingUp, BookOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const QuickActions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  const isFinance = user?.role === 'finance';

  return (
    <div className="space-y-4">
      {isParent && (
        <>
          <Button className="w-full" onClick={() => navigate("/children/performance")}>
            <ChartPie className="mr-2 h-4 w-4" />
            View Children's Performance
          </Button>
          <Button className="w-full" onClick={() => navigate("/finance")}>
            <DollarSign className="mr-2 h-4 w-4" />
            Pay Fees
          </Button>
          <Button className="w-full" onClick={() => navigate("/attendance")}>
            <Users className="mr-2 h-4 w-4" />
            View Attendance
          </Button>
          <Button className="w-full" onClick={() => navigate("/messages")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Teachers
          </Button>
        </>
      )}
      
      {isTeacher && (
        <>
          <Button className="w-full" onClick={() => navigate("/take-attendance")}>
            <Check className="mr-2 h-4 w-4" />
            Take Attendance
          </Button>
          <Button className="w-full" onClick={() => navigate("/learning-materials")}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Learning Materials
          </Button>
          <Button className="w-full" onClick={() => navigate("/submit-grades")}>
            <FileText className="mr-2 h-4 w-4" />
            Submit Grades
          </Button>
          <Button className="w-full" onClick={() => navigate("/my-schedule")}>
            <Calendar className="mr-2 h-4 w-4" />
            View Class Schedule
          </Button>
        </>
      )}
      
      {isStudent && (
        <>
          <Button className="w-full" onClick={() => navigate("/assignments")}>
            <FileText className="mr-2 h-4 w-4" />
            View Assignments
          </Button>
          <Button className="w-full" onClick={() => navigate("/grades")}>
            <Award className="mr-2 h-4 w-4" />
            Check Grades
          </Button>
          <Button className="w-full" onClick={() => navigate("/schedule")}>
            <Calendar className="mr-2 h-4 w-4" />
            View Schedule
          </Button>
          <Button className="w-full" onClick={() => navigate("/materials")}>
            <Download className="mr-2 h-4 w-4" />
            Download Learning Materials
          </Button>
        </>
      )}

      {isFinance && (
        <>
          <Button className="w-full" onClick={() => navigate("/finance/transactions")}>
            <CreditCard className="mr-2 h-4 w-4" />
            View Transactions
          </Button>
          <Button className="w-full" onClick={() => navigate("/finance/expenses")}>
            <FileText className="mr-2 h-4 w-4" />
            Manage Expenses
          </Button>
          <Button className="w-full" onClick={() => navigate("/finance/reports")}>
            <ChartPie className="mr-2 h-4 w-4" />
            Generate Reports
          </Button>
          <Button className="w-full" onClick={() => navigate("/finance")}>
            <DollarSign className="mr-2 h-4 w-4" />
            Financial Overview
          </Button>
        </>
      )}
    </div>
  );
};