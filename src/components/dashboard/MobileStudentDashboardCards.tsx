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
import { API_CONFIG } from '@/config/api';

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
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [studentRank, setStudentRank] = useState<string>('—');
  const [coursesCount, setCoursesCount] = useState<number>(0);
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([]);

  // Fetch real student data from APIs
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!token || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch exam results for grades
        const examResults = await ExamResultService.getStudentResults('me', token);
        if (examResults && examResults.results) {
          const grades = examResults.results.map(result => ({
            course: result.courseName,
            grade: result.finalPercentage,
            percentage: result.finalPercentage,
            status: result.finalPercentage >= 90 ? 'excellent' as const :
                    result.finalPercentage >= 80 ? 'good' as const :
                    result.finalPercentage >= 70 ? 'average' as const : 'needs-improvement' as const
          }));
          setPerformanceData(grades);
          const avg = grades.length > 0 ? grades.reduce((sum, item) => sum + item.percentage, 0) / grades.length : 0;
          setAverageGrade(avg);
        }

        // Fetch student courses
        const coursesResponse = await fetch(`${API_CONFIG.BASE_URL}/student/${user.id}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          const totalCourses = (coursesData.courses?.active?.length || 0) + 
                              (coursesData.courses?.upcoming?.length || 0) + 
                              (coursesData.courses?.completed?.length || 0);
          setCoursesCount(totalCourses);
        }

        // Fetch attendance data
        try {
          const attendanceResponse = await fetch(`${API_CONFIG.BASE_URL}/student/attendance-rate`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (attendanceResponse.ok) {
            const attendanceData = await attendanceResponse.json();
            setAttendanceRate(attendanceData.attendanceRate || 0);
          }
        } catch (e) {
          console.log('Attendance data not available');
        }

        // For now, we'll keep rank as placeholder since it requires class comparison
        setStudentRank('—');
        
        // Set empty upcoming items for now (can be enhanced with real data)
        setUpcomingItems([]);

      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [token, user?.id]);

  // Dynamic quick stats based on real data
  const quickStats: QuickStat[] = [
    {
      label: 'Overall Grade',
      value: averageGrade ? `${averageGrade.toFixed(1)}%` : '—',
      icon: BarChart3,
      color: 'text-blue-600',
      trend: 'stable'
    },
    {
      label: 'Courses',
      value: coursesCount,
      icon: BookOpen,
      color: 'text-green-600'
    },
    {
      label: 'Attendance',
      value: attendanceRate ? `${attendanceRate.toFixed(0)}%` : '—',
      icon: CheckCircle,
      color: 'text-emerald-600',
      trend: 'stable'
    },
    {
      label: 'Rank',
      value: studentRank,
      icon: Award,
      color: 'text-purple-600'
    }
  ];

  const getStatusColor = (status: PerformanceData['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-700 border border-green-300 bg-transparent';
      case 'good': return 'text-blue-700 border border-blue-300 bg-transparent';
      case 'average': return 'text-yellow-700 border border-yellow-300 bg-transparent';
      case 'needs-improvement': return 'text-red-700 border border-red-300 bg-transparent';
      default: return 'text-gray-700 border border-gray-300 bg-transparent';
    }
  };

  const getPriorityColor = (priority: UpcomingItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-transparent text-red-700 border border-red-300';
      case 'medium': return 'bg-transparent text-yellow-700 border border-yellow-300';
      case 'low': return 'bg-transparent text-green-700 border border-green-300';
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
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-lg border", 
                    stat.color === 'text-blue-600' ? 'border-blue-300' :
                    stat.color === 'text-green-600' ? 'border-green-300' :
                    stat.color === 'text-emerald-600' ? 'border-emerald-300' :
                    'border-purple-300'
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
      <Card>
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
          {performanceData.length > 0 ? (
            performanceData.slice(0, 3).map((course, index) => (
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
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No exam results available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Items */}
      <Card>
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
          {upcomingItems.length > 0 ? (
            upcomingItems.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
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
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming items</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
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