import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Users, Award, Calendar } from "lucide-react";

export default function StudentCourses() {
  const { user } = useAuth();
  
  if (!user || user.role !== 'student') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  // Use studentData if available, otherwise create fallback data
  const fallbackCourses = ['Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Computer Science'];
  const courses = user.studentData?.courses || fallbackCourses;
  
  // Mock course details with progress and additional information
  const coursesWithDetails = courses.map((courseName, index) => ({
    id: `course-${index + 1}`,
    name: courseName,
    code: `${courseName.substring(0, 3).toUpperCase()}${101 + index}`,
    instructor: getInstructorName(courseName),
    schedule: getScheduleInfo(courseName),
    progress: Math.floor(Math.random() * 40) + 60, // 60-100%
    totalHours: Math.floor(Math.random() * 20) + 30, // 30-50 hours
    completedHours: Math.floor(Math.random() * 15) + 20, // 20-35 hours
    enrolledStudents: Math.floor(Math.random() * 20) + 15, // 15-35 students
    nextAssignment: getNextAssignment(courseName),
    grade: getRandomGrade(),
    description: getCourseDescription(courseName)
  }));

  function getInstructorName(courseName: string): string {
    const instructors = {
      'Mathematics': 'Dr. Sarah Johnson',
      'Physics': 'Prof. Michael Chen',
      'English': 'Ms. Emily Davis',
      'History': 'Dr. Robert Wilson',
      'Computer Science': 'Prof. Lisa Anderson',
      'Chemistry': 'Dr. James Miller',
      'Biology': 'Dr. Maria Rodriguez'
    };
    return instructors[courseName] || 'Prof. Unknown';
  }

  function getScheduleInfo(courseName: string): string {
    const schedules = [
      'Mon, Wed 9:00-10:30 AM',
      'Tue, Thu 11:00-12:30 PM', 
      'Mon, Wed, Fri 2:00-3:00 PM',
      'Tue, Thu 3:30-5:00 PM'
    ];
    return schedules[Math.floor(Math.random() * schedules.length)];
  }

  function getNextAssignment(courseName: string): string {
    const assignments = {
      'Mathematics': 'Calculus Problem Set #5',
      'Physics': 'Lab Report: Motion Dynamics',
      'English': 'Essay: Shakespearean Themes',
      'History': 'Research Paper: WWII Impact',
      'Computer Science': 'Project: Web Application',
      'Chemistry': 'Lab Experiment Analysis',
      'Biology': 'Cell Structure Diagram'
    };
    return assignments[courseName] || 'Assignment TBD';
  }

  function getRandomGrade(): string {
    const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-'];
    return grades[Math.floor(Math.random() * grades.length)];
  }

  function getCourseDescription(courseName: string): string {
    const descriptions = {
      'Mathematics': 'Advanced calculus and mathematical analysis covering derivatives, integrals, and differential equations.',
      'Physics': 'Classical mechanics, thermodynamics, and electromagnetic theory with laboratory components.',
      'English': 'Literature analysis, creative writing, and communication skills development.',
      'History': 'World history from ancient civilizations to modern times with focus on critical thinking.',
      'Computer Science': 'Programming fundamentals, data structures, algorithms, and software development practices.',
      'Chemistry': 'Organic and inorganic chemistry with emphasis on molecular structures and reactions.',
      'Biology': 'Cell biology, genetics, evolution, and ecological systems study.'
    };
    return descriptions[courseName] || 'Comprehensive study in the subject area.';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">View your enrolled courses and academic progress</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesWithDetails.map((course) => (
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
                  <div className="text-lg font-bold text-primary">{course.grade}</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {course.description}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{course.instructor}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{course.schedule}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{course.completedHours}/{course.totalHours} hours completed</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium">Next Assignment</div>
                <div className="text-sm text-muted-foreground">{course.nextAssignment}</div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="default" size="sm" className="flex-1">
                  Materials
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {coursesWithDetails.length === 0 && (
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