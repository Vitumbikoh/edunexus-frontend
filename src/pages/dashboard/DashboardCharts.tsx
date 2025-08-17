import React from 'react';
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
  Line
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

// Sample data for charts
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

const COLORS = ['#0088FE', '#FFBB28', '#00C49F', '#FF8042', '#8884D8', '#82ca9d'];
const PIE_COLORS = ['#10B981', '#F97316'];
const ASSIGNMENT_COLORS = ['#f97316', '#3b82f6', '#10b981'];

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

export const AttendanceOverview = ({ academicYearId }: { academicYearId?: string }) => {
  const [attendanceData, setAttendanceData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { token } = useAuth();

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
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
  }, [token, academicYearId]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
            </div>
            <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
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
    <div className="space-y-6">
      {attendanceData.map((item: any) => (
        <div key={item.courseName || item.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{item.courseName || item.name}</span>
            <span className="text-sm font-medium">{Math.round(item.attendanceRate || item.value)}%</span>
          </div>
          <Progress 
            value={item.attendanceRate || item.value} 
            className="h-2" 
            indicatorClassName={`bg-gradient-to-r ${
              (item.attendanceRate || item.value) >= 90 ? 'from-green-400 to-green-500' :
              (item.attendanceRate || item.value) >= 80 ? 'from-blue-400 to-blue-500' :
              'from-orange-400 to-orange-500'
            }`}
          />
        </div>
      ))}
    </div>
  );
};

export const ClassPerformanceChart = ({ academicYearId }: { academicYearId?: string }) => {
  const [performanceData, setPerformanceData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { token } = useAuth();

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLASS_PERFORMANCE}${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch class performance data');
      }

      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.courseAverages || data.classPerformance || []);
      const normalized = raw.map((item: any) => ({
        courseName: item.courseName || item.name,
        studentsCount: item.studentsCount ?? item.students ?? item.studentCount ?? 0,
        averageScore: item.averageScore ?? item.average ?? item.score ?? 0,
      }));
      setPerformanceData(normalized);
    } catch (err) {
      console.error('Error fetching performance data:', err);
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
  }, [token, academicYearId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="text-muted-foreground">Loading performance data...</div>
      </div>
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

  return (
    <ChartContainer
      config={{
        students: { theme: { light: "#0ea5e9", dark: "#0ea5e9" } },
        average: { theme: { light: "#f97316", dark: "#f97316" } },
      }}
    >
      <BarChart
        data={performanceData}
        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
      >
        <XAxis dataKey="courseName" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="studentsCount" fill="var(--color-students)" name="Students" radius={[4, 4, 0, 0]} />
        <Bar dataKey="averageScore" fill="var(--color-average)" name="Class Average" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
};

export const FeeCollectionChart = ({ academicYearId }: { academicYearId?: string }) => {
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
    if (Array.isArray(data.feeTypeBreakdown) && data.feeTypeBreakdown.length > 0) {
      return data.feeTypeBreakdown.map((f: any) => ({
        status: f.feeType || f.status || f.name,
        amount: toNumber(f.amount)
      }));
    }
    // Fallback: use totalPaid vs outstanding (ensure non-negative)
    const totalPaid = toNumber(data.totalPaidFees || data.paidFees);
    let outstanding = toNumber(data.outstandingFees);
    const expected = toNumber(data.totalExpectedFees || data.expectedFees);
    // If outstanding negative due to expected being 0 but payments exist, clamp to 0
    if (outstanding < 0) outstanding = 0;
    // If expected > 0 but outstanding 0 and totalPaid < expected, recompute
    if (expected > 0 && outstanding === 0 && totalPaid < expected) {
      outstanding = Math.max(expected - totalPaid, 0);
    }
    // If both zero, nothing to show
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

      const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
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
  }, [token, academicYearId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">Loading fee data...</div>
      </div>
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
          <p className="mt-2 text-[11px] text-muted-foreground/70">Totals returned: paid {toNumber(rawResponse.totalPaidFees || rawResponse.paidFees)}, expected {toNumber(rawResponse.totalExpectedFees || rawResponse.expectedFees)}</p>
        )}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={feeData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={feeData.length > 1 ? 5 : 0}
          dataKey="amount"
          label={({status, percent, amount}) => `${status} ${amount ? ((percent * 100).toFixed(0) + '%') : ''}`}
        >
          {feeData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const FinanceOverviewChart = () => (
  <ChartContainer
    config={{
      income: { theme: { light: "#10b981", dark: "#10b981" } },
      expenses: { theme: { light: "#f97316", dark: "#f97316" } },
    }}
  >
    <LineChart data={financeData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
      <XAxis dataKey="month" />
      <YAxis />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={3} name="Income" />
      <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={3} name="Expenses" />
    </LineChart>
  </ChartContainer>
);

export const StudentPerformanceChart = ({ data }: { data: any[] }) => (
  <ChartContainer
    config={{
      score: { theme: { light: "#7c3aed", dark: "#7c3aed" } },
      average: { theme: { light: "#94a3b8", dark: "#94a3b8" } },
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
        fill="#8884d8"
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