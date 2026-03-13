import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  LabelList,
  ReferenceLine,
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';
import { academicCalendarService } from '@/services/academicCalendarService';
import { Preloader } from '@/components/ui/preloader';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';
import { getAdminDashboardPalette } from './adminPalette';

const ADMIN_DASHBOARD_COLORS = getAdminDashboardPalette(
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
);

// Dynamic data fetching for charts
const useChartData = (endpoint: string, defaultData: any[] = []) => {
  const { token } = useAuth();
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError(null);
        // include active academicCalendarId when available
        let url = `${API_CONFIG.BASE_URL}${endpoint}`;
        try {
          const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
          if (cal?.id) {
            url += endpoint.includes('?') ? `&academicCalendarId=${encodeURIComponent(cal.id)}` : `?academicCalendarId=${encodeURIComponent(cal.id)}`;
          }
        } catch {}
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data from ${endpoint}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setData(defaultData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, endpoint]);

  return { data, loading, error };
};

// Sample data for charts (fallback)
export const attendanceData = [
  { name: 'Class 9A', value: 92 },
  { name: 'Class 9B', value: 88 },
  { name: 'Class 10A', value: 95 },
  { name: 'Class 10B', value: 85 },
  { name: 'Class 11A', value: 90 },
  { name: 'Class 11B', value: 93 },
];

export const performanceData = [
  { name: 'Math', students: 95, average: 78 },
  { name: 'Science', students: 90, average: 82 },
  { name: 'English', students: 88, average: 85 },
  { name: 'History', students: 85, average: 75 },
  { name: 'Computer', students: 92, average: 88 },
];

export const feeCollection = [
  { name: 'Collected', value: 75 },
  { name: 'Pending', value: 25 },
];

export const financeData = [
  { month: 'Jan', income: 45000, expenses: 38000 },
  { month: 'Feb', income: 52000, expenses: 41000 },
  { month: 'Mar', income: 48000, expenses: 39000 },
  { month: 'Apr', income: 61000, expenses: 45000 },
  { month: 'May', income: 55000, expenses: 42000 },
  { month: 'Jun', income: 67000, expenses: 48000 },
];

const COLORS = [
  ADMIN_DASHBOARD_COLORS.blue,
  ADMIN_DASHBOARD_COLORS.green,
  ADMIN_DASHBOARD_COLORS.lightGrey,
  ADMIN_DASHBOARD_COLORS.mediumGrey,
  ADMIN_DASHBOARD_COLORS.greyBlue,
  ADMIN_DASHBOARD_COLORS.greyGreen,
];
const PIE_COLORS = [ADMIN_DASHBOARD_COLORS.green, ADMIN_DASHBOARD_COLORS.blue];
const ASSIGNMENT_COLORS = [ADMIN_DASHBOARD_COLORS.greyBlue, ADMIN_DASHBOARD_COLORS.blue, ADMIN_DASHBOARD_COLORS.green];

