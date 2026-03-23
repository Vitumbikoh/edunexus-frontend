import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_CONFIG } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle,
  DollarSign,
  GraduationCap,
  TrendingUp,
  Users,
  UserSquare2,
} from 'lucide-react';

type DashboardPayload = {
  totalStudents?: number;
  attendanceRate?: number;
  feePaymentPercentage?: number;
};

type StudentStatsPayload = {
  data?: {
    classBreakdown?: Array<{ className: string; count: number }>;
    graduatedStudents?: number;
  };
};

type FeeStatusPayload = {
  paymentSummary?: {
    totalExpected?: number;
    totalPaid?: number;
    totalOutstanding?: number;
    paymentPercentage?: number;
  };
  monthlyTrends?: Array<{ month: string; totalPaid: number }>;
};

type AttendanceRow = {
  month: string;
  totalRecords: number;
  present: number;
  attendanceRate: number;
};

type TeacherListPayload = {
  teachers?: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    subjectSpecialization?: string;
    status?: string;
  }>;
};

type ExamSummaryPayload = {
  totalExams?: number;
  upcomingExams?: number;
  administeredExams?: number;
  gradedExams?: number;
};

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  priority: string;
};

type ActivityRow = {
  id: string;
  action: string;
  module: string;
  timestamp: string;
};

type ExamRow = {
  id: string;
  title: string;
  date?: string;
  class?: { name?: string };
  course?: { name?: string };
};

