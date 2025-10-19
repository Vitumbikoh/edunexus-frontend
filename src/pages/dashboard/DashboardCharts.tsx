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
  Legend
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
import { Preloader } from '@/components/ui/preloader';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';

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
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
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

const COLORS = ['#0088FE', '#FFBB28', '#00C49F', '#FF8042', '#8884D8', '#82ca9d'];
const PIE_COLORS = ['#10B981', '#F97316'];
const ASSIGNMENT_COLORS = ['#f97316', '#3b82f6', '#10b981'];

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
        <Bar dataKey="value" fill="#8884d8" />
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
        <Bar dataKey="average" fill="#82ca9d" />
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
        <Area type="monotone" dataKey="income" stackId="1" stroke="#8884d8" fill="#8884d8" />
        <Area type="monotone" dataKey="expenses" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
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
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={(value: number) => [`${value}%`, 'Attendance Rate']}
          labelStyle={{ color: '#000' }}
        />
        <Bar
          dataKey="attendanceRate"
          fill="#8b5cf6"
          radius={[4, 4, 0, 0]}
        >
          {attendanceData.map((entry, index) => {
            const percentage = Math.round(entry.attendanceRate || entry.value);
            return (
              <Cell
                key={`cell-${index}`}
                fill={
                  percentage >= 90 ? '#10b981' : // green for excellent
                  percentage >= 80 ? '#3b82f6' : // blue for good
                  '#f59e0b' // amber for needs improvement
                }
              />
            );
          })}
          <LabelList
            dataKey="attendanceRate"
            position="top"
            formatter={(value: number) => `${Math.round(value)}%`}
            style={{ fontSize: '12px', fill: '#374151' }}
          />
        </Bar>
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

      const query = termId ? `?termId=${termId}` : '';
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
        studentsCount: item.gradeCount ?? item.numericGradeCount ?? item.studentsCount ?? item.students ?? item.studentCount ?? 0,
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

  return (
    <ChartContainer
      config={{
        students: { theme: { light: "#374151", dark: "#374151" } },
        average: { theme: { light: "#6b7280", dark: "#6b7280" } },
      }}
    >
      <BarChart
        data={performanceData}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <XAxis 
          dataKey="courseName" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#6b7280' }}
        />
        <ChartTooltip 
          content={<ChartTooltipContent />}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontSize: '14px'
          }}
        />
        <Bar 
          dataKey="studentsCount" 
          fill="#374151" 
          name="Grade Count" 
          radius={[2, 2, 0, 0]}
        />
        <Bar 
          dataKey="averageScore" 
          fill="#6b7280" 
          name="Average Score" 
          radius={[2, 2, 0, 0]}
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

    // New backend shape handling: paymentTrends.byFeeType & paymentSummary
    const feeTypeBreakdown = data.feeTypeBreakdown || data.feeTypes || data.fee_structure;
    if (Array.isArray(feeTypeBreakdown) && feeTypeBreakdown.length > 0) {
      return feeTypeBreakdown.map((f: any) => ({
        status: f.feeType || f.type || f.status || f.name,
        amount: toNumber(f.amount || f.totalPaid || f.expectedAmount)
      }));
    }

    // paymentTrends.byFeeType (analytics/fee-collection-status)
    if (data.paymentTrends && Array.isArray(data.paymentTrends.byFeeType) && data.paymentTrends.byFeeType.length > 0) {
      const arr = data.paymentTrends.byFeeType.map((f: any) => ({
        status: (f.feeType || f.type || 'Fee').toString().replace(/_/g,' '),
        amount: toNumber(f.totalPaid || f.amount || 0)
      }));
      // If only one fee type, fallback to aggregated pie for better visualization
      if (arr.length > 1) return arr;
    }

    // paymentSummary aggregated values
    const paymentSummary = data.paymentSummary || {};
    let totalPaid = toNumber(
      paymentSummary.totalPaid ?? paymentSummary.paid ?? data.totalPaidFees ?? data.paidFees ?? 0
    );
    let outstanding = toNumber(
      paymentSummary.totalOutstanding ?? paymentSummary.outstanding ?? data.outstandingFees ?? 0
    );
    const expected = toNumber(
      paymentSummary.totalExpected ?? paymentSummary.expected ?? data.totalExpectedFees ?? data.expectedFees ?? (totalPaid + outstanding)
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

      const query = termId ? `?termId=${termId}` : '';
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

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <Pie
          data={feeData}
          dataKey="amount"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={40}
          paddingAngle={5}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
        >
          {feeData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={index === 0 ? '#10B981' : '#F97316'} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [`${formatCurrency(value, getDefaultCurrency())}`, 'Amount']}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontSize: '14px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const FinanceOverviewChart = () => (
  <ChartContainer
    config={{
      income: { theme: { light: "#1f2937", dark: "#1f2937" } },
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
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          fontSize: '14px'
        }}
      />
      <Line 
        type="monotone" 
        dataKey="income" 
        stroke="#1f2937" 
        strokeWidth={3} 
        name="Income"
        dot={{ fill: '#1f2937', strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: '#1f2937', strokeWidth: 2, fill: '#ffffff' }}
      />
      <Line 
        type="monotone" 
        dataKey="expenses" 
        stroke="#6b7280" 
        strokeWidth={3} 
        name="Expenses"
        dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: '#6b7280', strokeWidth: 2, fill: '#ffffff' }}
      />
    </LineChart>
  </ChartContainer>
);

export const ClassStudentsRatioChart = ({ termId }: { termId?: string }) => {
  const [classData, setClassData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { token } = useAuth();

  const fetchClassData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new class-counts endpoint to get real student counts per class
      const response = await fetch(`${API_CONFIG.BASE_URL}/student/class-counts`, {
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
        
        // Filter out classes with 0 students
        const filteredData = formattedData.filter(item => item.studentCount > 0);
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
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={prepared}
        margin={{ top: 8, right: 8, left: 8, bottom: 40 }}
        barCategoryGap="20%"
      >
        <defs>
          <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f2937" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#6b7280" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="className"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#374151' }}
          angle={-30}
          textAnchor="end"
          height={72}
          interval={0}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#374151' }}
        />
        <Tooltip
          formatter={(value: number, name: string, props: any) => [`${value} students`, 'Enrollment']}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
            fontSize: '13px'
          }}
        />
        <Bar
          dataKey="studentCount"
          fill="url(#gradStudents)"
          name="Students"
          radius={[6, 6, 2, 2]}
          animationDuration={800}
        >
          {prepared.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fillOpacity={0.95} />
          ))}
        </Bar>
        {/* numeric label on top of bars */}
        <LabelList dataKey="label" position="top" style={{ fontSize: 11, fill: '#111827' }} />
        {/* average line */}
        <ReferenceLine y={Math.round(total / prepared.length)} stroke="#e5e7eb" strokeDasharray="3 3" />
        <Legend verticalAlign="top" height={24} />
      </BarChart>
    </ResponsiveContainer>
  );
};export const StudentPerformanceChart = ({ data }: { data: any[] }) => (
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
          labelStyle={{ color: '#374151' }}
        />
        <Line 
          type="monotone" 
          dataKey="attendanceRate" 
          stroke="#10b981" 
          strokeWidth={3}
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
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
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
          labelStyle={{ color: '#374151' }}
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