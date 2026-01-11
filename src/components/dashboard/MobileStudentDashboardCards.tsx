import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Calendar,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Target,
  Loader2,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  StudentPerformanceChart, 
  StudentGradeTrendChart, 
  SubjectBreakdownChart 
} from '@/components/charts/MobileCharts';
import { ExamResultService } from '@/services/examResultService';

interface MobileStudentDashboardCardsProps {
  className?: string;
}

interface PerformanceData {
  course: string;
  grade: number;
  percentage: number;
  status: 'excellent' | 'good' | 'average' | 'needs-improvement';
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

interface UpcomingItem {
  id: string;
  title: string;
  type: 'exam' | 'assignment' | 'class' | 'event';
  date: Date;
  course?: string;
  priority: 'high' | 'medium' | 'low';
}

const MobileStudentDashboardCards: React.FC<MobileStudentDashboardCardsProps> = ({
  className
}) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [averageGrade, setAverageGrade] = useState<number | null>(null);

  // Mock data for demonstration - replace with real API calls
  const quickStats: QuickStat[] = [
    {
      label: 'Overall Grade',
      value: averageGrade ? `${averageGrade.toFixed(1)}%` : '—',
      icon: BarChart3,
      color: 'text-blue-600',
      trend: 'up',
      trendValue: '+2.5%'
    },
    {
      label: 'Courses',
      value: performanceData.length,
      icon: BookOpen,
      color: 'text-green-600'
    },
    {
      label: 'Attendance',
      value: '92%',
      icon: CheckCircle,
      color: 'text-emerald-600',
      trend: 'stable'
    },
    {
      label: 'Rank',
      value: '12th',
      icon: Award,
      color: 'text-purple-600',
      trend: 'up',
      trendValue: '+3'
    }
  ];

  const upcomingItems: UpcomingItem[] = [
    {
      id: '1',
      title: 'Mathematics Exam',
      type: 'exam',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      course: 'Mathematics',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Physics Assignment',
      type: 'assignment',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      course: 'Physics',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Chemistry Lab',
      type: 'class',
      date: new Date(Date.now() + 4 * 60 * 60 * 1000),
      course: 'Chemistry',
      priority: 'low'
    }
  ];

  useEffect(() => {
    // Simulate loading time and fetch real data
    const timer = setTimeout(() => {
      // Mock performance data
      const mockData: PerformanceData[] = [
        { course: 'Mathematics', grade: 85, percentage: 85, status: 'good' },
        { course: 'Physics', grade: 78, percentage: 78, status: 'average' },
        { course: 'Chemistry', grade: 92, percentage: 92, status: 'excellent' },
        { course: 'Biology', grade: 88, percentage: 88, status: 'good' },
        { course: 'English', grade: 75, percentage: 75, status: 'average' }
      ];
      
      setPerformanceData(mockData);
      const avg = mockData.reduce((sum, item) => sum + item.percentage, 0) / mockData.length;
      setAverageGrade(avg);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: PerformanceData['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'needs-improvement': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: UpcomingItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getTypeIcon = (type: UpcomingItem['type']) => {
    switch (type) {
      case 'exam': return Award;
      case 'assignment': return BookOpen;
      case 'class': return Calendar;
      case 'event': return Calendar;
    }
  };

  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-lg bg-opacity-10", 
                    stat.color === 'text-blue-600' ? 'bg-blue-500' :
                    stat.color === 'text-green-600' ? 'bg-green-500' :
                    stat.color === 'text-emerald-600' ? 'bg-emerald-500' :
                    'bg-purple-500'
                  )}>
                    <Icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  {stat.trend && (
                    <div className="flex items-center space-x-1">
                      <TrendingUp className={cn(
                        "h-3 w-3",
                        stat.trend === 'up' ? 'text-green-500' : 'text-gray-400'
                      )} />
                      {stat.trendValue && (
                        <span className={cn(
                          "text-xs font-medium",
                          stat.trend === 'up' ? 'text-green-600' : 'text-gray-500'
                        )}>
                          {stat.trendValue}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Overview */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Course Performance</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/grades')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {performanceData.slice(0, 3).map((course, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900 dark:text-white">
                  {course.course}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={cn("text-xs px-2 py-1", getStatusColor(course.status))}
                  >
                    {course.grade}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={course.percentage} 
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Upcoming Items */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>Upcoming</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/student/schedule')}
              className="text-orange-600 hover:text-orange-700"
            >
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingItems.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            return (
              <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className={cn("p-2 rounded-lg", getPriorityColor(item.priority))}>
                  <TypeIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {item.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.course}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatTimeUntil(item.date)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.date.toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-600" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/student/assignments')}
            >
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">Assignments</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/student/materials')}
            >
              <BookOpen className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">Materials</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/student/schedule')}
            >
              <Calendar className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Schedule</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/profile')}
            >
              <Award className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium">Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileStudentDashboardCards;