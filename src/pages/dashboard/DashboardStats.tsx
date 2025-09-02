import React, { useEffect, useState } from "react";
import StatCard from "@/components/dashboard/StatCard";
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

export const useDashboardStats = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const role = user?.role;
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (url: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1${url}`, {
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
            fetchData("/student/total-students"),
            fetchData("/course/stats/total-courses"),
            fetchData("/finance/total-finances"),
            fetchData("/teacher/total-teachers"),
          ]);

          setStats([
            {
              title: "Total Students",
              value: studentsData.totalStudents?.toLocaleString() || "0",
              icon: <Users size={20} />,
              trend: { value: 12, isPositive: true },
              className: "bg-card border border-card-border hover:shadow-md transition-all duration-200",
            },
            {
              title: "Total Courses",
              value: coursesData.value?.toString() || "0",
              icon: <BookOpen size={20} />,
              trend: coursesData.trend || { value: 0, isPositive: true },
              className: "bg-card border border-card-border hover:shadow-md transition-all duration-200",
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
              icon: <UserCheck size={20} />,
              trend: { value: 100, isPositive: true },
              className: "bg-card border border-card-border hover:shadow-md transition-all duration-200",
            },
            {
              title: "Fee Collection",
              value: financesData.totalRevenue || "$0",
              icon: <DollarSign size={20} />,
              trend: { value: 8, isPositive: false },
              className: "bg-card border border-card-border hover:shadow-md transition-all duration-200",
            },
          ]);
        } else if (role === "teacher") {
          const [studentsCountData, coursesData] = await Promise.all([
            fetchData("/teacher/my-students/count"),
            fetchData("/teacher/my-courses/count"),
          ]);

          setStats([
            {
              title: "My Students",
              value: studentsCountData.totalStudents?.toLocaleString() || "0",
              icon: <Users size={24} />,
              className: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10",
            },
            {
              title: "My Courses",
              value: coursesData.totalCourses?.toString() || "0",
              icon: <BookOpen size={24} />,
              className: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10",
            },
            {
              title: "My Classes",
              value: user?.teacherData?.classes?.length?.toString() || "5",
              icon: <Calendar size={24} />,
              className: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10",
            },
            {
              title: "Today's Classes",
              value: "3",
              icon: <Calendar size={24} />,
              className: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10",
            },
          ]);
        } else {
          // Handle other roles (student, finance, parent)
          const roleStats = {
            student: [
              {
                title: "My Courses",
                value: user?.studentData?.courses?.length?.toString() || "6",
                icon: <BookOpen size={24} />,
                className: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10",
              },
              {
                title: "Assignments",
                value: user?.studentData?.assignments?.length?.toString() || "8",
                icon: <FileText size={24} />,
                className: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10",
              },
              {
                title: "Class Rank",
                value: "3",
                icon: <Award size={24} />,
                className: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10",
              },
              {
                title: "Today's Classes",
                value: "4",
                icon: <Calendar size={24} />,
                className: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10",
              },
            ],
            finance: [
              {
                title: "Monthly Revenue",
                value: "$67,000",
                icon: <TrendingUp size={24} />,
                trend: { value: 15, isPositive: true },
                className: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10",
              },
              {
                title: "Outstanding Fees",
                value: "$12,450",
                icon: <DollarSign size={24} />,
                trend: { value: 8, isPositive: false },
                className: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10",
              },
              {
                title: "Payments Today",
                value: "23",
                icon: <CreditCard size={24} />,
                className: "bg-gradient-to-br from-green-200 to-green-100 dark:from-green-900/20 dark:to-green-900/10",
              },
              {
                title: "Collection Rate",
                value: "94%",
                icon: <UserCheck size={24} />,
                trend: { value: 2, isPositive: true },
                className: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10",
              },
            ],
            parent: user?.parentData?.children?.flatMap((child) => [
              {
                title: `${child.name}'s Attendance`,
                value: `${child.attendance?.present || 0}%`,
                icon: <Users size={24} />,
                className: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10",
              },
              {
                title: `${child.name}'s Classes`,
                value: `${child.courses?.length || 0}`,
                icon: <BookOpen size={24} />,
                className: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10",
              },
              {
                title: `${child.name}'s Assignments`,
                value: `${child.assignments?.length || 0}`,
                icon: <FileText size={24} />,
                className: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10",
              },
              {
                title: `${child.name}'s Fees Due`,
                value: `$${child.fees?.pending || 0}`,
                icon: <DollarSign size={24} />,
                className: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10",
              },
            ]) || [
              {
                title: "Children Enrolled",
                value: "2",
                icon: <Users size={24} />,
                className: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10",
              },
              {
                title: "Total courses",
                value: "12",
                icon: <BookOpen size={24} />,
                className: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10",
              },
              {
                title: "Pending Assignments",
                value: "5",
                icon: <FileText size={24} />,
                className: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10",
              },
              {
                title: "Total Fees Due",
                value: "$450",
                icon: <DollarSign size={24} />,
                className: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10",
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Key Metrics</h2>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl animate-pulse shadow-lg"
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">Key Metrics</h2>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={
              React.isValidElement(stat.icon)
                ? stat.icon
                : React.createElement(stat.icon, { size: 20 })
            }
            trend={stat.trend}
            className={stat.className}
          />
        ))}
      </div>
    </div>
  );
};