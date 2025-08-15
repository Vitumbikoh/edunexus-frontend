import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { API_CONFIG } from '@/config/api';

export default function TeacherSchedule() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Group schedules by day for display
  const groupSchedulesByDay = (schedulesData) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
          class: schedule.class?.name || 'N/A',
          room: schedule.classroom?.name || 'N/A',
          date: schedule.date.split('T')[0]
        });
      }
    });

    return grouped; // Return all days, even those with no periods, to match original behavior
  };

  // Fetch schedules from backend
  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_CONFIG.BASE_URL}/teacher/my-schedules`, {
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
    if (token && user?.role === 'teacher') {
      fetchSchedules();
    }
  }, [token]);

  if (!user || user.role !== 'teacher') {
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
        <p className="text-muted-foreground">Your weekly teaching timetable</p>
      </div>
      
      <div className="space-y-6">
        {schedules.map((day) => (
          <Card key={day.day}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                {day.day}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {day.periods.length > 0 ? (
                  day.periods.map((period, idx) => (
                    <Card key={idx} className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="text-sm font-semibold">{period.date}</div>
                        <div className="text-sm font-semibold">{period.time}</div>
                        <div className="text-base font-bold mt-1">{period.course}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline">Class {period.class}</Badge>
                          <Badge variant="outline">Room {period.room}</Badge>
                        </div>
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