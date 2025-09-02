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
  const [termId, setTermId] = useState<string | undefined>(
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
    const fetchCurrentTerm = async () => {
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
            data?.id || data?.termId || data?.currentTerm?.id;
          if (id) setTermId(id);
        }
      } catch (e) {
        console.warn("Failed to load current academic year", e);
      } finally {
        setLoadingAY(false);
      }
    };
    fetchCurrentTerm();
  }, [token]);

  useEffect(() => {
    fetchAcademicStats();
    fetchActivities();
  // Reduce polling frequency to every 20 minutes (1,200,000 ms)
  const interval = setInterval(fetchActivities, 1200000);
    return () => clearInterval(interval);
  }, [fetchActivities, fetchAcademicStats]);

  return (
    <div className="space-y-8">
      {/* Primary Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200 h-96 flex flex-col">
          <CardHeader className="pb-4 flex-shrink-0 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Fee Collection Analytics</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Current academic year performance{" "}
                  {loadingAY && (
                    <span className="text-xs text-muted-foreground">
                      (loading year...)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-6 flex-1 flex flex-col justify-between">
            <div className="flex-1 flex items-center justify-center">
              <FeeCollectionChart termId={termId} />
            </div>
            <Button 
              className="w-full"
              onClick={() => navigate("/finance/reports")}
            >
              View Detailed Report
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200 h-96 flex flex-col">
          <CardHeader className="pb-4 flex-shrink-0 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Recent Activities</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">Latest system activities and updates</CardDescription>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-6 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto space-y-3">
              {isLoadingActivities ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading activities...</p>
                  </div>
                </div>
              ) : activities.length > 0 ? (
                <>
                  {activities.slice(0,4).map((activity) => (
                    <div
                      key={activity.id}
                      className={`group flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-accent cursor-pointer transition-all duration-200 ${
                        unreadIds.has(activity.id) 
                          ? 'bg-accent/50 border-primary/20' 
                          : 'bg-card hover:bg-accent/30'
                      }`}
                      onClick={() => openActivity(activity.id)}
                    >
                      <Avatar className="h-9 w-9 ring-2 ring-border flex-shrink-0">
                        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-medium text-sm">
                          {getInitials(activity.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-foreground">
                            <span className="font-semibold">{activity.user.name}</span>{' '}
                            <span className="font-medium text-muted-foreground">
                              {activity.action.toLowerCase().replace(/_/g,' ')}
                            </span>
                          </p>
                          {unreadIds.has(activity.id) && (
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed break-words">
                          {activity.description}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-xs text-muted-foreground font-medium">
                            {new Date(activity.date).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md font-medium">
                            {activity.type}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {activities.length > 4 && (
                    <div className="pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
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
                  <div className="p-3 bg-muted rounded-full mb-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No recent activities</p>
                  <p className="text-xs text-muted-foreground mt-1">Check back later for updates</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200 h-96 flex flex-col">
          <CardHeader className="pb-4 flex-shrink-0 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Academic Performance</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Average scores by course{" "}
                  {loadingAY && (
                    <span className="text-xs text-muted-foreground">
                      (loading year...)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-6 flex-1 flex flex-col justify-between">
            <div className="flex-1 space-y-6">
              {/* Academic Statistics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-semibold text-foreground">
                    {academicStats.loading ? "..." : academicStats.totalStudents.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Total Students</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-semibold text-foreground">
                    {academicStats.loading ? "..." : academicStats.totalCourses.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Active Courses</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-semibold text-foreground">85%</div>
                  <div className="text-xs text-muted-foreground font-medium">Pass Rate</div>
                </div>
              </div>
              {/* Performance Chart */}
              <div className="flex-1 flex items-center justify-center">
                <ClassPerformanceChart termId={termId} />
              </div>
            </div>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => navigate("/reports/academic")}
            >
              View Academic Reports
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200 h-96 flex flex-col">
          <CardHeader className="pb-4 flex-shrink-0 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">System Overview</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Real-time system status and health metrics
                </CardDescription>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Users2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-6 flex-1">
            <div className="space-y-6">
              {/* System Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">System Uptime</span>
                    <span className="text-sm font-medium text-foreground">{systemHealth.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Users</span>
                    <span className="text-sm font-medium text-foreground">{systemHealth.activeUsers}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Server Status</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Backup</span>
                    <span className="text-sm font-medium text-foreground">{systemHealth.lastBackup}</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/system')}>
                    <UserCog className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
                    <Users2 className="h-4 w-4 mr-2" />
                    User Management  
                  </Button>
                </div>
              </div>
            </div>
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