async function fetchJson<T>(url: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function PrincipalDashboardContent() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStatsPayload | null>(null);
  const [teachers, setTeachers] = useState<TeacherListPayload | null>(null);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [feeStatus, setFeeStatus] = useState<FeeStatusPayload | null>(null);
  const [examSummary, setExamSummary] = useState<ExamSummaryPayload | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<ExamRow[]>([]);
  const [announcements, setAnnouncements] = useState<NotificationRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const base = API_CONFIG.BASE_URL;
      const [
        dashboardRes,
        studentStatsRes,
        teachersRes,
        attendanceRes,
        feeRes,
        examStatsRes,
        examsRes,
        noticesRes,
        activitiesRes,
      ] = await Promise.all([
        fetchJson<DashboardPayload>(`${base}/analytics/dashboard-summary`, token),
        fetchJson<StudentStatsPayload>(`${base}/student/students/stats`, token),
        fetchJson<TeacherListPayload>(`${base}/teacher/teachers?page=1&limit=6`, token),
        fetchJson<AttendanceRow[]>(`${base}/analytics/attendance-overview`, token),
        fetchJson<FeeStatusPayload>(`${base}/analytics/fee-collection-status`, token),
        fetchJson<ExamSummaryPayload>(`${base}/exams/statistics`, token),
        fetchJson<ExamRow[]>(`${base}/exams`, token),
        fetchJson<{ notifications: NotificationRow[] }>(`${base}/notifications?page=1&limit=5`, token),
        fetchJson<ActivityRow[]>(`${base}${API_CONFIG.ENDPOINTS.RECENT_ACTIVITIES}?limit=6`, token),
      ]);

      const upcoming = (examsRes || [])
        .filter((exam) => {
          if (!exam.date) return false;
          return new Date(exam.date).getTime() >= Date.now();
        })
        .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())
        .slice(0, 5);

      setDashboard(dashboardRes);
      setStudentStats(studentStatsRes);
      setTeachers(teachersRes);
      setAttendanceRows(Array.isArray(attendanceRes) ? attendanceRes : []);
      setFeeStatus(feeRes);
      setExamSummary(examStatsRes);
      setUpcomingExams(upcoming);
      setAnnouncements(noticesRes?.notifications || []);
      setActivities(Array.isArray(activitiesRes) ? activitiesRes : []);
      setLoading(false);
    };

    load();
  }, [token]);

  const feeSummary = feeStatus?.paymentSummary || {};
  const teacherList = teachers?.teachers || [];
  const classBreakdown = studentStats?.data?.classBreakdown || [];

  const alerts = useMemo(() => {
    const items: string[] = [];
    const paymentPercentage = Number(feeSummary.paymentPercentage || dashboard?.feePaymentPercentage || 0);
    if (paymentPercentage > 0 && paymentPercentage < 60) {
      items.push(`Fee collection is low at ${paymentPercentage.toFixed(1)}%.`);
    }

    const latestAttendance = attendanceRows[attendanceRows.length - 1]?.attendanceRate || dashboard?.attendanceRate || 0;
    if (latestAttendance > 0 && latestAttendance < 80) {
      items.push(`Attendance trend dropped to ${latestAttendance.toFixed(1)}%.`);
    }

    if ((feeSummary.totalOutstanding || 0) > 0) {
      items.push(`Outstanding balances currently stand at MK ${(feeSummary.totalOutstanding || 0).toLocaleString()}.`);
    }

    return items;
  }, [attendanceRows, dashboard?.attendanceRate, dashboard?.feePaymentPercentage, feeSummary]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading principal dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Principal Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">Strategic oversight and school-wide insights (read-only).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/reports')}>
            View Reports
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={() => navigate('/activities')}>
            View Audit Trail
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-2xl">{(dashboard?.totalStudents || 0).toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Withdrawn/Graduated: {(studentStats?.data?.graduatedStudents || 0).toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Teachers & Staff</CardDescription>
            <CardTitle className="text-2xl">{(teacherList.length || 0).toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
            <UserSquare2 className="h-4 w-4" />
            Read-only workforce overview
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attendance Rate</CardDescription>
            <CardTitle className="text-2xl">{Number(dashboard?.attendanceRate || 0).toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Monthly trend snapshot
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fee Collection</CardDescription>
            <CardTitle className="text-2xl">{Number(feeSummary.paymentPercentage || dashboard?.feePaymentPercentage || 0).toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Paid MK {(feeSummary.totalPaid || 0).toLocaleString()}
          </CardContent>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/40 dark:bg-amber-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Executive Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <p key={alert} className="text-sm text-amber-900 dark:text-amber-200">{alert}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Student Insights
            </CardTitle>
            <CardDescription>Enrollment by class and academic posture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {classBreakdown.slice(0, 6).map((row) => (
              <div key={row.className} className="flex items-center justify-between text-sm">
                <span>{row.className}</span>
                <Badge variant="outline">{row.count}</Badge>
              </div>
            ))}
            <div className="pt-2 text-xs text-muted-foreground">
              Exam summary: {examSummary?.gradedExams || 0} graded, {examSummary?.administeredExams || 0} administered.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Staff Overview
            </CardTitle>
            <CardDescription>Top staff records and specialization summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {teacherList.slice(0, 6).map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between text-sm">
                <span>
                  {(teacher.firstName || '').trim()} {(teacher.lastName || '').trim()}
                </span>
                <Badge variant="secondary">{teacher.subjectSpecialization || 'General'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Upcoming Events & Exams
            </CardTitle>
            <CardDescription>Calendar visibility for strategic planning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingExams.length === 0 && <p className="text-sm text-muted-foreground">No upcoming exams found.</p>}
            {upcomingExams.map((exam) => (
              <div key={exam.id} className="text-sm border rounded-md p-2">
                <p className="font-medium">{exam.title}</p>
                <p className="text-xs text-muted-foreground">
                  {exam.class?.name || exam.course?.name || 'General'} • {exam.date ? new Date(exam.date).toLocaleDateString() : 'TBD'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recent Announcements
            </CardTitle>
            <CardDescription>Targeted notices and system updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements available.</p>}
            {announcements.map((notice) => (
              <div key={notice.id} className="text-sm border rounded-md p-2">
                <p className="font-medium">{notice.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{notice.message}</p>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>See all notifications</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial Summary</CardTitle>
            <CardDescription>Read-only fee collection and outstanding balances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Total Expected</span><span>MK {(feeSummary.totalExpected || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Total Paid</span><span>MK {(feeSummary.totalPaid || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Outstanding</span><span>MK {(feeSummary.totalOutstanding || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Collection Rate</span><span>{Number(feeSummary.paymentPercentage || 0).toFixed(1)}%</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Audit & Oversight
            </CardTitle>
            <CardDescription>Recent School Admin activity and key events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activities.slice(0, 5).map((log) => (
              <div key={log.id} className="text-sm border rounded-md p-2">
                <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">{log.module} • {new Date(log.timestamp).toLocaleString()}</p>
              </div>
            ))}
            <div className="pt-1 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/activities')}>
                View Logs
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
                Download Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <CheckCircle className="h-3.5 w-3.5" />
        Principal access is strictly oversight-only. Operational changes are disabled for this role.
      </div>
    </div>
  );
}
