
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

// Mock teacher schedule
const teacherSchedule = [
  {
    day: "Monday",
    periods: [
      { time: "08:00 - 09:00", subject: "Mathematics", class: "10A", room: "101" },
      { time: "11:30 - 12:30", subject: "Physics", class: "11B", room: "Lab 3" },
    ]
  },
  {
    day: "Tuesday",
    periods: [
      { time: "09:10 - 10:10", subject: "Mathematics", class: "10A", room: "101" },
    ]
  },
  {
    day: "Wednesday",
    periods: [
      { time: "10:20 - 11:20", subject: "Mathematics", class: "10A", room: "101" },
      { time: "13:30 - 14:30", subject: "Physics", class: "11B", room: "Lab 3" },
    ]
  },
  {
    day: "Thursday",
    periods: [
      { time: "08:00 - 09:00", subject: "Mathematics", class: "10A", room: "101" },
    ]
  },
  {
    day: "Friday",
    periods: [
      { time: "10:20 - 11:20", subject: "Mathematics", class: "10A", room: "101" },
      { time: "11:30 - 12:30", subject: "Physics", class: "11B", room: "Lab 3" },
    ]
  },
];

export default function TeacherSchedule() {
  const { user } = useAuth();
  
  if (!user || user.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
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
        {teacherSchedule.map((day) => (
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
                        <div className="text-sm font-semibold">{period.time}</div>
                        <div className="text-base font-bold mt-1">{period.subject}</div>
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