// Dynamic Attendance Chart Component
export const AttendanceChart = () => {
  const { data: attendanceData, loading, error } = useChartData('/analytics/attendance-by-class', []);

  if (loading) return <Preloader />;
  if (error) return <div className="text-red-500">Error loading attendance data</div>;

  const processedData = attendanceData.map((item: any) => ({
    name: item.className || item.name,
    value: item.attendanceRate || item.value || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={processedData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#6B7280" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Dynamic Performance Chart Component
export const PerformanceChart = () => {
  const { data: performanceData, loading, error } = useChartData('/analytics/course-averages', []);

  if (loading) return <Preloader />;
  if (error) return <div className="text-red-500">Error loading performance data</div>;

  const processedData = performanceData.map((item: any) => ({
    name: item.courseName || item.name,
    students: item.studentCount || item.students || 0,
    average: item.averageGrade || item.average || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={processedData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="average" fill="#7AA45D" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Dynamic Finance Trend Chart Component
export const FinanceTrendChart = () => {
  const { data: financeData, loading, error } = useChartData('/finance/dashboard-data', []);

  if (loading) return <Preloader />;
  if (error) return <div className="text-red-500">Error loading finance data</div>;

  // For now, return sample data until we have historical finance data
  const sampleData = [
    { month: 'Jan', income: 45000, expenses: 38000 },
    { month: 'Feb', income: 52000, expenses: 41000 },
    { month: 'Mar', income: 48000, expenses: 39000 },
    { month: 'Apr', income: 61000, expenses: 45000 },
    { month: 'May', income: 55000, expenses: 42000 },
    { month: 'Jun', income: 67000, expenses: 48000 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={sampleData}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="income" stackId="1" stroke="#6B7280" fill="#6B7280" />
        <Area type="monotone" dataKey="expenses" stackId="1" stroke="#7AA45D" fill="#7AA45D" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const generateStudentPerformanceData = (user: any) => {
  if (!user?.studentData) {
    return [
      { name: 'Math', score: 85, average: 78 },
      { name: 'Science', score: 92, average: 82 },
      { name: 'English', score: 88, average: 85 },
      { name: 'History', score: 76, average: 75 },
      { name: 'Computer', score: 94, average: 88 },
    ];
  }
  
  return user.studentData.courses.map((course: string) => {
    const grade = user.studentData?.grades.find((g: any) => g.course === course)?.grade || '';
    let score = 0;
    
    if (grade.startsWith('A')) score = 90 + Math.floor(Math.random() * 10);
    else if (grade.startsWith('B')) score = 80 + Math.floor(Math.random() * 10);
    else if (grade.startsWith('C')) score = 70 + Math.floor(Math.random() * 10);
    else if (grade.startsWith('D')) score = 60 + Math.floor(Math.random() * 10);
    else score = 50 + Math.floor(Math.random() * 10);
    
    return {
      name: course,
      score: score,
      average: Math.min(Math.max(score - 5 - Math.floor(Math.random() * 10), 50), 95)
    };
  });
};

export const generateAssignmentStatusData = (user: any) => {
  if (!user?.studentData) {
    return [
      { name: 'Pending', value: 3 },
      { name: 'Submitted', value: 2 },
      { name: 'Graded', value: 3 }
    ];
  }
  
  const pending = user.studentData.assignments.filter((a: any) => a.status === 'pending').length;
  const submitted = user.studentData.assignments.filter((a: any) => a.status === 'submitted').length;
  const graded = user.studentData.assignments.filter((a: any) => a.status === 'graded').length;
  
  return [
    { name: 'Pending', value: pending },
    { name: 'Submitted', value: submitted },
    { name: 'Graded', value: graded }
  ];
};

export const AttendanceOverview = ({ termId }: { termId?: string }) => {
  const [attendanceData, setAttendanceData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { token } = useAuth();

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = termId ? `?termId=${termId}` : '';
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ATTENDANCE_BY_CLASS}${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      // Normalization: API may return an array or object with key
      const raw = Array.isArray(data) ? data : (data.attendanceByClass || data.attendanceOverview || []);
      const normalized = raw.map((item: any) => ({
        name: item.className || item.courseName || item.name,
        attendanceRate: item.attendanceRate ?? item.value ?? item.rate ?? 0,
      }));
      setAttendanceData(normalized);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attendance data');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (token) {
      fetchAttendanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, termId]);

  if (loading) {
    return (
      <Preloader variant="skeleton" rows={6} className="space-y-6" />
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={fetchAttendanceData}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (attendanceData.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">No attendance data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={attendanceData}
        margin={{
          top: 30,
          right: 30,
          left: 20,
          bottom: 60,
        }}
      >
        <defs>
          {/* Attendance-based gradients */}
          <linearGradient id="excellentAttendance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ADMIN_DASHBOARD_COLORS.green} stopOpacity={1} />
            <stop offset="50%" stopColor={ADMIN_DASHBOARD_COLORS.green} stopOpacity={0.9} />
            <stop offset="100%" stopColor={ADMIN_DASHBOARD_COLORS.greyGreen} stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="goodAttendance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ADMIN_DASHBOARD_COLORS.blue} stopOpacity={1} />
            <stop offset="50%" stopColor={ADMIN_DASHBOARD_COLORS.blue} stopOpacity={0.9} />
            <stop offset="100%" stopColor={ADMIN_DASHBOARD_COLORS.greyBlue} stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="improvementAttendance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ADMIN_DASHBOARD_COLORS.greyBlue} stopOpacity={1} />
            <stop offset="50%" stopColor={ADMIN_DASHBOARD_COLORS.mediumGrey} stopOpacity={0.9} />
            <stop offset="100%" stopColor={ADMIN_DASHBOARD_COLORS.lightGrey} stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="poorAttendance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ADMIN_DASHBOARD_COLORS.red} stopOpacity={1} />
            <stop offset="50%" stopColor={ADMIN_DASHBOARD_COLORS.red} stopOpacity={0.9} />
            <stop offset="100%" stopColor={ADMIN_DASHBOARD_COLORS.lightGrey} stopOpacity={0.8} />
          </linearGradient>
          
          {/* Professional shadow filter */}
          <filter id="attendanceBarShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity="0.25"/>
          </filter>
        </defs>
        
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#B0B4B3" 
          strokeOpacity={0.4}
          vertical={false}
        />
        
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fontWeight: 500, fill: '#6b7280' }}
          axisLine={{ stroke: '#B0B4B3', strokeWidth: 1 }}
          tickLine={{ stroke: '#B0B4B3' }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fontWeight: 500, fill: '#6b7280' }}
          axisLine={{ stroke: '#B0B4B3', strokeWidth: 1 }}
          tickLine={{ stroke: '#B0B4B3' }}
          label={{ 
            value: 'Attendance Rate (%)', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: '12px', fontWeight: '600', fill: '#6B7280' }
          }}
        />
        <Tooltip
          formatter={(value: number) => [`${Math.round(value)}%`, 'Attendance Rate']}
          labelFormatter={(label) => `Class: ${label}`}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            fontSize: '13px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            padding: '12px 16px'
          }}
          itemStyle={{ 
            color: '#6B7280',
            fontWeight: '600'
          }}
          labelStyle={{ 
            color: '#111827',
            fontWeight: '700',
            marginBottom: '6px'
          }}
        />
        <Bar
          dataKey="attendanceRate"
          radius={[8, 8, 0, 0]}
          stroke="#FFFFFF"
          strokeWidth={1}
          style={{ filter: "url(#attendanceBarShadow)" }}
          className="transition-all duration-300 hover:opacity-80"
        >
          {attendanceData.map((entry, index) => {
            const percentage = Math.round(entry.attendanceRate || entry.value);
            let fill;
            if (percentage >= 90) fill = 'url(#excellentAttendance)';
            else if (percentage >= 80) fill = 'url(#goodAttendance)';
            else if (percentage >= 70) fill = 'url(#improvementAttendance)';
            else fill = 'url(#poorAttendance)';
            
            return (
              <Cell
                key={`cell-${index}`}
                fill={fill}
              />
            );
          })}
          <LabelList
            dataKey="attendanceRate"
            position="top"
            formatter={(value: number) => `${Math.round(value)}%`}
            style={{ 
              fontSize: '11px', 
              fontWeight: '600',
              fill: '#6B7280'
            }}
          />
        </Bar>
        
        {/* Attendance threshold lines - updated for professional styling */}
        <ReferenceLine 
          y={90} 
          stroke={ADMIN_DASHBOARD_COLORS.green} 
          strokeDasharray="4 4" 
          strokeOpacity={0.6}
        />
        <ReferenceLine 
          y={80} 
          stroke={ADMIN_DASHBOARD_COLORS.blue} 
          strokeDasharray="4 4" 
          strokeOpacity={0.6}
        />
        <ReferenceLine 
          y={70} 
          stroke={ADMIN_DASHBOARD_COLORS.greyBlue} 
          strokeDasharray="4 4" 
          strokeOpacity={0.6}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const ClassPerformanceChart = ({ termId }: { termId?: string }) => {
  const [performanceData, setPerformanceData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { token } = useAuth();

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch classes
      const classResponse = await fetch(`${API_CONFIG.BASE_URL}/grades/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!classResponse.ok) throw new Error('Failed to fetch classes');
      const classes = await classResponse.json();

      const classAverages: Array<{ className: string; studentsCount: number; averageScore: number }> = [];

      for (const classItem of classes) {
        // Exclude graduated classes by name hint
        const name = classItem.name || classItem.className || '';
        if (/graduated|alumni|leavers/i.test(name)) continue;

        const resultsResponse = await fetch(
          `${API_CONFIG.BASE_URL}/exam-results/class/${classItem.id}${termId ? `?termId=${termId}` : ''}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!resultsResponse.ok) continue;
        const classResults = await resultsResponse.json();

        const scores: number[] = [];
        const students = new Set<string>();
        if (classResults.students && Array.isArray(classResults.students)) {
          classResults.students.forEach((studentResult: any) => {
            const sid = studentResult?.student?.id || studentResult?.studentId;
            if (sid) students.add(String(sid));
            if (studentResult.results && Array.isArray(studentResult.results)) {
              studentResult.results.forEach((result: any) => {
                const pct = result.finalPercentage;
                if (typeof pct === 'number' && pct > 0) {
                  scores.push(pct);
                }
              });
            }
          });
        }

        const avg = scores.length > 0 ? (scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
        if (avg > 0) {
          classAverages.push({
            className: name,
            studentsCount: students.size,
            averageScore: Math.round(avg * 10) / 10
          });
        }
      }

      // Sort by average descending
      classAverages.sort((a, b) => b.averageScore - a.averageScore);
      setPerformanceData(classAverages);
    } catch (err) {
      console.error('Error fetching class performance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (token) {
      fetchPerformanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, termId]);

  if (loading) {
    return (
      <Preloader variant="spinner" size="md" text="Loading performance data..." height="20rem" />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-80">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchPerformanceData}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (performanceData.length === 0) {
    return (
      <div className="flex justify-center items-center h-80">
        <p className="text-sm text-muted-foreground">No performance data available</p>
      </div>
    );
  }

  // Color function based on performance level
  const getPerformanceColor = (average: number) => {
    if (average >= 85) return 'url(#excellentGradient)';
    if (average >= 75) return 'url(#goodGradient)';
    if (average >= 65) return 'url(#averageGradient)';
    return 'url(#improvementGradient)';
  };

  return (
    <ChartContainer
      config={{
        averageScore: { 
          label: "Average Score",
          color: "hsl(var(--chart-1))"
        },
      }}
      className="h-full w-full"
    >
      <BarChart
        data={performanceData}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <defs>
          {/* Performance-based gradients */}
          <linearGradient id="excellentGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ADMIN_DASHBOARD_COLORS.green} stopOpacity={1} />
            <stop offset="100%" stopColor={ADMIN_DASHBOARD_COLORS.greyGreen} stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="goodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ADMIN_DASHBOARD_COLORS.blue} stopOpacity={1} />
            <stop offset="100%" stopColor={ADMIN_DASHBOARD_COLORS.greyBlue} stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="averageGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ADMIN_DASHBOARD_COLORS.greyBlue} stopOpacity={1} />
            <stop offset="100%" stopColor={ADMIN_DASHBOARD_COLORS.mediumGrey} stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="improvementGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ADMIN_DASHBOARD_COLORS.red} stopOpacity={1} />
            <stop offset="100%" stopColor={ADMIN_DASHBOARD_COLORS.lightGrey} stopOpacity={0.8} />
          </linearGradient>
          
          {/* Shadow filter */}
          <filter id="barShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2"/>
          </filter>
        </defs>
        
        <XAxis 
          dataKey="className" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }}
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }}
          domain={[0, 100]}
          label={{ 
            value: 'Performance (%)', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: '12px', fontWeight: '600', fill: '#6B7280' }
          }}
        />
        <ChartTooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white/98 p-4 border-none rounded-xl shadow-lg backdrop-blur-sm">
                  <p className="font-bold text-gray-900 mb-2">{label}</p>
                  <div className="space-y-1">
                    <p className="text-sm text-emerald-600 font-semibold">
                      Average Score: {data.averageScore}%
                    </p>
                    <p className="text-sm text-gray-600">
                      Students: {data.studentsCount}
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        
        <Bar 
          dataKey="averageScore" 
          name="Average Score (%)" 
          radius={[6, 6, 0, 0]}
          stroke="#FFFFFF"
          strokeWidth={1}
          style={{ filter: "url(#barShadow)" }}
          className="transition-all duration-200 hover:opacity-80"
        >
          {performanceData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getPerformanceColor(entry.averageScore)}
            />
          ))}
        </Bar>
        
        {/* Performance threshold lines */}
        <ReferenceLine 
          y={85} 
          stroke={ADMIN_DASHBOARD_COLORS.green} 
          strokeDasharray="4 4" 
          strokeOpacity={0.6}
        />
        <ReferenceLine 
          y={75} 
          stroke={ADMIN_DASHBOARD_COLORS.blue} 
          strokeDasharray="4 4" 
          strokeOpacity={0.6}
        />
        <ReferenceLine 
          y={65} 
          stroke={ADMIN_DASHBOARD_COLORS.greyBlue} 
          strokeDasharray="4 4" 
          strokeOpacity={0.6}
        />
      </BarChart>
    </ChartContainer>
  );
};

export const FeeCollectionChart = ({ termId }: { termId?: string }) => {
  const [feeData, setFeeData] = React.useState<any[]>([]);
  const [rawResponse, setRawResponse] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { token } = useAuth();

  const toNumber = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
    return 0;
  };

  const buildDataset = (data: any) => {
    // Preferred dataset: feeTypeBreakdown if present
    if (Array.isArray(data)) return data; // already array
    if (!data) return [];

    // Helper function to normalize and deduplicate fee types
    const normalizeFeeTypes = (items: any[]) => {
      const feeMap = new Map<string, number>();
      
      items.forEach((item: any) => {
        // Normalize fee type name: capitalize first letter, lowercase rest
        const rawName = (item.status || item.feeType || item.type || item.name || 'Other').toString();
        const normalizedName = rawName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .replace(/_/g, ' ');
        
        const amount = item.amount || 0;
        const currentAmount = feeMap.get(normalizedName) || 0;
        feeMap.set(normalizedName, currentAmount + amount);
      });
      
      // Convert back to array and sort by amount descending
      return Array.from(feeMap.entries())
        .map(([status, amount]) => ({ status, amount }))
        .filter(item => item.amount > 0)
        .sort((a, b) => b.amount - a.amount);
    };

    // New backend shape handling: prefer current-term breakdowns
    // 1) paymentTrends.currentTerm.byFeeType
    if (data.currentTerm && Array.isArray(data.currentTerm.byFeeType) && data.currentTerm.byFeeType.length > 0) {
      const items = data.currentTerm.byFeeType.map((f: any) => ({
        status: (f.feeType || f.type || f.name || 'Fee').toString(),
        amount: toNumber(f.totalPaid || f.amount || f.paid || 0)
      }));
      return normalizeFeeTypes(items);
    }
    // 2) paymentTrends.currentTermByFeeType
    if (data.paymentTrends && Array.isArray(data.paymentTrends.currentTermByFeeType) && data.paymentTrends.currentTermByFeeType.length > 0) {
      const items = data.paymentTrends.currentTermByFeeType.map((f: any) => ({
        status: (f.feeType || f.type || f.name || 'Fee').toString(),
        amount: toNumber(f.totalPaid || f.amount || f.paid || 0)
      }));
      return normalizeFeeTypes(items);
    }
    // 3) General feeTypeBreakdown but filter by term when possible
    const feeTypeBreakdown = data.feeTypeBreakdown || data.feeTypes || data.fee_structure;
    if (Array.isArray(feeTypeBreakdown) && feeTypeBreakdown.length > 0) {
      let items = feeTypeBreakdown;
      if (termId && items.some((x: any) => x.termId)) {
        items = items.filter((x: any) => String(x.termId) === String(termId));
      }
      const mappedItems = items.map((f: any) => ({
        status: (f.feeType || f.type || f.status || f.name || 'Fee').toString(),
        amount: toNumber(f.amount || f.totalPaid || f.expectedAmount)
      }));
      return normalizeFeeTypes(mappedItems);
    }

    // paymentTrends.byFeeType (analytics/fee-collection-status)
    if (data.paymentTrends && Array.isArray(data.paymentTrends.byFeeType) && data.paymentTrends.byFeeType.length > 0) {
      const items = data.paymentTrends.byFeeType.map((f: any) => ({
        status: (f.feeType || f.type || 'Fee').toString(),
        amount: toNumber(f.totalPaid || f.amount || 0)
      }));
      const normalized = normalizeFeeTypes(items);
      // If only one fee type, fallback to aggregated pie for better visualization
      if (normalized.length > 1) return normalized;
    }

    // paymentSummary aggregated values
    const paymentSummary = data.paymentSummary || {};
    let totalPaid = toNumber(
      paymentSummary.currentTermPaid ?? paymentSummary.totalPaid ?? paymentSummary.paid ?? data.totalPaidFees ?? data.paidFees ?? 0
    );
    let outstanding = toNumber(
      paymentSummary.currentTermOutstanding ?? paymentSummary.totalOutstanding ?? paymentSummary.outstanding ?? data.outstandingFees ?? 0
    );
    const expected = toNumber(
      paymentSummary.currentTermExpected ?? paymentSummary.totalExpected ?? paymentSummary.expected ?? data.totalExpectedFees ?? data.expectedFees ?? (totalPaid + outstanding)
    );

    // Derive if outstanding not explicitly present
    if (expected > 0 && (outstanding === 0 || Math.abs(expected - (totalPaid + outstanding)) > 1)) {
      outstanding = Math.max(expected - totalPaid, 0);
    }
    if (outstanding < 0) outstanding = 0;

    // If both zero, nothing useful
    if (totalPaid === 0 && outstanding === 0) return [];
    return [
      { status: 'Collected', amount: totalPaid },
      { status: 'Outstanding', amount: outstanding }
    ];
  };

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = termId ? `?termId=${termId}` : '';
      try {
        const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
        if (cal?.id) {
          query += (query ? `&academicCalendarId=${encodeURIComponent(cal.id)}` : `?academicCalendarId=${encodeURIComponent(cal.id)}`);
        }
      } catch {}
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FEE_COLLECTION}${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fee collection data');
      }

      const data = await response.json();
      setRawResponse(data);
      const collection = Array.isArray(data) ? data : (data.feeCollectionStatus || data.feeCollection || data);
      const normalized = buildDataset(collection).map((item: any) => ({
        status: item.status || item.name,
        amount: toNumber(item.amount ?? item.value)
      }));
      setFeeData(normalized);
    } catch (err) {
      console.error('Error fetching fee data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load fee collection data');
      setFeeData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (token) {
      fetchFeeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, termId]);

  if (loading) {
    return (
      <Preloader variant="spinner" size="md" text="Loading fee data..." height="16rem" />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchFeeData}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (feeData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center px-4">
        <p className="text-sm text-muted-foreground">No fee collection data available</p>
        {rawResponse && (
          <p className="mt-2 text-[11px] text-muted-foreground/70">
            Totals returned: paid {toNumber(rawResponse.paymentSummary?.totalPaid ?? rawResponse.totalPaidFees ?? rawResponse.paidFees)}
            , expected {toNumber(rawResponse.paymentSummary?.totalExpected ?? rawResponse.totalExpectedFees ?? rawResponse.expectedFees)}
          </p>
        )}
      </div>
    );
  }

  // Calculate total for percentage display
  const total = feeData.reduce((sum, item) => sum + item.amount, 0);
  
  // Professional color palette for fee types
  const feeColors = [
    ADMIN_DASHBOARD_COLORS.blue,
    ADMIN_DASHBOARD_COLORS.green,
    ADMIN_DASHBOARD_COLORS.greyBlue,
    ADMIN_DASHBOARD_COLORS.greyGreen,
    ADMIN_DASHBOARD_COLORS.mediumGrey,
    ADMIN_DASHBOARD_COLORS.lightGrey,
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <defs>
          {feeData.map((_, index) => (
            <linearGradient key={`gradient-${index}`} id={`feeGradient${index}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={feeColors[index % feeColors.length]} stopOpacity={1} />
              <stop offset="100%" stopColor={feeColors[index % feeColors.length]} stopOpacity={0.7} />
            </linearGradient>
          ))}
          {/* Shadow filters for depth */}
          <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="2" dy="2" result="offset" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2"/>
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        <Pie
          data={feeData}
          dataKey="amount"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={2}
          strokeWidth={2}
          stroke="#FFFFFF"
          style={{ filter: "url(#dropshadow)" }}
        >
          {feeData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={`url(#feeGradient${index})`}
              className="transition-all duration-300 hover:opacity-80"
            />
          ))}
        </Pie>
        
        <Tooltip 
          formatter={(value: number, name: string) => [
            formatCurrency(value, getDefaultCurrency()), 
            name
          ]}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            fontSize: '13px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            padding: '10px 14px'
          }}
          itemStyle={{ 
            color: '#6B7280',
            fontWeight: '600'
          }}
          labelStyle={{ 
            color: '#111827',
            fontWeight: '700',
            marginBottom: '4px'
          }}
        />
        
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value, entry: any) => {
            const percentage = ((entry.payload.amount / total) * 100).toFixed(1);
            return `${value} (${percentage}%)`;
          }}
          wrapperStyle={{
            fontSize: '12px',
            paddingTop: '10px'
          }}
        />
        
        {/* Center text showing total */}
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-base font-bold" fill={ADMIN_DASHBOARD_COLORS.greyBlue}>
          <tspan x="50%" dy="-8" className="text-xs">Total</tspan>
          <tspan x="50%" dy="20" className="text-sm font-semibold">{formatCurrency(total, getDefaultCurrency())}</tspan>
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
};

