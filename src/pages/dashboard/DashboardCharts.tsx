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
import { useAuth } from '@/contexts/AuthContext';

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

export const AttendanceOverview = () => (
  <div className="space-y-6">
    {attendanceData.map((item) => (
      <div key={item.name} className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{item.name}</span>
          <span className="text-sm font-medium">{item.value}%</span>
        </div>
        <Progress 
          value={item.value} 
          className="h-2" 
          indicatorClassName={`bg-gradient-to-r ${
            item.value >= 90 ? 'from-green-400 to-green-500' :
            item.value >= 80 ? 'from-blue-400 to-blue-500' :
            'from-orange-400 to-orange-500'
          }`}
        />
      </div>
    ))}
  </div>
);

export const ClassPerformanceChart = () => (
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
      <XAxis dataKey="name" />
      <YAxis />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Bar dataKey="students" fill="var(--color-students)" name="Students" radius={[4, 4, 0, 0]} />
      <Bar dataKey="average" fill="var(--color-average)" name="Class Average" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ChartContainer>
);

export const FeeCollectionChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={feeCollection}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        fill="#8884d8"
        paddingAngle={5}
        dataKey="value"
        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
      >
        {feeCollection.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

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