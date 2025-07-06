import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Users, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function StudentCourses() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState({ completed: [], active: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setApiError(null);

        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }

        if (!user.id) {
          throw new Error("User ID not found. Please log in again.");
        }

        const response = await fetch(`http://localhost:5000/api/v1/student/${user.id}/courses`, {
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
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user.id, token, toast, navigate]);

  // Combine all courses for display
  const allCourses = [
    ...courses.active.map(course => ({
      ...course,
      statusLabel: 'Active',
      progress: course.enrollmentStatus === 'active' ? Math.floor(Math.random() * 40) + 60 : 100,
    })),
    ...courses.upcoming.map(course => ({
      ...course,
      statusLabel: 'Upcoming',
      progress: 0,
    })),
    ...courses.completed.map(course => ({
      ...course,
      statusLabel: 'Completed',
      progress: 100,
    })),
  ];

  // Format schedule display
  const formatSchedule = (schedule) => {
    if (!schedule || !schedule.days || !schedule.time) {
      return 'Schedule TBD';
    }
    const days = schedule.days.join(', ');
    return `${days} ${schedule.time} at ${schedule.location}`;
  };

  // Mock grade
  const getRandomGrade = () => {
    const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-'];
    return grades[Math.floor(Math.random() * grades.length)];
  };

  // Mock hours
  const getMockHours = (status) => {
    if (status === 'Completed') {
      const total = Math.floor(Math.random() * 20) + 30;
      return { completedHours: total, totalHours: total };
    } else if (status === 'Active') {
      const total = Math.floor(Math.random() * 20) + 30;
      const completed = Math.floor(Math.random() * 15) + 15;
      return { completedHours: completed, totalHours: total };
    }
    return { completedHours: 0, totalHours: Math.floor(Math.random() * 20) + 30 };
  };

  // Mock next assignment
  const getNextAssignment = (courseName) => {
    const assignments = {
      'Mathematics': 'Calculus Problem Set #5',
      'Physics': 'Lab Report: Motion Dynamics',
      'English': 'Essay: Shakespearean Themes',
      'History': 'Research Paper: WWII Impact',
      'Computer Science': 'Project: Web Application',
      'Chemistry': 'Lab Experiment Analysis',
      'Biology': 'Cell Structure Diagram',
    };
    return assignments[courseName] || 'Assignment TBD';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
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
        {allCourses.map((course) => {
          const { completedHours, totalHours } = getMockHours(course.statusLabel);
          return (
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
                    <div className="text-lg font-bold text-primary">
                      {course.statusLabel === 'Completed' ? getRandomGrade() : course.statusLabel}
                    </div>
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
                    <span>{course.teacherName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatSchedule(course.schedule)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{completedHours}/{totalHours} hours completed</span>
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
                  <div className="text-sm text-muted-foreground">{getNextAssignment(course.name)}</div>
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
          );
        })}
      </div>
      
      {allCourses.length === 0 && (
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