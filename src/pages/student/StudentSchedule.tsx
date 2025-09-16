import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, BookOpen, Home } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { API_CONFIG } from '@/config/api';

export default function StudentSchedule() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);

  // Fetch student courses first
  const fetchStudentCourses = async () => {
    try {
      if (!token || !user?.id) {
        throw new Error("Authentication required");
      }

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
        throw new Error("Failed to fetch courses");
      }

      const result = await response.json();
      
      // Handle the response structure from your courses page
      if (result.success && result.courses) {
        // Combine all courses from active, completed, upcoming
        const allCourses = [
          ...(result.courses.active || []),
          ...(result.courses.completed || []),
          ...(result.courses.upcoming || [])
        ];
        return allCourses;
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching courses:", error);
      throw error instanceof Error ? error : new Error("Failed to fetch courses");
    }
  };

  // Fetch schedules for all enrolled courses
  const fetchSchedules = async (courseIds) => {
    try {
      if (!courseIds || courseIds.length === 0) {
        return [];
      }

      // Fetch schedules for each course and combine results
      const schedulePromises = courseIds.map(courseId => 
        fetch(`${API_CONFIG.BASE_URL}/schedules/course/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );

      const responses = await Promise.all(schedulePromises);
      const allSchedules = [];

      for (const response of responses) {
        if (!response.ok) continue;
        const data = await response.json();
        
        // Handle different schedule response structures
        if (Array.isArray(data)) {
          allSchedules.push(...data);
        } else if (data.schedules && Array.isArray(data.schedules)) {
          allSchedules.push(...data.schedules);
        } else if (data.data && Array.isArray(data.data)) {
          allSchedules.push(...data.data);
        }
      }

      return allSchedules;
    } catch (error) {
      console.error("Error fetching schedules:", error);
      throw error instanceof Error ? error : new Error("Failed to fetch schedules");
    }
  };

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get the student's courses (using the same structure as your courses page)
      const studentCourses = await fetchStudentCourses();
      setCourses(studentCourses);

      // Then get schedules for each course
      const courseIds = studentCourses.map(course => course.id);
      const allSchedules = await fetchSchedules(courseIds);

      // Organize schedules by day
      const organizedSchedules = organizeSchedules(allSchedules);
      setSchedules(organizedSchedules);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format time strings
  const formatTime = (timeString: any) => {
    if (!timeString) return '00:00';

    // Handle different time formats and data types
    if (typeof timeString === 'string') {
      // Handle different time formats: HH:mm:ss, HH:mm, or full ISO string
      if (timeString.includes('T') || timeString.includes(' ')) {
        // It's a full date-time string, extract time part
        try {
          const date = new Date(timeString);
          if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
        } catch (e) {
          // Ignore and continue
        }
      }
      // It's already a time string, just take the first 5 characters
      return timeString.slice(0, 5);
    } else if (timeString instanceof Date) {
      // It's a Date object
      return timeString.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return '00:00';
  };

  // Helper function to format date
  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Ongoing';

    try {
      let date: Date;

      if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return 'Ongoing';
      }

      if (isNaN(date.getTime())) return 'Ongoing';

      // Check if it's today's date or a future date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === today.getTime()) {
        return 'Today';
      } else if (date > today) {
        return date.toLocaleDateString();
      } else {
        return 'Ongoing';
      }
    } catch (e) {
      return 'Ongoing';
    }
  };

  // Organize schedules by day
  const organizeSchedules = (schedulesData) => {
    const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    // Create day objects with empty periods
    const days = daysOrder.map(day => ({
      day,
      periods: [],
      hasClasses: false
    }));

    // Group schedules by day and time
    schedulesData.forEach(schedule => {
      const dayIndex = daysOrder.indexOf(schedule.day);
      if (dayIndex !== -1) {
        days[dayIndex].hasClasses = true;
        days[dayIndex].periods.push({
          id: schedule.id,
          time: `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`,
          course: schedule.course?.name || schedule.course?.code || 'Unassigned',
          teacher: schedule.teacher?.firstName && schedule.teacher?.lastName 
            ? `${schedule.teacher.firstName} ${schedule.teacher.lastName}`.trim() 
            : schedule.teacher?.name || 'Staff',
          room: schedule.classroom?.name || 'TBD',
          date: formatDate(schedule.date),
          isActive: schedule.isActive !== false
        });
      }
    });

    // Sort periods by time within each day
    days.forEach(day => {
      day.periods.sort((a, b) => {
        const timeA = a.time.split(' - ')[0];
        const timeB = b.time.split(' - ')[0];
        return timeA.localeCompare(timeB);
      });
    });

    return days;
  };

  useEffect(() => {
    if (token && user?.role === 'student') {
      loadData();
    }
  }, [token, user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        {[1, 2, 3, 4, 5].map((day) => (
          <Card key={day}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((item) => (
                  <Card key={item} className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
          <Button 
            onClick={loadData} 
            variant="ghost" 
            className="mt-4 text-red-700 hover:bg-red-100"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Class Schedule</h1>
          <p className="text-muted-foreground">
            {courses.length} enrolled courses
          </p>
        </div>
        <Button 
          onClick={loadData} 
          variant="outline" 
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {schedules.map((day) => (
          <Card key={day.day} className={day.hasClasses ? "border-primary/20" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                {day.day}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {day.periods.length > 0 ? (
                  day.periods.map((period, idx) => (
                    <Card 
                      key={`${day.day}-${idx}`} 
                      className={`hover:shadow-md transition-shadow ${period.isActive ? "" : "opacity-70 border-dashed"}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span>{period.time}</span>
                        </div>
                        <div className="text-sm font-semibold mb-1">{period.date}</div>
                        <div className="text-lg font-bold mt-2 mb-1 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {period.course}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {period.teacher}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          {period.room}
                        </div>
                        {!period.isActive && (
                          <div className="text-xs text-yellow-600 mt-2">
                            Inactive session
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground flex flex-col items-center">
                    <Calendar className="h-8 w-8 mb-2" />
                    No classes scheduled for {day.day}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}