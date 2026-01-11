import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface MobilePerformanceChartProps {
  data: Array<{
    name: string;
    score: number;
    average?: number;
  }>;
}

interface MobileGradeTrendChartProps {
  studentId?: string;
  token?: string;
  resultsData: Array<{
    name: string;
    score: number;
  }>;
}

// Custom tooltip for mobile charts
const MobileTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Mobile-optimized performance chart
export const StudentPerformanceChart: React.FC<MobilePerformanceChartProps> = ({ data }) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 20,
        }}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis 
          tick={{ fontSize: 11 }}
          domain={[0, 100]}
          width={30}
        />
        <Tooltip content={<MobileTooltip />} />
        <Bar 
          dataKey="score" 
          fill="#3B82F6" 
          radius={[4, 4, 0, 0]}
          name="Your Score"
        />
        {data[0]?.average !== undefined && (
          <Bar 
            dataKey="average" 
            fill="#10B981" 
            radius={[4, 4, 0, 0]}
            name="Class Average"
            opacity={0.6}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};

// Mobile-optimized grade trend chart
export const StudentGradeTrendChart: React.FC<MobileGradeTrendChartProps> = ({ 
  studentId, 
  token, 
  resultsData 
}) => {
  // Transform data for trend visualization
  const trendData = resultsData.map((item, index) => ({
    exam: `Exam ${index + 1}`,
    score: item.score,
    course: item.name
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={trendData}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="exam" 
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          tick={{ fontSize: 11 }}
          domain={[0, 100]}
          width={30}
        />
        <Tooltip content={<MobileTooltip />} />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="#3B82F6" 
          strokeWidth={3}
          dot={{ r: 4, fill: '#3B82F6' }}
          activeDot={{ r: 6, fill: '#1D4ED8' }}
          name="Grade"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Mobile-optimized subject breakdown pie chart
export const SubjectBreakdownChart: React.FC<{ data: Array<{ name: string; value: number; }> }> = ({ data }) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{data.name}</p>
                  <p className="text-sm text-blue-600">{data.value}%</p>
                </div>
              );
            }
            return null;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Mobile-optimized attendance chart
export const AttendanceChart: React.FC<{ data: Array<{ month: string; attendance: number; }> }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 11 }}
          domain={[0, 100]}
          width={30}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<MobileTooltip />} />
        <Area
          type="monotone"
          dataKey="attendance"
          stroke="#10B981"
          strokeWidth={2}
          fill="url(#attendanceGradient)"
          name="Attendance"
        />
        <defs>
          <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
          </linearGradient>
        </defs>
      </AreaChart>
    </ResponsiveContainer>
  );
};