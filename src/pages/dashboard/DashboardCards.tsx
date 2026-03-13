import React, { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from '@/config/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, TrendingUp, AlertTriangle, CheckCircle, Clock, Users2, UserCog, GraduationCap, Star, RefreshCcw, Loader2, Filter, DollarSign, CreditCard } from "lucide-react";
import { formatCurrency, getCurrencySymbol, getDefaultCurrency } from "@/lib/currency";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';

// In‑memory simple cache to avoid repeated loads within session
const teacherPerfCache: Record<string, any> = {};

// New Teacher Performance Card with filtering & pagination
const TeacherPerformanceCard: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [termId, setTermId] = React.useState<string | undefined>();
  const [passThreshold, setPassThreshold] = React.useState<number>(50);
  const [page, setPage] = React.useState(1);
  const pageSize = 5;
  const [allTeachers, setAllTeachers] = React.useState<any[]>([]);
  // Keep raw list for local filtering so UI reacts instantly without always re-fetching
  const [rawTeachers, setRawTeachers] = React.useState<any[]>([]);
  // Cache only by scope (term) so threshold changes can be applied client-side
  const cacheKey = `${termId||'current'}`;

  // Local filter utility: prefer passRate, fallback to avgGrade
  const applyFilter = React.useCallback((list: any[], threshold: number) => {
    if (!Array.isArray(list)) return [];
    const t = Math.max(0, Math.min(100, Number(threshold) || 0));
    return list.filter((item) => {
      const metric = typeof item?.passRate === 'number' ? item.passRate : (item?.avgGrade ?? 0);
      return metric >= t;
    });
  }, []);

  const paginated = React.useMemo(()=> {
    const start = (page-1)*pageSize;
    return allTeachers.slice(0, expanded ? allTeachers.length : start + pageSize);
  }, [allTeachers, page, pageSize, expanded]);

  const fetchData = React.useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      if (teacherPerfCache[cacheKey]) {
        const cached = teacherPerfCache[cacheKey];
        setData(cached);
        const list = cached.teachers || [];
        setRawTeachers(list);
        setAllTeachers(applyFilter(list, passThreshold));
        setLoading(false);
        return;
      }
      const params = new URLSearchParams();
      if (termId) params.append('termId', termId);
      // Server may support threshold too; keep sending it, but UI filters locally regardless
      params.append('passThreshold', passThreshold.toString());
      // get more than first page for local pagination
      params.append('limit', '100');
      // include academicCalendarId if available (merge into same query set)
      try {
        const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
        if (cal?.id) params.append('academicCalendarId', cal.id);
      } catch {}
      const url = `${API_CONFIG.BASE_URL}/analytics/teacher-performance?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      teacherPerfCache[cacheKey] = json; // cache
      setData(json);
      const list = json.teachers || [];
      setRawTeachers(list);
      setAllTeachers(applyFilter(list, passThreshold));
      setPage(1);
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [token, termId, passThreshold, cacheKey, applyFilter]);

  React.useEffect(()=> { fetchData(); }, [fetchData]);

  // Re-apply local filters instantly when threshold changes (or when new raw data arrives)
  React.useEffect(() => {
    setAllTeachers(applyFilter(rawTeachers, passThreshold));
    setPage(1);
  }, [passThreshold, rawTeachers, applyFilter]);

  const teachers = allTeachers;
  const top = data?.topPerformer;

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Teacher Performance</CardTitle>
            <CardDescription className="flex items-center space-x-2">
              <span>Student outcome metrics</span>
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="icon" variant="ghost" onClick={fetchData} className="h-8 w-8" title="Refresh">
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min={0}
                max={100}
                value={passThreshold}
                onChange={(e)=> {
                  const val = Number(e.target.value);
                  const clamped = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
                  setPassThreshold(clamped);
                }}
                onKeyDown={(e)=> { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                onBlur={()=> {
                  // No need to refetch just to apply threshold; local filter already applied
                  setPage(1);
                }}
                className="w-16 h-8 text-xs border rounded px-1 bg-white dark:bg-card"
                title="Pass % threshold"
              />
              <Button size="icon" variant="ghost" onClick={()=> { setPage(1); }} className="h-8 w-8" title="Apply Filters">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-2 rounded-full" style={{ backgroundColor: `${ADMIN_DASHBOARD_COLORS.blue}22` }}>
              <UserCog className="h-5 w-5" style={{ color: ADMIN_DASHBOARD_COLORS.blue }} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 flex-1 flex flex-col overflow-hidden">
        {loading && (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: ADMIN_DASHBOARD_COLORS.blue }} /></div>
        )}
        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground space-y-2">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={fetchData}>Retry</Button>
          </div>
        )}
        {!loading && !error && (
          <div className="flex flex-col h-full">
            {top ? (
              <div className="flex justify-between items-center p-2 mb-3 rounded-lg bg-background/50 border" style={{ borderColor: `${ADMIN_DASHBOARD_COLORS.lightGrey}66` }}>
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ADMIN_DASHBOARD_COLORS.blue}, ${ADMIN_DASHBOARD_COLORS.greyBlue})` }}>
                    <Star className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Top Performer</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{top.firstName} {top.lastName}</p>
                  </div>
                </div>
                <Badge variant="default" className="text-xs" style={{ backgroundColor: `${ADMIN_DASHBOARD_COLORS.green}26`, color: ADMIN_DASHBOARD_COLORS.green }}>
                  {top.avgGrade}%
                </Badge>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mb-2">No performance data yet</div>
            )}
            <div className="text-xs text-muted-foreground mb-2 flex justify-between items-center">
              <span>Showing {paginated.length} / {teachers.length} teachers</span>
              <div className="flex items-center space-x-2">
                <select
                  value={termId || ''}
                  onChange={(e)=> setTermId(e.target.value || undefined)}
                  onBlur={()=> fetchData()}
                  className="h-7 text-xs border rounded px-1 bg-white dark:bg-card"
                >
                  <option value="">Current Term</option>
                  {/* Additional term options can be dynamically loaded later */}
                </select>
                {data?.metadata?.termId && <span className="truncate">Term scope</span>}
              </div>
            </div>
            <div className="flex-1 overflow-auto pr-1 space-y-2">
              {paginated.map((t:any) => (
                <div key={t.teacherId} className="p-2 border rounded-md bg-white/60 dark:bg-card/80" style={{ borderColor: `${ADMIN_DASHBOARD_COLORS.lightGrey}66` }}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{t.firstName} {t.lastName}</span>
                    <span className="text-xs" style={{ color: ADMIN_DASHBOARD_COLORS.blue }}>Avg {t.avgGrade}%</span>
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Pass</span> {t.passRate}%</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Students</span> {t.studentCount}</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Grades</span> {t.gradeCount}</div>
                  </div>
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded mt-2">
                    <div className="h-1 rounded" style={{ background: `linear-gradient(90deg, ${ADMIN_DASHBOARD_COLORS.blue}, ${ADMIN_DASHBOARD_COLORS.green})`, width: `${Math.min(t.avgGrade,100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between items-center">
              {teachers.length > pageSize && (
                <div className="flex items-center space-x-2 text-xs">
                  <Button variant="ghost" size="sm" disabled={page===1} onClick={()=> setPage(p=> Math.max(1,p-1))}>Prev</Button>
                  <span>Page {page} / {Math.max(1, Math.ceil(teachers.length / pageSize))}</span>
                  <Button variant="ghost" size="sm" disabled={page>=Math.ceil(teachers.length / pageSize)} onClick={()=> setPage(p=> p+1)}>Next</Button>
                </div>
              )}
              {teachers.length > pageSize && (
                <Button variant="ghost" size="sm" className="h-7" onClick={()=> setExpanded(e=> !e)}>
                  {expanded ? 'Collapse All' : 'Expand All'}
                </Button>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-2"
              style={{ borderColor: `${ADMIN_DASHBOARD_COLORS.lightGrey}88` }}
              onClick={() => navigate('/admin/staff-management')}
            >
              Manage Staff
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import {
  AttendanceOverview,
  ClassPerformanceChart,
  ClassStudentsRatioChart,
  FeeCollectionChart,
  FinanceOverviewChart,
  StudentPerformanceChart,
  StudentGradeTrendChart,
  
} from "./DashboardCharts";
import { getAdminDashboardPalette } from "./adminPalette";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@radix-ui/react-progress";
import { ExamResultService } from "@/services/examResultService";
import { systemHealthService, SystemHealthData } from "@/services/systemHealthService";

const ADMIN_DASHBOARD_COLORS = getAdminDashboardPalette(
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
);

export const AdminDashboardCards = () => {
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const navigate = useNavigate();
  const { token } = useAuth();
  const [termId, setTermId] = useState<string | undefined>(
    undefined
  );
  const [loadingAY, setLoadingAY] = useState<boolean>(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData>({
    uptime: "Unknown",
    activeUsers: 0,
    serverStatus: "unknown",
    lastBackup: "Unknown",
    databasePerformance: 0,
    storageUsage: 0
  });
  const [systemHealthLoading, setSystemHealthLoading] = useState<boolean>(false);

  // Academic Performance state
  const [academicStats, setAcademicStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    overallAverage: 0,
    loading: true
  });

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

      // Calculate overall average from exam results instead of analytics endpoint
      let overallAverage = 0;
      try {
        // Get average from exam results across all classes
        const classResponse = await fetch(`${API_CONFIG.BASE_URL}/grades/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (classResponse.ok) {
          const classes = await classResponse.json();
          const allScores: number[] = [];

          // Process each class to get exam results and calculate overall average
          for (const classItem of classes) {
            try {
              const resultsResponse = await fetch(
                `${API_CONFIG.BASE_URL}/exam-results/class/${classItem.id}${termId ? `?termId=${termId}` : ''}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (resultsResponse.ok) {
                const classResults = await resultsResponse.json();
                
                if (classResults.students && Array.isArray(classResults.students)) {
                  classResults.students.forEach((studentResult: any) => {
                    if (studentResult.results && Array.isArray(studentResult.results)) {
                      studentResult.results.forEach((result: any) => {
                        if (typeof result.finalPercentage === 'number' && result.finalPercentage > 0) {
                          allScores.push(result.finalPercentage);
                        }
                      });
                    }
                  });
                }
              }
            } catch (classError) {
              console.warn(`Failed to fetch results for class ${classItem.id}:`, classError);
            }
          }

          if (allScores.length > 0) {
            overallAverage = Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length);
          }
        }
      } catch (error) {
        console.warn('Failed to calculate overall average from exam results:', error);
        // Keep overallAverage as 0
      }

      setAcademicStats({
        totalStudents: studentsData.totalStudents || 0,
        totalCourses: coursesData.value || 0,
        overallAverage,
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch academic stats:', error);
      setAcademicStats(prev => ({ ...prev, loading: false }));
    }
  }, [token, termId]);

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
          const text = await res.text();
          if (text) {
            const data = JSON.parse(text);
            // Accept flexible key names
            const id = data?.id || data?.termId || data?.currentTerm?.id;
            if (id) setTermId(id);
          } // else: no content, skip
        }
      } catch (e) {
        console.warn("Failed to load current academic year", e);
      } finally {
        setLoadingAY(false);
      }
    };
    fetchCurrentTerm();
  }, [token]);

  // Fetch system health data
  const fetchSystemHealth = useCallback(async () => {
    if (!token) return;
    
    try {
      setSystemHealthLoading(true);
      const healthData = await systemHealthService.getSystemHealth(token);
      setSystemHealth(healthData);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      // Keep using default/fallback data on error
    } finally {
      setSystemHealthLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAcademicStats();
    fetchSystemHealth();
    
    // Set up periodic refresh for system health (every 30 seconds)
    const healthInterval = setInterval(() => {
      fetchSystemHealth();
    }, 30000);
    
    return () => {
      clearInterval(healthInterval);
    };
  }, [fetchAcademicStats, fetchSystemHealth]);

  return (
    <div className="space-y-8">
      {/* Primary Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-96 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Fee Collection Analytics</CardTitle>
                <CardDescription>
                  Current term fee collection and payment patterns{" "}
                  {loadingAY && (
                    <span className="text-xs text-muted-foreground">
                      (loading year...)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${ADMIN_DASHBOARD_COLORS.blue}1f` }}>
                <TrendingUp className="h-4 w-4" style={{ color: ADMIN_DASHBOARD_COLORS.blue }} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 flex-1 flex flex-col justify-center">
            <div className="flex-1 flex items-center justify-center">
              <FeeCollectionChart termId={termId} />
            </div>
          </CardContent>
        </Card>

        <Card className="h-96 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Class Students Ratio</CardTitle>
                <CardDescription>
                  Student distribution by class{" "}
                  {loadingAY && (
                    <span className="text-xs text-muted-foreground">
                      (loading year...)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${ADMIN_DASHBOARD_COLORS.blue}1f` }}>
                <Users2 className="h-4 w-4" style={{ color: ADMIN_DASHBOARD_COLORS.blue }} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="flex-1 flex items-start justify-center">
              <div className="w-full h-full">
                <ClassStudentsRatioChart termId={termId} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-96 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Academic Performance</CardTitle>
                <CardDescription>
                  Average scores by class{" "}
                  {loadingAY && (
                    <span className="text-xs text-muted-foreground">
                      (loading year...)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${ADMIN_DASHBOARD_COLORS.green}24` }}>
                <GraduationCap className="h-4 w-4" style={{ color: ADMIN_DASHBOARD_COLORS.green }} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 flex-1 flex flex-col justify-between">
            <div className="flex-1 space-y-4">
              {/* Academic Statistics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="space-y-1">
                  <div className="text-xl font-bold" style={{ color: isDarkMode ? '#FFFFFF' : ADMIN_DASHBOARD_COLORS.black }}>
                    {academicStats.loading ? "..." : academicStats.totalStudents.toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ color: ADMIN_DASHBOARD_COLORS.grey }}>Total Students</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold" style={{ color: isDarkMode ? '#FFFFFF' : ADMIN_DASHBOARD_COLORS.black }}>
                    {academicStats.loading ? "..." : academicStats.totalCourses}
                  </div>
                  <div className="text-xs" style={{ color: ADMIN_DASHBOARD_COLORS.grey }}>Total Courses</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold" style={{ color: ADMIN_DASHBOARD_COLORS.green }}>
                    {academicStats.loading ? "..." : academicStats.overallAverage ? `${academicStats.overallAverage}%` : "N/A"}
                  </div>
                  <div className="text-xs" style={{ color: ADMIN_DASHBOARD_COLORS.grey }}>Avg Performance</div>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="flex-1 flex items-center justify-center">
                <ClassPerformanceChart termId={termId} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-96 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Attendance Insights</CardTitle>
                <CardDescription>
                  Class attendance overview{" "}
                  {loadingAY && (
                    <span className="text-xs text-muted-foreground">
                      (loading year...)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${ADMIN_DASHBOARD_COLORS.greyBlue}24` }}>
                <Users2 className="h-4 w-4" style={{ color: ADMIN_DASHBOARD_COLORS.greyBlue }} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 flex-1 flex flex-col justify-center">
            <div className="flex-1 flex items-center justify-center">
              <AttendanceOverview termId={termId} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Additional Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Monitoring Card */}
        <Card className="h-96 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">System Health</CardTitle>
                <CardDescription>
                  Real-time system monitoring & status
                  {systemHealthLoading && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (updating...)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={fetchSystemHealth} 
                  className="h-8 w-8" 
                  title="Refresh system health data"
                  disabled={systemHealthLoading}
                >
                  <RefreshCcw className={`h-4 w-4 ${systemHealthLoading ? 'animate-spin' : ''}`} />
                </Button>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${ADMIN_DASHBOARD_COLORS.green}24` }}>
                  <CheckCircle className="h-4 w-4" style={{ color: ADMIN_DASHBOARD_COLORS.green }} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 flex-1 flex flex-col justify-between">
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</span>
                    <Badge variant="default" style={{ backgroundColor: `${ADMIN_DASHBOARD_COLORS.green}26`, color: ADMIN_DASHBOARD_COLORS.green }}>
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
                      <div className={`h-2 w-2 rounded-full ${
                        systemHealth.serverStatus === 'operational' || systemHealth.serverStatus === 'healthy' 
                          ? 'animate-pulse' 
                          : systemHealth.serverStatus === 'warning' 
                          ? 'animate-pulse' 
                          : 'animate-pulse'
                      }`} style={{
                        backgroundColor:
                          systemHealth.serverStatus === 'operational' || systemHealth.serverStatus === 'healthy'
                            ? ADMIN_DASHBOARD_COLORS.green
                            : systemHealth.serverStatus === 'warning'
                            ? ADMIN_DASHBOARD_COLORS.accent
                            : ADMIN_DASHBOARD_COLORS.red,
                      }}></div>
                      <span className="text-sm font-medium capitalize" style={{
                        color:
                          systemHealth.serverStatus === 'operational' || systemHealth.serverStatus === 'healthy'
                            ? ADMIN_DASHBOARD_COLORS.green
                            : systemHealth.serverStatus === 'warning'
                            ? ADMIN_DASHBOARD_COLORS.accent
                            : ADMIN_DASHBOARD_COLORS.red,
                      }}>
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
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{systemHealth.databasePerformance}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        systemHealth.databasePerformance >= 95
                          ? ADMIN_DASHBOARD_COLORS.green
                          : systemHealth.databasePerformance >= 80
                          ? ADMIN_DASHBOARD_COLORS.accent
                          : ADMIN_DASHBOARD_COLORS.red,
                      width: `${systemHealth.databasePerformance}%`,
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Storage Usage</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{systemHealth.storageUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        systemHealth.storageUsage <= 70
                          ? ADMIN_DASHBOARD_COLORS.blue
                          : systemHealth.storageUsage <= 85
                          ? ADMIN_DASHBOARD_COLORS.accent
                          : ADMIN_DASHBOARD_COLORS.red,
                      width: `${systemHealth.storageUsage}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

  {/* Teacher Performance Card (dynamic) */}
  <TeacherPerformanceCard />
      </div>
    </div>
  );
};

export const FinanceDashboardCards = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [financeData, setFinanceData] = useState<any>(null);
  const [paymentMethodsData, setPaymentMethodsData] = useState<any[]>([]);
  const [outstandingFeesBreakdown, setOutstandingFeesBreakdown] = useState<any[]>([]);
  const [revenueTrendsData, setRevenueTrendsData] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching finance data from:', `${API_CONFIG.BASE_URL}/finance/dashboard-data`);
        let calParam = '';
        try {
          const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
          if (cal?.id) calParam = `?academicCalendarId=${encodeURIComponent(cal.id)}`;
        } catch {}
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/finance/dashboard-data${calParam}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch finance data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Finance data received:', data);
        setFinanceData(data);
      } catch (err) {
        console.error('Finance data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load finance data');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchFinanceData();
    }
  }, [token]);

  // Fetch analytics data for charts
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setAnalyticsLoading(true);
        
        // Fetch payment methods distribution
        const paymentMethodsResponse = await fetch(`${API_CONFIG.BASE_URL}/finance/payment-methods-distribution${calParam}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (paymentMethodsResponse.ok) {
          const paymentMethodsResult = await paymentMethodsResponse.json();
          console.log('Payment methods data:', paymentMethodsResult);
          
          // Transform backend data to chart format
          const chartData = paymentMethodsResult.map((item: any, index: number) => ({
            name: item.method || item.paymentMethod,
            value: parseFloat(item.percentage),
            color: ['#7AA45D', '#1B88CE', '#F5A623', '#6B7280', '#DC2626'][index % 5]
          }));
          setPaymentMethodsData(chartData);
        }

        // Fetch outstanding fees breakdown
        const outstandingFeesResponse = await fetch(`${API_CONFIG.BASE_URL}/finance/outstanding-fees-breakdown${calParam}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (outstandingFeesResponse.ok) {
          const outstandingFeesResult = await outstandingFeesResponse.json();
          console.log('Outstanding fees breakdown:', outstandingFeesResult);
          setOutstandingFeesBreakdown(outstandingFeesResult);
        }

        // Fetch revenue trends
        const revenueTrendsResponse = await fetch(`${API_CONFIG.BASE_URL}/finance/revenue-trends${calParam}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (revenueTrendsResponse.ok) {
          const revenueTrendsResult = await revenueTrendsResponse.json();
          console.log('Revenue trends:', revenueTrendsResult);
          setRevenueTrendsData(revenueTrendsResult);
        }

      } catch (err) {
        console.error('Analytics data fetch error:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    if (token) {
      fetchAnalyticsData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-transparent dark:border-border">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Error loading dashboard statistics
              </h3>
              <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
              <div className="text-sm text-red-500 dark:text-red-400 mb-4">
                <p>API Endpoint: {API_CONFIG.BASE_URL}/finance/dashboard-data</p>
                <p>Please check:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Backend server is running on port 5000</li>
                  <li>Finance module is properly configured</li>
                  <li>User has appropriate permissions</li>
                  <li>Network connectivity</li>
                </ul>
              </div>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="bg-white hover:bg-red-50 border-red-300"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use real revenue trends data or fallback
  const revenueChartData = revenueTrendsData.length > 0 ? revenueTrendsData : [
    { month: 'Jan', revenue: 45000, target: 50000 },
    { month: 'Feb', revenue: 52000, target: 55000 },
    { month: 'Mar', revenue: 48000, target: 50000 },
    { month: 'Apr', revenue: financeData?.monthlyRevenue || 61000, target: 60000 },
    { month: 'May', revenue: 55000, target: 58000 },
    { month: 'Jun', revenue: 67000, target: 65000 },
  ];

  // Use fallback data if analytics haven't loaded yet
  const displayPaymentMethodsData = paymentMethodsData.length > 0 ? paymentMethodsData : [
    { name: 'Loading...', value: 100, color: '#6B7280' }
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Trends and Expense Analytics - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Revenue Trends</CardTitle>
                <CardDescription>
                  Monthly revenue vs targets
                </CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${formatCurrency(Number(value), getDefaultCurrency())}`, '']} />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#1B88CE" fill="#1B88CE" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="target" stackId="2" stroke="#7AA45D" fill="#7AA45D" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Expense Analytics</CardTitle>
                <CardDescription>
                  Key expense metrics and trends
                </CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="mb-4">
                <TrendingUp className="h-12 w-12 mx-auto text-indigo-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Expense Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  View detailed expense analytics, budget utilization, and spending trends
                </p>
              </div>
              <Button
                onClick={() => navigate('/expense-analytics')}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                View Analytics
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Payment Methods</CardTitle>
                <CardDescription>
                  Distribution of payment methods used
                </CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayPaymentMethodsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => analyticsLoading ? 'Loading...' : `${name}: ${value}%`}
                  >
                    {displayPaymentMethodsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Fees Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Outstanding Fees by Class</CardTitle>
                <CardDescription>
                  Outstanding fees breakdown by class
                </CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {analyticsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-2">Loading breakdown...</p>
                </div>
              ) : outstandingFeesBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={outstandingFeesBreakdown}>
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${getCurrencySymbol(getDefaultCurrency())}${Number(value).toLocaleString()}`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${formatCurrency(Number(value), getDefaultCurrency())}`, 'Outstanding Fees']}
                      labelStyle={{ color: '#111827' }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#F5A623" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-600 dark:text-gray-400">No outstanding fees data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
              <CardDescription>
                Latest payment activities
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/finance/transactions")}>
              View All
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {financeData?.recentTransactions?.slice(0, 5).map((transaction: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-card rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-transparent dark:border dark:border-border rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.studentName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.paymentType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(transaction.amount, getDefaultCurrency())}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(transaction.paymentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recent transactions</p>
            )}
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
          <Card className="">
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

          <Card className="">
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
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // My Performance: load real data from backend (exam results + course averages)
  const [perfLoading, setPerfLoading] = useState<boolean>(true);
  const [perfError, setPerfError] = useState<string | null>(null);
  const [studentPerformanceData, setStudentPerformanceData] = useState<any[]>([]);
  const [avgPercentage, setAvgPercentage] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user || user.role !== 'student' || !token) { setPerfLoading(false); return; }
      try {
        setPerfLoading(true); setPerfError(null);
        // Use 'me' alias instead of user.id for student endpoints
        const studentId = 'me';
        
        // Fetch exam results for this student
        const resultsResp = await ExamResultService.getStudentResults(studentId, token);
        const results = resultsResp?.results || [];
        
        // Build chart data from results
        // For "class average", we'll use a baseline comparison or omit if not available
        const chartData = results.map((r: any) => {
          return {
            name: r.courseName || r.courseCode || 'Course',
            score: typeof r.finalPercentage === 'number' ? r.finalPercentage : 0,
            average: 0, // Will be updated below if course averages are accessible
          };
        });

        // Skip course averages for students (403 Forbidden - admin only endpoint)
        // Students will see their individual scores without class averages
        console.log('Displaying student scores without class averages (admin-only data)');

        setStudentPerformanceData(chartData);
        
        if (results.length > 0) {
          const avgPct = results.reduce((s: number, r: any) => s + (Number(r.finalPercentage) || 0), 0) / results.length;
          setAvgPercentage(Math.round(avgPct * 10) / 10);
        } else {
          setAvgPercentage(null);
        }
      } catch (e: any) {
        console.warn('Student performance data unavailable', e);
        setPerfError(e?.message || 'Unable to load performance data');
        setStudentPerformanceData([]);
        setAvgPercentage(null);
      } finally {
        setPerfLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  return (
    <div className="space-y-6">
      {/* Single Row - Both Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="">
          <CardHeader>
            <CardTitle>My Performance</CardTitle>
            <CardDescription>
              Course scores compared to class/course averages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {perfLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : studentPerformanceData.length > 0 ? (
              <div className="h-80">
                <StudentPerformanceChart data={studentPerformanceData} />
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
                {perfError || 'No performance data yet'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                Grade Progress
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{avgPercentage != null ? `${avgPercentage}%` : '—'}</div>
                <div className="text-xs text-muted-foreground">Average</div>
              </div>
            </CardTitle>
            <CardDescription>
              Your academic progress across subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {perfLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : studentPerformanceData.length > 0 ? (
              <div className="h-80">
                <StudentGradeTrendChart studentId={user?.id} token={token} resultsData={studentPerformanceData} />
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
                {perfError || 'No grade data yet'}
              </div>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <Button 
              variant="outline" 
              className="w-full border-blue-200 hover:bg-blue-50" 
              onClick={() => navigate("/grades")}
            >
              View Grade Reports
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const TeacherDashboardCards = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (url: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}${url}`, {
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

  // Get current day name
  const getCurrentDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    const dayName = days[today];
    console.log('Current day calculation:', { todayIndex: today, dayName, fullDate: new Date().toISOString() });
    return dayName;
  };

  // Normalize day name for comparison
  const normalizeDayName = (dayName: string) => {
    if (!dayName) return '';
    // Handle both full names and abbreviations
    const dayMap: { [key: string]: string } = {
      'mon': 'Monday', 'monday': 'Monday',
      'tue': 'Tuesday', 'tuesday': 'Tuesday',
      'wed': 'Wednesday', 'wednesday': 'Wednesday',
      'thu': 'Thursday', 'thursday': 'Thursday',
      'fri': 'Friday', 'friday': 'Friday',
      'sat': 'Saturday', 'saturday': 'Saturday',
      'sun': 'Sunday', 'sunday': 'Sunday'
    };
    return dayMap[dayName.toLowerCase()] || dayName;
  };

  // Calculate weekly and today's class counts
  const getClassCounts = () => {
    if (!weeklySchedule.length) {
      console.log('No weekly schedule data available');
      return { weekly: 0, today: 0 };
    }

    const today = getCurrentDayName();
    console.log('Current day:', today);
    console.log('Weekly schedule:', weeklySchedule);

    let weeklyCount = 0;
    let todayCount = 0;

    weeklySchedule.forEach(day => {
      console.log(`Day: ${day.day}, Items:`, day.items);
      if (day.items && Array.isArray(day.items)) {
        weeklyCount += day.items.length;
        if (normalizeDayName(day.day) === today) {
          todayCount = day.items.length;
          console.log(`Found ${todayCount} classes for today (${today})`);
        }
      }
    });

    console.log(`Total weekly: ${weeklyCount}, Today: ${todayCount}`);
    return { weekly: weeklyCount, today: todayCount };
  };

  // Get today's classes
  const getTodaysClasses = () => {
    if (!weeklySchedule.length) {
      console.log('No weekly schedule data for today\'s classes');
      return [];
    }

    const today = getCurrentDayName();
    console.log('Getting classes for today:', today);

    const todayData = weeklySchedule.find(day => normalizeDayName(day.day) === today);
    console.log('Today\'s data:', todayData);

    const classes = todayData?.items || [];
    console.log('Today\'s classes:', classes);

    return classes;
  };

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          throw new Error("Authentication token not found");
        }

        // Fetch profile to get teacherId
        const profileResponse = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to load profile');
        }

        const profile = await profileResponse.json();
        const teacherId = profile.teacherId || user.id;

        // Fetch weekly schedule
        const scheduleResponse = await fetch(`${API_CONFIG.BASE_URL}/schedules/teacher/${teacherId}/weekly`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          console.log('Weekly schedule data:', scheduleData); // Debug log
          setWeeklySchedule(scheduleData.days || []);
        } else {
          console.error('Failed to fetch weekly schedule:', scheduleResponse.status, scheduleResponse.statusText);
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
            className="h-64 bg-gray-100 dark:bg-card rounded-lg animate-pulse"
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
      {/* Student Performance Chart */}
      <Card className="h-72">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Student Performance
          </CardTitle>
          <CardDescription>
            Performance trends across your classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={attendance.map((item, index) => ({
                  class: item.className ? `${item.className} - ${item.courseName || 'Course'}` : `Class ${index + 1}`,
                  performance: Math.round((item.presentStudents / Math.max(item.enrolledStudents, 1)) * 100),
                  attendance: Math.round((item.presentStudents / Math.max(item.enrolledStudents, 1)) * 100)
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
              >
                <XAxis 
                  dataKey="class" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                  width={30}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-card p-3 rounded-lg shadow-lg border border-gray-200 dark:border-border">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                          <p className="text-sm text-blue-600">Performance: {payload[0]?.value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="performance"
                  stroke="#1B88CE"
                  strokeWidth={2}
                  fill="url(#performanceGradient)"
                  name="Performance"
                />
                <defs>
                  <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B88CE" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1B88CE" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="h-72">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Today's Classes</CardTitle>
              <CardDescription>
                {getCurrentDayName()}'s schedule
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Same refresh logic as above
                setLoading(true);
                setError(null);
                if (user?.role === "teacher") {
                  const fetchTeacherData = async () => {
                    try {
                      if (!token) {
                        throw new Error("Authentication token not found");
                      }

                      const profileResponse = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });

                      if (!profileResponse.ok) {
                        throw new Error('Failed to load profile');
                      }

                      const profile = await profileResponse.json();
                      const teacherId = profile.teacherId || user.id;

                      const scheduleResponse = await fetch(`${API_CONFIG.BASE_URL}/schedules/teacher/${teacherId}/weekly`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });

                      if (scheduleResponse.ok) {
                        const scheduleData = await scheduleResponse.json();
                        console.log('Refreshed weekly schedule data:', scheduleData);
                        setWeeklySchedule(scheduleData.days || []);
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
                          : "Failed to refresh teacher dashboard data";
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
                  fetchTeacherData();
                }
              }}
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getTodaysClasses().length > 0 ? (
              <>
                {getTodaysClasses().slice(0, 2).map((cls) => (
                  <div
                    key={cls.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-background/50"
                  >
                    <div>
                      <p className="font-medium">{cls.course?.name || 'Course'}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.class?.name || 'Class'} • {cls.classroom?.name || 'Room TBA'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{cls.startTime} - {cls.endTime}</span>
                    </div>
                  </div>
                ))}
                {getTodaysClasses().length > 2 && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate("/my-schedule")}
                    >
                      View All {getTodaysClasses().length} Classes
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  <p className="text-sm">No classes scheduled for {getCurrentDayName()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Classes */}
      <Card className="h-72">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Weekly schedule overview</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLoading(true);
                setError(null);
                // Re-fetch data
                if (user?.role === "teacher") {
                  const fetchTeacherData = async () => {
                    try {
                      if (!token) {
                        throw new Error("Authentication token not found");
                      }

                      // Fetch profile to get teacherId
                      const profileResponse = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });

                      if (!profileResponse.ok) {
                        throw new Error('Failed to load profile');
                      }

                      const profile = await profileResponse.json();
                      const teacherId = profile.teacherId || user.id;

                      // Fetch weekly schedule
                      const scheduleResponse = await fetch(`${API_CONFIG.BASE_URL}/schedules/teacher/${teacherId}/weekly`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });

                      if (scheduleResponse.ok) {
                        const scheduleData = await scheduleResponse.json();
                        console.log('Refreshed weekly schedule data:', scheduleData);
                        setWeeklySchedule(scheduleData.days || []);
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
                          : "Failed to refresh teacher dashboard data";
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
                  fetchTeacherData();
                }
              }}
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Day breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">This Week:</h4>
              {weeklySchedule.map((day) => (
                <div key={day.day} className="flex justify-between items-center text-sm">
                  <span className={`font-medium ${normalizeDayName(day.day) === getCurrentDayName() ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    {day.day}
                  </span>
                  <Badge variant={normalizeDayName(day.day) === getCurrentDayName() ? "default" : "outline"}>
                    {day.items?.length || 0} {day.items?.length === 1 ? 'class' : 'classes'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Trends Chart */}
      <Card className="h-72">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users2 className="mr-2 h-5 w-5" />
            Attendance Trends
          </CardTitle>
          <CardDescription>
            Weekly attendance patterns by class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attendance.map(item => ({
                  class: item.className && item.courseName ? `${item.className} - ${item.courseName}` : (item.className || 'Class'),
                  rate: Math.round((item.presentStudents / Math.max(item.enrolledStudents, 1)) * 100),
                  present: item.presentStudents,
                  total: item.enrolledStudents
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
              >
                <XAxis 
                  dataKey="class" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                  width={30}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-card p-3 rounded-lg shadow-lg border border-gray-200 dark:border-border">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                          <p className="text-sm text-green-600">
                            {data.present}/{data.total} students ({data.rate}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="rate"
                  fill="url(#attendanceGradient)"
                  name="Attendance Rate"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7AA45D" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7AA45D" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
