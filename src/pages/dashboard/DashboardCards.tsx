import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, TrendingUp, AlertTriangle, CheckCircle, Clock, Users2, UserCog, GraduationCap, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AttendanceOverview,
  ClassPerformanceChart,
  FeeCollectionChart,
  FinanceOverviewChart,
  StudentPerformanceChart,
  AssignmentStatusChart,
  generateAssignmentStatusData,
  generateStudentPerformanceData,
} from "./DashboardCharts";
import { API_CONFIG } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@radix-ui/react-progress";

export const AdminDashboardCards = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [academicYearId, setAcademicYearId] = useState<string | undefined>(
    undefined
  );
  const [loadingAY, setLoadingAY] = useState<boolean>(false);
  const [systemHealth, setSystemHealth] = useState({
    uptime: "99.9%",
    activeUsers: 234,
    serverStatus: "operational",
    lastBackup: "2 hours ago"
  });

  // Academic Performance state
  const [academicStats, setAcademicStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    overallAverage: 0,
    loading: true
  });

  // Recent Activities state
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  const fetchAcademicStats = useCallback(async () => {
    try {
      setAcademicStats(prev => ({ ...prev, loading: true }));
      
      const [studentsRes, coursesRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/student/total-students`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_CONFIG.BASE_URL}/course/stats/total-courses`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const studentsData = studentsRes.ok ? await studentsRes.json() : { totalStudents: 0 };
      const coursesData = coursesRes.ok ? await coursesRes.json() : { value: 0 };

      setAcademicStats({
        totalStudents: studentsData.totalStudents || 0,
        totalCourses: coursesData.value || 0,
        overallAverage: 0, // This could be calculated from performance data
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch academic stats:', error);
      setAcademicStats(prev => ({ ...prev, loading: false }));
    }
  }, [token]);

  const buildDescription = useCallback((log: any): string => {
    if (!log) return "";
    if (log.action?.includes('fee payment') && log.newValues) {
      const amount = log.newValues.amount || log.metadata?.dto?.amount;
      const student = log.newValues.studentName || log.metadata?.dto?.studentId || 'student';
      return `processed fee payment of ${amount} for ${student}`;
    }
    if (log.level === 'error') {
      return log.metadata?.errorMessage || log.metadata?.description || 'system error occurred';
    }
    if (log.studentCreated?.fullName) {
      return `${log.action.toLowerCase().replace(/_/g,' ')}: ${log.studentCreated.fullName}`;
    }
    return log.metadata?.description || (log.action ? log.action.toLowerCase().replace(/_/g,' ') : '');
  }, []);

  const fetchActivities = useCallback(async () => {
    if (!token) {
      setIsLoadingActivities(false);
      return;
    }

    try {
      setIsLoadingActivities(true);
      // Flexible endpoint - adapt if your API has a different path
      const res = await fetch(`${API_CONFIG.BASE_URL}/activities/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // If endpoint is unavailable, clear activities gracefully
        setActivities([]);
        setUnreadIds(new Set<string>());
        return;
      }

      const data = await res.json();
      const raw = Array.isArray(data) ? data : data.activities || data.logs || [];

      const normalized = raw.map((item: any) => {
        const id = item.id || item._id || item.logId || `${item.timestamp}-${Math.random()}`;
        const userName = item.user?.name || item.userName || item.actor?.name || 'System';
        const avatar = item.user?.avatar || item.actor?.avatar || '';
        const action = item.action || item.type || item.name || 'activity';
        const description = buildDescription(item);
        const date = item.timestamp || item.date || item.createdAt || new Date().toISOString();
        const type = item.type || item.category || (item.level || 'system');
        const unread = item.unread === true || item.read === false;

        return {
          id,
          user: { name: userName, avatar },
          action,
          description,
          date,
          type,
          unread,
        };
      });

      setActivities(normalized);
      const unreadSet = new Set<string>(
        normalized
          .filter((a: any) => a.unread)
          .map((a: any) => a.id)
      );
      setUnreadIds(unreadSet);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      setActivities([]);
      setUnreadIds(new Set<string>());
    } finally {
      setIsLoadingActivities(false);
    }
  }, [token, buildDescription]);

  const openActivity = (id: string) => {
    setUnreadIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    navigate(`/activities/${id}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create') || lowerAction.includes('add') || lowerAction.includes('enroll')) return 'text-green-600 dark:text-green-400';
    if (lowerAction.includes('update') || lowerAction.includes('edit') || lowerAction.includes('grade') || lowerAction.includes('submit')) return 'text-blue-600 dark:text-blue-400';
    if (lowerAction.includes('delete') || lowerAction.includes('remove') || lowerAction.includes('cancel')) return 'text-red-600 dark:text-red-400';
    if (lowerAction.includes('login') || lowerAction.includes('logout')) return 'text-purple-600 dark:text-purple-400';
    if (lowerAction.includes('payment') || lowerAction.includes('invoice') || lowerAction.includes('process')) return 'text-emerald-600 dark:text-emerald-400';
    if (lowerAction.includes('export') || lowerAction.includes('import') || lowerAction.includes('generate') || lowerAction.includes('report')) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  useEffect(() => {
    const fetchCurrentAcademicYear = async () => {
      if (!token) return;
      try {
        setLoadingAY(true);
        const res = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CURRENT_ACADEMIC_YEAR}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          // Accept flexible key names
          const id =
            data?.id || data?.academicYearId || data?.currentAcademicYear?.id;
          if (id) setAcademicYearId(id);
        }
      } catch (e) {
        console.warn("Failed to load current academic year", e);
      } finally {
        setLoadingAY(false);
      }
    };
    fetchCurrentAcademicYear();
  }, [token]);

  useEffect(() => {
    fetchAcademicStats();
    fetchActivities();
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, [fetchActivities, fetchAcademicStats]);

  return (
    <div className="space-y-8">
      {/* Primary Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white via-blue-50/30 to-blue-100/50 dark:from-gray-900 dark:via-blue-900/10 dark:to-blue-900/20 border-blue-200/50 shadow-lg h-96 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Fee Collection Analytics</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Current academic year performance{" "}
                  {loadingAY && (
                    <span className="text-xs text-muted-foreground">
                      (loading year...)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 flex-1 flex flex-col justify-between">
            <div className="flex-1 flex items-center justify-center">
              <FeeCollectionChart academicYearId={academicYearId} />
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              onClick={() => navigate("/finance/reports")}
            >
              View Detailed Report
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-gray-50/30 to-gray-100/50 dark:from-gray-900 dark:via-gray-800/10 dark:to-gray-800/20 border-gray-200/50 shadow-lg h-96 flex flex-col">
          <CardHeader className="pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Activities</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Latest system activities and updates</p>
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-800/30 rounded-full">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto space-y-3 pr-2">
              {isLoadingActivities ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading activities...</p>
                  </div>
                </div>
              ) : activities.length > 0 ? (
                <>
                  {activities.slice(0,4).map((activity) => (
                    <div
                      key={activity.id}
                      className={`group flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        unreadIds.has(activity.id) 
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                          : 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => openActivity(activity.id)}
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-gray-200 dark:ring-gray-700 flex-shrink-0">
                        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                          {getInitials(activity.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
                            <span className="font-semibold">{activity.user.name}</span>{' '}
                            <span className={`ml-1 font-medium ${getActionColor(activity.action)}`}>
                              {activity.action.toLowerCase().replace(/_/g,' ')}
                            </span>
                          </p>
                          {unreadIds.has(activity.id) && (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">New</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug break-words line-clamp-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                            {new Date(activity.date).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium">
                            {activity.type}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  {activities.length > 4 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        onClick={() => navigate('/activities')}
                      >
                        View All Activities
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No recent activities found</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Check back later for updates</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white via-green-50/30 to-green-100/50 dark:from-gray-900 dark:via-green-900/10 dark:to-green-900/20 border-green-200/50 shadow-lg h-96 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Academic Performance</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Average scores by course{" "}
                  {loadingAY && (
                    <span className="text-xs text-muted-foreground">
                      (loading year...)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 flex-1 flex flex-col justify-between">
            <div className="flex-1 space-y-4">
              {/* Academic Statistics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="space-y-1">
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {academicStats.loading ? "..." : academicStats.totalStudents.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Students</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {academicStats.loading ? "..." : academicStats.totalCourses}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Courses</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {academicStats.loading ? "..." : "85%"}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Avg Performance</div>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="flex-1 flex items-center justify-center">
                <ClassPerformanceChart academicYearId={academicYearId} />
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
              onClick={() => navigate("/reports/academic")}
            >
              View Academic Reports
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-purple-50/30 to-purple-100/50 dark:from-gray-900 dark:via-purple-900/10 dark:to-purple-900/20 border-purple-200/50 shadow-lg h-96 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Attendance Insights</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Current month attendance by class{" "}
                  {loadingAY && (
                    <span className="text-xs text-muted-foreground">
                      (loading year...)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Users2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 flex-1 flex flex-col justify-center">
            <div className="flex-1 flex items-center justify-center">
              <AttendanceOverview academicYearId={academicYearId} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Additional Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Monitoring Card */}
        <Card className="bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/50 dark:from-gray-900 dark:via-emerald-900/10 dark:to-emerald-900/20 border-emerald-200/50 shadow-lg h-96 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">System Health</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Real-time system monitoring & status
                </CardDescription>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 flex-1 flex flex-col justify-between">
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</span>
                    <Badge variant="default" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {systemHealth.uptime}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{systemHealth.activeUsers}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Server Status</span>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                        {systemHealth.serverStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Backup</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{systemHealth.lastBackup}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Database Performance</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">97%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '97%' }}></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Storage Usage</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">73%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '73%' }}></div>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
              onClick={() => navigate("/admin/system-monitoring")}
            >
              View System Details
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Staff Performance & Management Card */}
        <Card className="bg-gradient-to-br from-white via-orange-50/30 to-orange-100/50 dark:from-gray-900 dark:via-orange-900/10 dark:to-orange-900/20 border-orange-200/50 shadow-lg h-96 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Staff Overview</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Performance metrics and staff management
                </CardDescription>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <UserCog className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 flex-1 flex flex-col justify-between">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="space-y-1">
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">24</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Teachers</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">8</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Admin</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">3</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Support</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg bg-background/50 border border-orange-100 dark:border-orange-900/30">
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                      <Star className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Top Performer</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Dr. Sarah Johnson</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-xs">
                    98.5%
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">96.2%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Staff</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">28/35</span>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20"
              onClick={() => navigate("/admin/staff-management")}
            >
              Manage Staff
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const FinanceDashboardCards = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
          <CardDescription>Monthly financial overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <FinanceOverviewChart />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>Current academic year collection</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-64 w-64">
            <FeeCollectionChart />
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button
            className="w-full"
            onClick={() => navigate("/finance/reports")}
          >
            View Financial Details
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">John Smith - Grade 10</p>
                <p className="text-sm text-muted-foreground">
                  Tuition Fee Payment
                </p>
              </div>
              <span className="text-green-600 font-medium">+$1,200</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Sarah Johnson - Grade 8</p>
                <p className="text-sm text-muted-foreground">
                  Book Fee Payment
                </p>
              </div>
              <span className="text-green-600 font-medium">+$150</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Office Supplies</p>
                <p className="text-sm text-muted-foreground">
                  Administrative Expense
                </p>
              </div>
              <span className="text-red-600 font-medium">-$450</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Outstanding Payments</CardTitle>
          <CardDescription>Students with pending fees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Michael Brown</p>
                <p className="text-sm text-muted-foreground">
                  Grade 9 - Due: Dec 15
                </p>
              </div>
              <Badge variant="destructive">$800</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Emily Davis</p>
                <p className="text-sm text-muted-foreground">
                  Grade 11 - Due: Dec 20
                </p>
              </div>
              <Badge variant="destructive">$650</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
              <div>
                <p className="font-medium">Alex Wilson</p>
                <p className="text-sm text-muted-foreground">
                  Grade 7 - Due: Dec 25
                </p>
              </div>
              <Badge variant="destructive">$450</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ParentDashboardCards = () => {
  const { user } = useAuth();

  if (!user?.parentData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {user.parentData.children.map((child) => (
        <React.Fragment key={child.id}>
          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
            <CardHeader>
              <CardTitle>{child.name}'s Performance</CardTitle>
              <CardDescription>Latest grades in all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {child.grades.map((grade, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 rounded-lg bg-background/50"
                  >
                    <span className="font-medium">{grade.course}</span>
                    <Badge
                      variant={
                        grade.grade.startsWith("A")
                          ? "default"
                          : grade.grade.startsWith("B")
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {grade.grade}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
            <CardHeader>
              <CardTitle>{child.name}'s Attendance</CardTitle>
              <CardDescription>Current academic year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Present</span>
                  <span className="text-green-600">
                    {child.attendance.present}%
                  </span>
                </div>
                <Progress value={child.attendance.present} className="h-2" />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {child.attendance.absent}
                    </div>
                    <div className="text-sm text-muted-foreground">Absent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {child.attendance.late}
                    </div>
                    <div className="text-sm text-muted-foreground">Late</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {child.attendance.total}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Days
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </React.Fragment>
      ))}
    </div>
  );
};

export const StudentDashboardCards = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const studentPerformanceData = generateStudentPerformanceData(user);
  const assignmentStatusData = generateAssignmentStatusData(user);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>My Performance</CardTitle>
          <CardDescription>
            Course scores compared to class average
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <StudentPerformanceChart data={studentPerformanceData} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Assignment Status</CardTitle>
          <CardDescription>Overview of your assignments</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-64 w-64">
            <AssignmentStatusChart data={assignmentStatusData} />
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button className="w-full" onClick={() => navigate("/assignments")}>
            View All Assignments
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const TeacherDashboardCards = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
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
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const [classesData, attendanceData] = await Promise.all([
          fetchData("/teacher/my-upcoming-classes"),
          fetchData("/teacher/my-attendance-today"),
        ]);

        setClasses(classesData.classes || []);
        setAttendance(attendanceData.attendance || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load teacher dashboard data";
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

    if (user?.role === "teacher") {
      fetchTeacherData();
    }
  }, [user, token, toast]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, index) => (
          <div
            key={index}
            className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Class Attendance</CardTitle>
          <CardDescription>Today's attendance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendance.map((record, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 rounded-lg bg-background/50"
              >
                <div>
                  <p className="font-medium">
                    {record.className} - {record.courseName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {record.enrolledStudents} students enrolled
                  </p>
                </div>
                <Badge
                  variant={
                    record.presentStudents >= record.enrolledStudents * 0.9
                      ? "default"
                      : "secondary"
                  }
                >
                  {record.presentStudents} present
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-900/50">
        <CardHeader>
          <CardTitle>Upcoming Classes</CardTitle>
          <CardDescription>Your schedule for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="flex justify-between items-center p-3 rounded-lg bg-background/50"
              >
                <div>
                  <p className="font-medium">{cls.courseName}</p>
                  <p className="text-sm text-muted-foreground">
                    {cls.className} • {cls.room}
                  </p>
                </div>
                <span className="text-sm font-medium">{cls.startTime}</span>
              </div>
            ))}
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button
            className="w-full"
            onClick={() => navigate("/teacher/schedules")}
          >
            View Full Schedule
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
