import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Check, Calendar, Clock, MapPin, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '@/config/api';

interface ScheduledClass {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  course: {
    id: string;
    name: string;
    code: string;
  };
  classroom?: {
    id: string;
    name: string;
  };
  class: {
    id: string;
    name: string;
  };
}

export default function TeacherAttendance() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});
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

  const fetchTodaysScheduledClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current day of the week
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = daysOfWeek[new Date().getDay()];

      // First get teacher's profile to get teacherId
      const profileResponse = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profile = await profileResponse.json();
      const teacherId = profile.teacherId || user?.id;

      // Fetch teacher's weekly schedule
      const response = await fetch(`${API_CONFIG.BASE_URL}/schedules/teacher/${teacherId}/weekly`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data = await response.json();

      // Filter schedules for today and current/future time slots
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes(); // Convert to HHMM format for comparison

      const todaysSchedules = (data?.days || [])
        .filter((day: any) => day.day === today)
        .flatMap((day: any) => (day?.items || []))
        .filter((schedule: any) => {
          const startTime = parseInt(schedule.startTime.replace(':', ''));
          // Include current class or future classes (within next 2 hours)
          return startTime >= currentTime - 100; // Allow some buffer for ongoing classes
        })
        .map((schedule: any) => ({
          id: schedule.id,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          course: {
            id: schedule.course?.id,
            name: schedule.course?.name,
            code: schedule.course?.code || schedule.course?.id,
          },
          classroom: schedule.classroom ? {
            id: schedule.classroom.id,
            name: schedule.classroom.name,
          } : undefined,
          class: {
            id: schedule.class?.id,
            name: schedule.class?.name,
          },
        }));

      setScheduledClasses(todaysSchedules);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load scheduled classes';
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/teacher/my-courses/by-class/${classId}`, {
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

  const fetchStudentsForSchedule = async (scheduleId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Find the selected schedule to get course and class info
      const selectedScheduleData = scheduledClasses.find(s => s.id === scheduleId);
      if (!selectedScheduleData) {
        throw new Error('Selected schedule not found');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/teacher/my-students/by-course/${selectedScheduleData.course.id}`, {
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
          grade: selectedScheduleData.class?.name || '',
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
    if (token && user?.role === 'teacher') {
      fetchTodaysScheduledClasses();
    }
  }, [token, user]);

  useEffect(() => {
    if (selectedSchedule) {
      fetchStudentsForSchedule(selectedSchedule);
    } else {
      setStudents([]);
      setAttendanceStatus({});
    }
  }, [selectedSchedule, scheduledClasses]);

  const handleScheduleSelect = (scheduleId: string) => {
    setSelectedSchedule(scheduleId);
    setAttendanceStatus({});
    setSearchTerm(""); // Clear search when selecting new schedule
  };

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [studentId]: isPresent,
    }));
  };

  const handleSelectAllPresent = () => {
    const newStatus: Record<string, boolean> = {};
    filteredStudents.forEach((student) => {
      newStatus[student.id] = true;
    });
    setAttendanceStatus(newStatus);
  };

  const handleSelectAllAbsent = () => {
    const newStatus: Record<string, boolean> = {};
    filteredStudents.forEach((student) => {
      newStatus[student.id] = false;
    });
    setAttendanceStatus(newStatus);
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitAttendance = async () => {
    if (!selectedSchedule) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select a scheduled class before submitting attendance.',
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

    const selectedScheduleData = scheduledClasses.find(s => s.id === selectedSchedule);
    if (!selectedScheduleData) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selected schedule not found.',
      });
      return;
    }

    const payload = {
      scheduleId: selectedSchedule,
      classId: selectedScheduleData.class.id,
      courseId: selectedScheduleData.course.id,
      date: new Date().toISOString(),
      schoolId: user?.schoolId,
      attendanceStatus,
    };

    // Log payload for debugging
    console.log('Sending attendance payload:', payload);

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_CONFIG.BASE_URL}/teacher/attendance`, {
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
        description: `Attendance for ${selectedScheduleData.course.name} - ${selectedScheduleData.class.name} has been recorded.`,
      });

      // Reset form
      setSelectedSchedule('');
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
          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled Class</label>
              <Select value={selectedSchedule} onValueChange={handleScheduleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a scheduled class" />
                </SelectTrigger>
                <SelectContent>
                  {scheduledClasses.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {schedule.course.name} - {schedule.class.name}
                          ({schedule.startTime} - {schedule.endTime})
                          {schedule.classroom && (
                            <>
                              <MapPin className="h-3 w-3 inline ml-2" />
                              {schedule.classroom.name}
                            </>
                          )}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSchedule && students.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {students.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {filteredStudents.length} of {students.length} students
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllPresent}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Mark All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllAbsent}
                    className="gap-2"
                  >
                    Mark All Absent
                  </Button>
                </div>
              </div>
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
                {filteredStudents.map((student) => (
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
              {filteredStudents.length === 0 && students.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No students found matching "{searchTerm}".
                </div>
              )}
            </div>
          ) : selectedSchedule ? (
            <div className="text-center py-8 text-muted-foreground">
              No students found for this scheduled class.
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Please select a scheduled class to view students.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleSubmitAttendance}
            disabled={!selectedSchedule || filteredStudents.length === 0}
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