import React, { useEffect, useState } from "react";
import StatCard from "@/components/dashboard/StatCard";
import { API_BASE_URL } from '@/config/api';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';
import {
  Users,
  BookOpen,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck,
  FileText,
  Award,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { academicCalendarService } from '@/services/academicCalendarService';

export const useDashboardStats = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const role = user?.role;
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (url: string) => {
    try {
      // append academicCalendarId for finance endpoints
      let endpoint = `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}${url}`;
      if (url.startsWith('/finance')) {
        try {
          const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
          if (cal?.id) endpoint += (url.includes('?') ? '&' : '?') + `academicCalendarId=${encodeURIComponent(cal.id)}`;
        } catch {}
      }
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error("Unauthorized - Please log in again");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          throw new Error("Authentication token not found");
        }

        if (role === "admin") {
          const [studentsData, coursesData, financesData, teachersData] = await Promise.all([
            fetchData("/student/total-students?activeOnly=true"),
            fetchData("/course/stats/total-courses"),
            fetchData("/finance/total-finances"),
            fetchData("/teacher/total-teachers"),
          ]);

          setStats([
            {
              title: "Total Students",
              value: studentsData.totalStudents?.toLocaleString() || "0",
              icon: <Users size={24} />,
              trend: studentsData.trend || { value: 0, isPositive: true },
            },
            {
              title: "Total Courses",
              value: coursesData.value?.toString() || "0",
              icon: <BookOpen size={24} />,
              trend: coursesData.trend || { value: 0, isPositive: true },
            },
            {
              title: "Total Teachers",
              value: (() => {
                try {
                  const raw = (
                    teachersData?.totalTeachers ??
                    teachersData?.total ??
                    teachersData?.count ??
                    teachersData?.value ??
                    teachersData?.data?.total ??
                    0
                  );
                  const num = typeof raw === 'number' ? raw : Number(raw);
                  return Number.isFinite(num) ? num.toLocaleString() : '0';
                } catch {
                  return '0';
                }
              })(),
              icon: <Users size={24} />,
              trend: teachersData.trend || { value: 0, isPositive: true },
            },
            {
              title: "Fee Collection",
              value: formatCurrency(financesData.currentTermRevenue ?? 0, getDefaultCurrency()),
              icon: <DollarSign size={24} />,
              trend: financesData.trend || { value: 0, isPositive: true },
            },
          ]);
        } else if (role === "finance") {
          // Fetch finance dashboard data and outstanding fees trend
          const [financeData, outstandingFeesLastMonth] = await Promise.all([
            fetchData("/finance/dashboard-data"),
            fetchData("/finance/outstanding-fees-last-month")
          ]);

          // Calculate trends (comparing current vs last month/previous period)
          const monthlyRevenue = financeData.monthlyRevenue || 0;
          const monthlyRevenueLastMonth = financeData.monthlyRevenueLastMonth || 0;
          const revenueChange = monthlyRevenueLastMonth > 0 
            ? ((monthlyRevenue - monthlyRevenueLastMonth) / monthlyRevenueLastMonth) * 100 
            : 0;

          // Calculate outstanding fees trend
          const currentOutstanding = financeData.outstandingFees || 0;
          const lastMonthOutstanding = outstandingFeesLastMonth.outstandingFeesLastMonth || 0;
          const outstandingChange = lastMonthOutstanding > 0 
            ? ((currentOutstanding - lastMonthOutstanding) / lastMonthOutstanding) * 100 
            : 0;

          setStats([
            {
              title: "Monthly Revenue",
              value: `MWK${monthlyRevenue.toLocaleString()}`,
              icon: <TrendingUp size={24} />,
              trend: { value: Math.abs(Math.round(revenueChange)), isPositive: revenueChange >= 0 },
            },
            {
              title: "Outstanding Fees",
              value: `MWK${currentOutstanding.toLocaleString()}`,
              icon: <DollarSign size={24} />,
              trend: { value: Math.abs(Math.round(outstandingChange)), isPositive: outstandingChange <= 0 },
            },
            {
              title: "Payments Today",
              value: financeData.paymentsToday?.toString() || "0",
              icon: <CreditCard size={24} />,
            },
            {
              title: "Collection Rate",
              value: `${financeData.collectionRate || 0}%`,
              icon: <UserCheck size={24} />,
              trend: { value: 2, isPositive: true }, // This would need historical data to calculate properly
            },
          ]);
        } else if (role === "teacher") {
          // Fetch teacher profile to get teacherId
          const profileResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!profileResponse.ok) {
            throw new Error("Failed to fetch teacher profile");
          }

          const profile = await profileResponse.json();
          const teacherId = profile.teacherId || user.id;

          // Fetch weekly schedule
          const scheduleResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/schedules/teacher/${teacherId}/weekly`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          let weeklyCount = 0;
          let todayCount = 0;

          if (scheduleResponse.ok) {
            const scheduleData = await scheduleResponse.json();
            const weeklySchedule = scheduleData.days || [];

            // Get current day name
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = days[new Date().getDay()];

            // Calculate counts
            weeklySchedule.forEach((day: any) => {
              if (day.items && Array.isArray(day.items)) {
                weeklyCount += day.items.length;
                if (day.day === today) {
                  todayCount = day.items.length;
                }
              }
            });
          }

          const [studentsCountData, coursesData] = await Promise.all([
            fetchData("/teacher/my-students/count"),
            fetchData("/teacher/my-courses/count"),
          ]);

          setStats([
            {
              title: "My Students",
              value: studentsCountData.totalStudents?.toLocaleString() || "0",
              icon: <Users size={24} />,
            },
            {
              title: "My Courses",
              value: coursesData.totalCourses?.toString() || "0",
              icon: <BookOpen size={24} />,
            },
            {
              title: "My Classes",
              value: weeklyCount.toString(),
              icon: <Calendar size={24} />,
            },
            {
              title: "Today's Classes",
              value: todayCount.toString(),
              icon: <Calendar size={24} />,
            },
          ]);
        } else {
          // Handle other roles (student, finance, parent)
          let studentStats: any[] = [];
          if (role === 'student') {
            try {
              // My Courses count
              const coursesRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/student/${user?.id}/courses`, { headers: { Authorization: `Bearer ${token}` } });
              let coursesCount = 0;
              let activeCoursesCount = 0;
              if (coursesRes.ok) {
                const c = await coursesRes.json();
                if (c?.courses) {
                  const all = [ ...(c.courses.active||[]), ...(c.courses.completed||[]), ...(c.courses.upcoming||[]) ];
                  coursesCount = all.length;
                  activeCoursesCount = (c.courses.active || []).length;
                } else if (Array.isArray(c)) {
                  coursesCount = c.length;
                  activeCoursesCount = c.length;
                }
              }

              // Get student's comprehensive financial balance (all fee types)
              let balanceInfo = { title: 'Balance', value: 'MK 0.00', icon: <DollarSign size={24} /> };
              try {
                console.log('Fetching balance for student:', user?.id); // Debug log
                
                // First get current term
                const termsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/settings/terms`, { headers: { Authorization: `Bearer ${token}` } });
                let currentTermId = null;
                
                console.log('Terms API response status:', termsRes.status); // Debug log
                if (termsRes.ok) {
                  const termsData = await termsRes.json();
                  console.log('Terms data:', termsData); // Debug log
                  
                  // Find the current term from the list
                  const termsList = Array.isArray(termsData) ? termsData : (termsData?.data || []);
                  const currentTerm = termsList.find((term: any) => term.isCurrent === true);
                  currentTermId = currentTerm?.id;
                  console.log('Current term ID:', currentTermId); // Debug log
                } else {
                  console.error('Terms API error:', await termsRes.text());
                }

                if (currentTermId) {
                  // Get comprehensive fee status for all fee types
                  // include active academicCalendarId when available
                  let feeStatusUrl = `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/finance/fee-status/${user?.id}?termId=${currentTermId}`;
                  try {
                    const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
                    if (cal?.id) feeStatusUrl += `&academicCalendarId=${encodeURIComponent(cal.id)}`;
                  } catch {}
                  console.log('Calling finance fee status API:', feeStatusUrl); // Debug log
                  
                  const balanceRes = await fetch(feeStatusUrl, { headers: { Authorization: `Bearer ${token}` } });
                  console.log('Finance fee status API response status:', balanceRes.status); // Debug log
                  
                  if (balanceRes.ok) {
                    const feeStatus = await balanceRes.json();
                    console.log('Finance fee status response:', feeStatus); // Debug log
                    
                    const outstanding = feeStatus?.outstanding || 0;
                    const totalPaid = feeStatus?.totalPaid || 0;
                    const totalExpected = feeStatus?.totalExpected || 0;
                    
                    console.log('Balance calculation:', { outstanding, totalPaid, totalExpected }); // Debug log
                    
                    // Calculate if overpaid (surplus)
                    const surplus = totalPaid > totalExpected ? totalPaid - totalExpected : 0;
                    
                    if (outstanding > 0) {
                      balanceInfo = {
                        title: 'Outstanding Balance',
                        value: `MK ${outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                        icon: <CreditCard size={24} />
                      };
                    } else if (surplus > 0) {
                      balanceInfo = {
                        title: 'Overpaid Balance',
                        value: `MK ${surplus.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                        icon: <Award size={24} />
                      };
                    } else {
                      balanceInfo = {
                        title: 'Balance',
                        value: 'MK 0.00',
                        icon: <DollarSign size={24} />
                      };
                    }
                    console.log('Final balance info:', balanceInfo); // Debug log
                  } else {
                    const errorText = await balanceRes.text();
                    console.error('Finance fee status API error:', errorText);
                    
                    // If the endpoint doesn't exist or access is denied, show fallback
                    if (balanceRes.status === 404 || balanceRes.status === 403) {
                      console.log('Finance fee status endpoint not accessible, showing fallback...'); // Debug log
                      // Try to get balance from payments directly
                      try {
                        // include academicCalendarId when fetching payments fallback
                        let paymentsUrl = `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/finance/payments/student/${user?.id}`;
                        try {
                          const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
                          if (cal?.id) paymentsUrl += `?academicCalendarId=${encodeURIComponent(cal.id)}`;
                        } catch {}
                        const paymentsRes = await fetch(paymentsUrl, { headers: { Authorization: `Bearer ${token}` } });
                        if (paymentsRes.ok) {
                          const paymentsData = await paymentsRes.json();
                          console.log('Payments data:', paymentsData); // Debug log
                          // This would need custom logic based on payments structure
                        }
                      } catch (err) {
                        console.error('Alternative balance fetch failed:', err);
                      }
                    }
                  }
                } else {
                  console.warn('No current term found for fee status');
                }
              } catch (balanceError) {
                console.error('Failed to fetch comprehensive fee status:', balanceError);
              }

              // Get upcoming exams count
              let upcomingExams = 0;
              try {
                const examsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/exams`, { headers: { Authorization: `Bearer ${token}` } });
                if (examsRes.ok) {
                  const exams = await examsRes.json();
                  const examsList = Array.isArray(exams) ? exams : (exams?.data || []);
                  const now = new Date();
                  upcomingExams = examsList.filter((e: any) => {
                    const examDate = new Date(e.date || e.examDate);
                    return examDate > now;
                  }).length;
                }
              } catch {}

              // Today's classes count
              let todaysClasses = 0;
              try {
                const schedulesRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/student/my-schedules?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
                if (schedulesRes.ok) {
                  const schedulesData = await schedulesRes.json();
                  const schedules = schedulesData?.schedules || [];
                  
                  // Get today's day name
                  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                  
                  // Filter schedules for today
                  todaysClasses = schedules.filter((schedule: any) => 
                    schedule.day === today
                  ).length;
                }
              } catch {}

              studentStats = [
                // Outstanding balance card removed as requested
              ];
            } catch (e) {
              studentStats = [
              ];
            }
          }
          const roleStats = {
            student: studentStats,
            finance: [], // Handled separately above
            parent: user?.parentData?.children?.flatMap((child) => [
              {
                title: `${child.name}'s Attendance`,
                value: `${child.attendance?.present || 0}%`,
                icon: <Users size={24} />,
              },
              {
                title: `${child.name}'s Classes`,
                value: `${child.courses?.length || 0}`,
                icon: <BookOpen size={24} />,
              },
              {
                title: `${child.name}'s Assignments`,
                value: `${child.assignments?.length || 0}`,
                icon: <FileText size={24} />,
              },
              {
                title: `${child.name}'s Fees Due`,
                value: `MWK${child.fees?.pending || 0}`,
                icon: <DollarSign size={24} />,
              },
            ]) || [
              {
                title: "Children Enrolled",
                value: "2",
                icon: <Users size={24} />,
              },
              {
                title: "Total courses",
                value: "12",
                icon: <BookOpen size={24} />,
              },
              {
                title: "Pending Assignments",
                value: "5",
                icon: <FileText size={24} />,
              },
              {
                title: "Total Fees Due",
                value: "MWK450",
                icon: <DollarSign size={24} />,
              },
            ],
          };

          setStats(roleStats[role] || []);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard stats";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, role, token, toast]);

  return { stats, loading, error };
};

export const DashboardStats = () => {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-36 bg-muted rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 mb-6 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Error loading dashboard statistics</span>
        </div>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={
              React.isValidElement(stat.icon)
                ? stat.icon
                : React.createElement(stat.icon, { size: 24 })
            }
            trend={stat.trend}
            className={stat.className}
          />
        ))}
      </div>
    </div>
  );
};
