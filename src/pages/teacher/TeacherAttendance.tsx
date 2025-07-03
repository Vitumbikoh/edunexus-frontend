import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

export default function TeacherAttendance() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/v1/teacher/my-classes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Failed to fetch classes');
      }

      setClasses(data.classes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load classes';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (classId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5000/api/v1/teacher/my-courses/by-class/${classId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Failed to fetch courses');
      }

      setCourses(data.courses);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load courses';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5000/api/v1/teacher/my-students/by-course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Failed to fetch students');
      }

      setStudents(
        data.students.map((student: any) => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          grade: student.class?.name || '',
          attendance: [],
        })),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load students';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [token]);

  useEffect(() => {
    if (selectedClass) {
      fetchCourses(selectedClass);
    } else {
      setCourses([]);
      setSelectedCourse('');
      setStudents([]);
      setAttendanceStatus({});
    }
  }, [selectedClass, token]);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse);
    } else {
      setStudents([]);
      setAttendanceStatus({});
    }
  }, [selectedCourse, token]);

  const handleClassSelect = (value: string) => {
    setSelectedClass(value);
    setSelectedCourse('');
    setAttendanceStatus({});
  };

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [studentId]: isPresent,
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !selectedCourse) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select both class and course before submitting attendance.',
      });
      return;
    }

    if (Object.keys(attendanceStatus).length === 0) {
      toast({
        variant: 'destructive',
        title: 'No attendance marked',
        description: 'Please mark attendance for at least one student.',
      });
      return;
    }

    const payload = {
      classId: selectedClass,
      courseId: selectedCourse,
      date: new Date().toISOString(),
      attendanceStatus,
    };

    // Log payload for debugging
    console.log('Sending attendance payload:', payload);

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/v1/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit attendance');
      }

      const data = await response.json();
      toast({
        title: 'Attendance submitted successfully',
        description: `Attendance for ${selectedClass} - ${selectedCourse} has been recorded.`,
      });

      // Reset form
      setSelectedClass('');
      setSelectedCourse('');
      setStudents([]);
      setAttendanceStatus({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit attendance';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Take Attendance</h1>
          <p className="text-muted-foreground">Record student attendance for your classes</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="h-6 bg-gray-200 animate-pulse rounded"></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-20 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Take Attendance</h1>
          <p className="text-muted-foreground">Record student attendance for your classes</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <Calendar className="h-4 w-4" />
          Back to Schedule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Sheet</CardTitle>
          <CardDescription>Select class and course to take attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={handleClassSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      Class {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCourse && students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          id={`present-${student.id}`}
                          checked={attendanceStatus[student.id] === true}
                          onCheckedChange={() => handleAttendanceChange(student.id, true)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          id={`absent-${student.id}`}
                          checked={attendanceStatus[student.id] === false}
                          onCheckedChange={() => handleAttendanceChange(student.id, false)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : selectedCourse ? (
            <div className="text-center py-8 text-muted-foreground">
              No students found for this course.
            </div>
          ) : selectedClass ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select a course to view students.
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Please select a class to view courses.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleSubmitAttendance}
            disabled={!selectedClass || !selectedCourse || students.length === 0}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Submit Attendance
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}