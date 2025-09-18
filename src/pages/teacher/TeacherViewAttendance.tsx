import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Calendar, Search, Users, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_CONFIG } from '@/config/api';
import { Preloader } from '@/components/ui/preloader';

interface AttendanceRecord {
  id: string;
  date: string;
  course: {
    id: string;
    name: string;
    code: string;
  };
  class: {
    id: string;
    name: string;
  };
  presentCount: number;
  absentCount: number;
  totalStudents: number;
  attendanceDetails: {
    studentId: string;
    studentName: string;
    isPresent: boolean;
  }[];
}

export default function TeacherViewAttendance() {
  const { user, token } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  if (!user || user.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAttendanceRecords();
    }
  }, [selectedCourse, selectedDate]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/teacher/my-courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      if (data.success && data.courses) {
        setCourses(data.courses);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch courses";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `${API_CONFIG.BASE_URL}/teacher/attendance/course/${selectedCourse}`;
      if (selectedDate) {
        url += `?date=${selectedDate}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch attendance records");
      }

      const data = await response.json();
      if (data.success && data.attendance) {
        setAttendanceRecords(data.attendance);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch attendance records";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    if (!searchTerm) return true;
    return record.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           record.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           record.date.includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">View Attendance</h1>
        <p className="text-muted-foreground">View attendance records for your courses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Attendance Records
          </CardTitle>
          <CardDescription>
            Select a course to view attendance records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="Filter by date"
              />
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search records..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <Preloader variant="spinner" size="md" text="Loading attendance records..." height="16rem" />
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : filteredRecords.length > 0 ? (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {record.course.name} - {record.class.name}
                        </CardTitle>
                        <CardDescription>
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{record.presentCount}</div>
                            <div className="text-sm text-muted-foreground">Present</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{record.absentCount}</div>
                            <div className="text-sm text-muted-foreground">Absent</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{record.totalStudents}</div>
                            <div className="text-sm text-muted-foreground">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">Student Details:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {record.attendanceDetails.map((detail) => (
                          <div key={detail.studentId} className="flex items-center space-x-2 p-2 rounded border">
                            {detail.isPresent ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm">{detail.studentName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : selectedCourse ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No attendance records found matching your search."
                : "No attendance records found for the selected course and date."}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Please select a course to view attendance records.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}