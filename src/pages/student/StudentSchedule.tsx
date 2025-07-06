import React, { useEffect, useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function StudentSchedule() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileError, setProfileError] = useState(false);
  const [studentData, setStudentData] = useState(null);

  // Fetch student profile to populate studentData
  const fetchStudentProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/student/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch student profile');
      }

      const data = await response.json();
      setStudentData({
        grade: data.student?.gradeLevel || 'N/A',
        courses: data.student?.enrollments?.map(e => e.course?.name).filter(Boolean) || [],
        assignments: [],
        grades: []
      });
    } catch (err) {
      setProfileError(true);
      toast({
        title: "Warning",
        description: "Could not fetch student profile. Using default data.",
        variant: "default"
      });
      // Set fallback studentData
      setStudentData({
        grade: 'N/A',
        courses: [],
        assignments: [],
        grades: []
      });
    }
  };

  // Group schedules by day for display
  const groupSchedulesByDay = (schedulesData) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const grouped = days.map(day => ({
      day,
      periods: []
    }));

    schedulesData.forEach(schedule => {
      const dayIndex = days.indexOf(schedule.day);
      if (dayIndex !== -1) {
        grouped[dayIndex].periods.push({
          time: `${schedule.startTime.substring(0, 5)} - ${schedule.endTime.substring(0, 5)}`,
          course: schedule.course?.name || 'N/A',
          teacher: schedule.teacher?.name || 'Unknown Teacher',
          room: schedule.classroom?.name || 'N/A',
          date: schedule.date.split('T')[0]
        });
      }
    });

    return grouped;
  };

  // Fetch schedules from backend
  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/v1/student/my-schedules', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch schedules');
      }

      const data = await response.json();
      const groupedSchedules = groupSchedulesByDay(data.schedules);
      setSchedules(groupedSchedules);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'student') {
      if (!studentData) {
        fetchStudentProfile();
      }
    }
  }, [token, user]);

  useEffect(() => {
    if (studentData && !error) {
      fetchSchedules();
    }
  }, [studentData]);

  if (!user || user.role !== 'student') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8">Loading schedules...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <p className="text-muted-foreground">Class {studentData?.grade || 'N/A'} schedule for the week</p>
      </div>
      
      <div className="space-y-6">
        {schedules.map((day) => (
          <Card key={day.day}>
            <CardHeader>
              <CardTitle>{day.day}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {day.periods.length > 0 ? (
                  day.periods.map((period, idx) => (
                    <Card key={idx} className="bg-muted/50 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="text-sm font-semibold">{period.date}</div>
                        <div className="text-sm font-semibold">{period.time}</div>
                        <div className="text-base font-bold mt-1">{period.course}</div>
                        <div className="text-sm text-muted-foreground mt-1">{period.teacher}</div>
                        <div className="text-sm text-muted-foreground">Room: {period.room}</div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-4 text-muted-foreground">
                    No classes scheduled for this day.
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