export const FinanceOverviewChart = () => (
  <ChartContainer
    config={{
      income: { theme: { light: "#111827", dark: "#111827" } },
      expenses: { theme: { light: "#6b7280", dark: "#6b7280" } },
    }}
  >
    <LineChart data={financeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
      <XAxis 
        dataKey="month" 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: '#6b7280' }}
      />
      <YAxis 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: '#6b7280' }}
        tickFormatter={(value) => formatCurrency(value, getDefaultCurrency())}
      />
      <ChartTooltip 
        content={<ChartTooltipContent />}
        contentStyle={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #B0B4B3',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          fontSize: '14px'
        }}
      />
      <Line 
        type="monotone" 
        dataKey="income" 
        stroke="#111827" 
        strokeWidth={3} 
        name="Income"
        dot={{ fill: '#111827', strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: '#111827', strokeWidth: 2, fill: '#FFFFFF' }}
      />
      <Line 
        type="monotone" 
        dataKey="expenses" 
        stroke="#6b7280" 
        strokeWidth={3} 
        name="Expenses"
        dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: '#6b7280', strokeWidth: 2, fill: '#FFFFFF' }}
      />
    </LineChart>
  </ChartContainer>
);

export const ClassStudentsRatioChart = ({ termId }: { termId?: string }) => {
  const [classData, setClassData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { token } = useAuth();
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const fetchClassData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new class-counts endpoint to get real student counts per class
      let url = `${API_CONFIG.BASE_URL}/student/class-counts`;
      try {
        const cal = await academicCalendarService.getActiveAcademicCalendar(token!);
        if (cal?.id) {
          url += `?academicCalendarId=${encodeURIComponent(cal.id)}&excludeGraduated=true`;
        }
      } catch {}
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch class student counts');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.classCounts)) {
        const formattedData = data.classCounts.map((item: any) => ({
          className: item.className || 'Unknown Class',
          studentCount: item.studentCount || 0,
        }));
        // Filter out classes with 0 students and graduated-like labels
        const filteredData = formattedData
          .filter(item => item.studentCount > 0)
          .filter(item => !/graduated|alumni|leavers/i.test(item.className));
        setClassData(filteredData);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      console.error('Error fetching class data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load class students data');
      setClassData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchClassData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId]);

  if (loading) {
    return (
      <Preloader variant="spinner" size="md" text="Loading class data..." height="20rem" />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-80">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchClassData}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (classData.length === 0) {
    return (
      <div className="flex justify-center items-center h-80">
        <p className="text-sm text-muted-foreground">No class data available</p>
      </div>
    );
  }

  // Prepare data: sort by student count desc, compute percent
  const total = classData.reduce((s, c) => s + (c.studentCount || 0), 0) || 1;
  const prepared = [...classData]
    .map(c => ({ ...c, studentCount: Number(c.studentCount || 0) }))
    .sort((a, b) => b.studentCount - a.studentCount)
    .map((c) => ({
      ...c,
      percent: Math.round(((c.studentCount || 0) / total) * 1000) / 10, // one decimal
      label: `${c.studentCount} (${Math.round(((c.studentCount||0)/total)*100)}%)`
    }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={prepared}
        margin={{ top: 10, right: 20, left: 20, bottom: 60 }}
        barCategoryGap="8%"
      >
        <defs>
          {/* Professional gradient for class enrollment */}
          <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ADMIN_DASHBOARD_COLORS.blue} stopOpacity={1} />
            <stop offset="35%" stopColor={ADMIN_DASHBOARD_COLORS.greyBlue} stopOpacity={0.92} />
            <stop offset="70%" stopColor={ADMIN_DASHBOARD_COLORS.mediumGrey} stopOpacity={0.88} />
            <stop offset="100%" stopColor={ADMIN_DASHBOARD_COLORS.lightGrey} stopOpacity={0.82} />
          </linearGradient>
          
          {/* Premium shadow filter */}
          <filter id="enrollmentShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.25"/>
          </filter>
          
          {/* Glow effect for bars */}
          <filter id="barGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#B0B4B3" 
          strokeOpacity={0.3}
          vertical={false}
        />
        <XAxis
          dataKey="className"
          axisLine={{ stroke: '#B0B4B3', strokeWidth: 1 }}
          tickLine={{ stroke: '#B0B4B3' }}
          tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
          angle={-35}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis
          axisLine={{ stroke: '#B0B4B3', strokeWidth: 1 }}
          tickLine={{ stroke: '#B0B4B3' }}
          tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
          domain={[0, 'dataMax + 2']}
          label={{ 
            value: 'Student Count', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: '12px', fontWeight: '600', fill: '#6B7280' }
          }}
        />
        <Tooltip
          formatter={(value: number, name: string, props: any) => [
            `${value} students`, 
            'Class Enrollment',
            `${props.payload?.percent}% of total`
          ]}
          labelFormatter={(label) => `Class: ${label}`}
          contentStyle={{
            backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.96)' : 'rgba(255, 255, 255, 0.98)',
            border: `1px solid ${isDarkMode ? '#6B7280' : '#B0B4B3'}`,
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            fontSize: '13px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            padding: '12px 16px'
          }}
          itemStyle={{ 
            color: isDarkMode ? '#FFFFFF' : '#6B7280',
            fontWeight: '600'
          }}
          labelStyle={{ 
            color: isDarkMode ? '#FFFFFF' : '#111827',
            fontWeight: '700',
            marginBottom: '6px'
          }}
        />
        <Bar
          dataKey="studentCount"
          fill="url(#enrollmentGradient)"
          name="Students"
          radius={[8, 8, 0, 0]}
          stroke="#FFFFFF"
          strokeWidth={1}
          style={{ filter: "url(#enrollmentShadow)" }}
          className="transition-all duration-300 hover:opacity-80"
          barSize={40}
          animationDuration={1000}
          animationBegin={200}
        >
          {prepared.map((entry, idx) => (
            <Cell 
              key={`cell-${idx}`} 
              style={{ filter: idx % 2 === 0 ? "url(#barGlow)" : "none" }}
            />
          ))}
        </Bar>
        
        {/* Enhanced label display */}
        <LabelList 
          dataKey="label" 
          position="top" 
          style={{ 
            fontSize: 10, 
            fill: '#6B7280',
            fontWeight: '600'
          }} 
        />
        
        {/* Average enrollment line */}
        <ReferenceLine 
          y={Math.round(total / prepared.length)} 
          stroke={ADMIN_DASHBOARD_COLORS.blue} 
          strokeDasharray="5 5" 
          strokeOpacity={0.7}
          strokeWidth={2}
        />
        
        {/* Class size thresholds */}
        <ReferenceLine 
          y={35} 
          stroke={ADMIN_DASHBOARD_COLORS.greyBlue} 
          strokeDasharray="3 3" 
          strokeOpacity={0.5}
        />
        
        <Legend 
          verticalAlign="top" 
          height={32}
          iconType="rect"
          wrapperStyle={{
            fontSize: '12px',
            fontWeight: '500',
            color: isDarkMode ? '#FFFFFF' : '#6B7280'
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};export const StudentPerformanceChart = ({ data }: { data: any[] }) => (
  <ChartContainer
    config={{
      score: { theme: { light: "#6B7280", dark: "#6B7280" } },
      average: { theme: { light: "#6B7280", dark: "#6B7280" } },
    }}
  >
    <BarChart
      data={data}
      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
    >
      <XAxis dataKey="name" />
      <YAxis />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Bar dataKey="score" fill="var(--color-score)" name="Your Score" radius={[4, 4, 0, 0]} />
      <Bar dataKey="average" fill="var(--color-average)" name="Class Average" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ChartContainer>
);

export const AssignmentStatusChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        fill="#6B7280"
        paddingAngle={5}
        dataKey="value"
        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={ASSIGNMENT_COLORS[index % ASSIGNMENT_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

// Student Attendance Trend Chart - shows attendance over time periods
export const StudentAttendanceTrendChart = () => {
  const { user, token } = useAuth();
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentAttendance = async () => {
      if (!token || !user || user.role !== 'student') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch real student attendance data
        const response = await fetch(`${API_CONFIG.BASE_URL}/student/attendance-trend`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAttendanceData(data);
        } else {
          // Fallback to mock data if endpoint doesn't exist
          throw new Error('Endpoint not available');
        }
      } catch (err) {
        console.log('Using mock attendance trend data for student dashboard');
        // Generate realistic mock data based on current date and user context
        const currentDate = new Date();
        const mockData = Array.from({ length: 6 }, (_, i) => {
          const date = new Date(currentDate);
          date.setMonth(date.getMonth() - (5 - i));
          
          // Create more realistic attendance patterns
          let baseRate = 90; // Start with 90% base
          
          // Add seasonal variations (lower in winter months)
          if (date.getMonth() === 0 || date.getMonth() === 1 || date.getMonth() === 11) {
            baseRate -= 5; // Winter months typically have lower attendance
          }
          
          // Add slight random variation but keep it realistic
          const variation = (Math.random() - 0.5) * 8; // ±4% variation
          const attendanceRate = Math.max(75, Math.min(98, baseRate + variation));
          
          const daysInMonth = 20; // Approximate school days per month
          const presentDays = Math.round((attendanceRate / 100) * daysInMonth);
          
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            attendanceRate: Math.round(attendanceRate * 10) / 10, // One decimal place
            present: presentDays,
            absent: daysInMonth - presentDays,
            total: daysInMonth
          };
        });
        setAttendanceData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAttendance();
  }, [token, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Preloader variant="spinner" size="md" text="Loading attendance..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-sm text-red-600 mb-2">Failed to load attendance data</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={attendanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis 
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
          label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          formatter={(value: number) => [`${value}%`, 'Attendance Rate']}
          labelStyle={{ color: '#6B7280' }}
        />
        <Line 
          type="monotone" 
          dataKey="attendanceRate" 
          stroke="#7AA45D" 
          strokeWidth={3}
          dot={{ fill: '#7AA45D', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#7AA45D', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Student Grade Trend Chart - shows grade progression over time
export const StudentGradeTrendChart = ({ 
  studentId, 
  token, 
  resultsData 
}: { 
  studentId?: string; 
  token?: string | null; 
  resultsData?: any[];
}) => {
  const { user, token: contextToken } = useAuth();
  const [gradeData, setGradeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeToken = token || contextToken;
  const activeStudentId = studentId || user?.id;

  useEffect(() => {
    const fetchStudentGrades = async () => {
      if (!activeToken || !activeStudentId || user?.role !== 'student') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // If resultsData is provided (from dashboard), use it directly
        if (resultsData && resultsData.length > 0) {
          // Transform results data into trend format
          // Group by time period if available, otherwise show current snapshot
          const trendData = [{
            month: 'Current',
            ...resultsData.reduce((acc, course) => {
              acc[course.name] = course.score;
              return acc;
            }, {} as any)
          }];
          setGradeData(trendData);
          setLoading(false);
          return;
        }
        
        // Try to fetch real student grade trend data from backend
        const response = await fetch(`${API_CONFIG.BASE_URL}/student/grade-trend`, {
          headers: {
            'Authorization': `Bearer ${activeToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setGradeData(data);
        } else {
          // Fallback: try to fetch exam results and build trend
          try {
            const resultsResponse = await fetch(`${API_CONFIG.BASE_URL}/exam-results/student/me`, {
              headers: {
                'Authorization': `Bearer ${activeToken}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (resultsResponse.ok) {
              const resultsJson = await resultsResponse.json();
              const results = resultsJson?.results || [];
              
              if (results.length > 0) {
                // Create a single data point from current results
                const currentGrades = {
                  month: 'Current Term',
                  ...results.reduce((acc: any, r: any) => {
                    acc[r.courseName || r.courseCode] = r.finalPercentage || 0;
                    return acc;
                  }, {})
                };
                setGradeData([currentGrades]);
              } else {
                throw new Error('No results available');
              }
            } else {
              throw new Error('Unable to fetch data');
            }
          } catch (fallbackError) {
            throw new Error('No grade data available');
          }
        }
      } catch (err) {
        console.log('Using display message for grade trend:', err);
        setError('No historical grade data available yet');
        setGradeData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentGrades();
  }, [activeToken, activeStudentId, user?.role, resultsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Preloader variant="spinner" size="md" text="Loading grades..." />
      </div>
    );
  }

  if (error || gradeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-sm text-muted-foreground mb-2">{error || 'No grade data available'}</p>
      </div>
    );
  }

  const subjects = gradeData.length > 0 ? Object.keys(gradeData[0]).filter(key => key !== 'month') : [];
  const colors = ['#1B88CE', '#7AA45D', '#F5A623', '#DC2626', '#6B7280', '#6B7280'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={gradeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis 
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
          label={{ value: 'Grade %', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          formatter={(value: number, name: string) => [`${value}%`, name]}
          labelStyle={{ color: '#6B7280' }}
        />
        <Legend />
        {subjects.map((subject, index) => (
          <Line 
            key={subject}
            type="monotone" 
            dataKey={subject} 
            stroke={colors[index % colors.length]} 
            strokeWidth={2}
            dot={{ strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};