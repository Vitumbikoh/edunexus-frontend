
import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

// Mock student schedule based on courses they're taking
const createStudentSchedule = (courses: string[]) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const schedule = [];
  
  for (const day of days) {
    const periods = [];
    // Create 3-5 periods per day based on courses
    const numPeriods = Math.floor(Math.random() * 3) + 3;
    const shuffledCourses = [...courses].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(numPeriods, courses.length); i++) {
      periods.push({
        time: `${8 + i}:00 - ${9 + i}:00`,
        course: shuffledCourses[i],
        teacher: getTeacherForCourse(shuffledCourses[i]),
        room: `${Math.floor(Math.random() * 3) + 1}0${Math.floor(Math.random() * 9) + 1}`
      });
    }
    
    schedule.push({
      day,
      periods
    });
  }
  
  return schedule;
};

// Helper function to get a teacher name for a course
const getTeacherForCourse = (course: string) => {
  const teacherMap: {[key: string]: string} = {
    'Mathematics': 'Dr. Amanda Lewis',
    'Physics': 'Prof. Richard Thomas',
    'English': 'Mrs. Elizabeth Chen',
    'History': 'Mr. James Wilson',
    'Computer Science': 'Dr. Maria Rodriguez',
    'Biology': 'Dr. Emily Chen',
    'Chemistry': 'Prof. Richard Thomas',
    'Physical Education': 'Mr. Robert Johnson'
  };
  
  return teacherMap[course] || 'Unknown Teacher';
};

export default function StudentSchedule() {
  const { user } = useAuth();
  
  if (!user || user.role !== 'student' || !user.studentData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  const studentSchedule = createStudentSchedule(user.studentData.courses);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <p className="text-muted-foreground">Class {user.studentData.grade} schedule for the week</p>
      </div>
      
      <div className="space-y-6">
        {studentSchedule.map((day) => (
          <Card key={day.day}>
            <CardHeader>
              <CardTitle>{day.day}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {day.periods.map((period, idx) => (
                  <Card key={idx} className="bg-muted/50 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="text-sm font-semibold">{period.time}</div>
                      <div className="text-base font-bold mt-1">{period.course}</div>
                      <div className="text-sm text-muted-foreground mt-1">{period.teacher}</div>
                      <div className="text-sm text-muted-foreground">Room: {period.room}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
