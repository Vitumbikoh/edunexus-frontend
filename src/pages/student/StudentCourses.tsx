import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { API_CONFIG } from '@/config/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PagePreloader } from '@/components/ui/preloader';
import { BookOpen, Calendar, Clock, MessageSquare, Users } from 'lucide-react';
import { courseService } from '@/services/courseService';

// Local helper types for rendering
type CourseSchedule = {
  day: string;
  startTime: string;
  endTime: string;
  classroom?: { name?: string };
};

type EnhancedCourse = {
  id: string;
  code: string;
  name: string;
  description?: string;
  teacherName?: string;
  className?: string;
  statusLabel: 'Active' | 'Upcoming' | 'Completed';
  schedules: CourseSchedule[];
  progress: { completedItems: number; totalItems: number; percentage: number; averageScore: number };
  nextExam: string;
};

function CourseDetailModal({ course, token }: { course: EnhancedCourse; token: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [courseDetails, setCourseDetails] = useState<any>(null);

  const fetchCourseDetails = async () => {
    if (!course.id || loading) return;
    setLoading(true);
    try {
      const [details, courseExams] = await Promise.all([
        courseService.getCourseDetails(token, course.id),
        courseService.getCourseExams(token, course.id),
      ]);
      setCourseDetails(details);
      setExams(courseExams);
    } catch (err) {
      console.error('Error fetching course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD';
    return timeString.substring(0, 5);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) fetchCourseDetails();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {course.name} ({course.code})
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading course details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teacher:</span>
                    <span className="font-medium">{course.teacherName || 'Not assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={course.statusLabel === 'Active' ? 'default' : 'secondary'}>
                      {course.statusLabel}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Progress:</span>
                    <span className="font-medium">{course.progress?.percentage || 0}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {course.schedules && course.schedules.length > 0 ? (
                    <div className="space-y-2">
                      {course.schedules.map((schedule, index) => (
                        <div key={index} className="flex justify-between items-center py-1">
                          <span className="font-medium">{schedule.day}</span>
                          <span className="text-muted-foreground">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {schedule.classroom?.name || 'TBD'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No scheduled classes</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {course.description && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{course.description}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Exams ({exams.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {exams.length > 0 ? (
                    <div className="space-y-3">
                      {exams.slice(0, 5).map((exam) => (
                        <div key={exam.id} className="border-l-2 border-blue-500 pl-4">
                          <h4 className="font-medium">{exam.title}</h4>
                          <p className="text-sm text-muted-foreground">Date: {formatDate(exam.date)}</p>
                          <p className="text-sm text-muted-foreground">Duration: {exam.duration || 'TBD'}</p>
                          <Badge variant={exam.status === 'graded' ? 'default' : 'secondary'} className="mt-1">
                            {exam.status || 'Upcoming'}
                          </Badge>
                        </div>
                      ))}
                      {exams.length > 5 && (
                        <p className="text-sm text-muted-foreground">And {exams.length - 5} more...</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No exams scheduled</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function StudentCourses() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState({ completed: [], active: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [enhancedCourses, setEnhancedCourses] = useState<EnhancedCourse[]>([]);

  // Fetch courses with optimized loading
  useEffect(() => {
    const fetchCoursesData = async () => {
      try {
        setLoading(true);
        setApiError(null);

        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }

        if (!user.id) {
          throw new Error("User ID not found. Please log in again.");
        }

        // Fetch basic course data
        const response = await fetch(`${API_CONFIG.BASE_URL}/student/${user.id}/courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          throw new Error("Session expired. Please log in again.");
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch courses");
        }

        const result = await response.json();
        if (result.success) {
          setCourses(result.courses);
          
          // Create enhanced courses with basic data first for fast initial render
          const allCourses = [
            ...result.courses.active.map(course => ({ ...course, statusLabel: 'Active' })),
            ...result.courses.upcoming.map(course => ({ ...course, statusLabel: 'Upcoming' })),
            ...result.courses.completed.map(course => ({ ...course, statusLabel: 'Completed' })),
          ];

          // Set initial enhanced courses with basic data only
          const initialEnhanced = allCourses.map(course => ({
            ...course,
            schedules: [],
            progress: { completedItems: 0, totalItems: 0, percentage: 0, averageScore: 0 },
            nextExam: 'No upcoming exams'
          }));

          setEnhancedCourses(initialEnhanced);
          setLoading(false); // Stop loading immediately after basic data

          // Load additional data in background (non-blocking)
          setTimeout(async () => {
            try {
              const enhanced = await Promise.all(
                allCourses.map(async (course) => {
                  try {
                    // Only fetch schedules for now - remove expensive calls
                    const schedules = await courseService.getCourseSchedule(token, course.id);
                    
                    return {
                      ...course,
                      schedules: schedules || [],
                      progress: { completedItems: 0, totalItems: 0, percentage: 0, averageScore: 0 },
                      nextExam: 'No upcoming exams'
                    };
                  } catch (error) {
                    console.error(`Error enhancing course ${course.id}:`, error);
                    return {
                      ...course,
                      schedules: [],
                      progress: { completedItems: 0, totalItems: 0, percentage: 0, averageScore: 0 },
                      nextExam: 'Unable to load'
                    };
                  }
                })
              );

              setEnhancedCourses(enhanced);
            } catch (error) {
              console.error('Error in background enhancement:', error);
            }
          }, 100);
        } else {
          throw new Error("Failed to fetch courses");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch courses";
        setApiError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchCoursesData();
  }, [user.id, token, toast, navigate]);

  // Navigation handlers
  const handleViewMaterials = (course: EnhancedCourse) => {
    navigate(`/student/materials?courseId=${course.id}`);
  };

  // Format schedule display (placeholder, will show today's schedule below)
  const formatScheduleDisplay = (schedules: CourseSchedule[]): string => {
    return courseService.formatScheduleDisplay(schedules);
  };

  if (loading) {
    return <PagePreloader text="Loading courses..." />;
  }

  if (apiError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {apiError}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">View your enrolled courses and academic progress</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enhancedCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription className="text-sm">{course.code}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={course.statusLabel === 'Active' ? 'default' : 
                            course.statusLabel === 'Completed' ? 'secondary' : 'outline'}
                  >
                    {course.statusLabel}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {course.description || 'No description available'}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{course.teacherName || 'No teacher assigned'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {course.schedules && course.schedules.length > 0 
                      ? formatScheduleDisplay(course.schedules)
                      : 'No schedule'
                    }
                  </span>
                </div>
                
                {/* Removed items completed display */}
              </div>
              
              {/* Removed progress bar and percentage */}
              
              {/* Show next exam only if available and not the default message */}
              {course.statusLabel === 'Active' && course.nextExam && 
               course.nextExam !== 'No upcoming exams' && 
               course.nextExam !== 'Unable to load' && 
               course.nextExam !== 'Loading...' && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-sm font-medium">Next Item</div>
                  <div className="text-sm text-muted-foreground">{course.nextExam}</div>
                </div>
              )}
              
              <div className="flex gap-2">
                <CourseDetailModal course={course} token={token} />
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewMaterials(course)}
                >
                  Materials
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {enhancedCourses.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
            <p className="text-muted-foreground">You are not currently enrolled in any courses.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}