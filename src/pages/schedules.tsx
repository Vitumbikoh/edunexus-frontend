import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { format, parseISO, getDay } from 'date-fns';
import { Preloader } from '@/components/ui/preloader';

interface Schedule {
  id: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  course?: {
    id: string;
    name: string;
    code: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  classroom?: {
    id: string;
    name: string;
    code: string;
  };
  class?: {
    id: string;
    name: string;
  };
}

interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  status: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: string;
}

interface Classroom {
  id: string;
  name: string;
  code: string;
  capacity: number;
}

interface Class {
  id: string;
  name: string;
  numericalName: number;
  description: string;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScheduleManagement() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isAdmin] = useState(user?.role === 'admin');

  // Form state
  const [scheduleForm, setScheduleForm] = useState({
    classId: '',
    date: '',
    day: '',
    startTime: '',
    endTime: '',
    courseId: '',
    teacherId: '',
    classroomId: '',
    isActive: true
  });

  // Calculate day from date
  const calculateDayFromDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return daysOfWeek[date.getDay()];
    } catch (error) {
      console.error('Invalid date format', error);
      return '';
    }
  };

  // Handle date change - updates both date and day
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    const dayValue = calculateDayFromDate(dateValue);
    setScheduleForm(prev => ({
      ...prev,
      date: dateValue,
      day: dayValue
    }));
  };

  // Fetch all required data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      
      const [schedulesRes, coursesRes, teachersRes, classroomsRes, classesRes] = await Promise.all([
        fetch("http://localhost:5000/api/v1/schedules", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/v1/course/courses", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/v1/teacher/teachers", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/v1/classrooms", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/v1/classes", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const schedulesData = schedulesRes.ok ? await schedulesRes.json() : { data: [] };
      const coursesData = coursesRes.ok ? await coursesRes.json() : [];
      const teachersData = teachersRes.ok ? await teachersRes.json() : [];
      const classroomsData = classroomsRes.ok ? await classroomsRes.json() : [];
      const classesData = classesRes.ok ? await classesRes.json() : [];

      const processedCourses = coursesData.courses || coursesData;
      const processedTeachers = teachersData.teachers || teachersData;

      setCourses(Array.isArray(processedCourses) ? processedCourses : []);
      setTeachers(Array.isArray(processedTeachers) ? processedTeachers : []);
      setClassrooms(classroomsData);
      setClasses(classesData);
      
      const transformedSchedules = schedulesData.data?.map((s: any) => ({
        id: s.id,
        date: s.date,
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: s.isActive,
        course: s.course,
        teacher: s.teacher,
        classroom: s.classroom,
        class: s.class
      })) || [];
      
      setSchedules(transformedSchedules);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to fetch data");
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new schedule
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setApiError("Only admins can create schedules");
      return;
    }

    try {
      // Validate required fields
      if (!scheduleForm.date || !scheduleForm.classId || !scheduleForm.classroomId || 
          !scheduleForm.startTime || !scheduleForm.endTime) {
        throw new Error("Please fill all required fields");
      }

      // Format times to include date (required by backend)
      const startTime = scheduleForm.startTime.includes('T') 
        ? scheduleForm.startTime 
        : `1970-01-01T${scheduleForm.startTime}:00Z`;
      const endTime = scheduleForm.endTime.includes('T') 
        ? scheduleForm.endTime 
        : `1970-01-01T${scheduleForm.endTime}:00Z`;

      const payload = {
        date: scheduleForm.date,
        day: calculateDayFromDate(scheduleForm.date),
        startTime,
        endTime,
        courseId: scheduleForm.courseId || null,
        teacherId: scheduleForm.teacherId || null,
        classroomId: scheduleForm.classroomId,
        classId: scheduleForm.classId,
        isActive: scheduleForm.isActive
      };

      const response = await fetch("http://localhost:5000/api/v1/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create schedule");
      }

      const result = await response.json();
      setSchedules([...schedules, result]);
      setScheduleForm({
        classId: '', 
        date: '',
        day: '', 
        startTime: '', 
        endTime: '', 
        courseId: '', 
        teacherId: '', 
        classroomId: '', 
        isActive: true
      });
      toast({ title: "Schedule created successfully!" });
      fetchData();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to create schedule");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create schedule",
        variant: "destructive"
      });
    }
  };

  // Delete schedule
  const deleteSchedule = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/v1/schedules/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to delete schedule");
      setSchedules(schedules.filter(s => s.id !== id));
      toast({ title: "Schedule deleted successfully!" });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to delete schedule");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete schedule",
        variant: "destructive"
      });
    }
  };

  // Toggle schedule active status
  const toggleScheduleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/schedules/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) throw new Error("Failed to update schedule status");
      
      setSchedules(schedules.map(s => 
        s.id === id ? { ...s, isActive: !currentStatus } : s
      ));
      toast({ title: "Schedule status updated!" });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to update schedule");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update schedule",
        variant: "destructive"
      });
    }
  };

  // Initial data load
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  if (isLoading) return <Preloader variant="spinner" size="lg" text="Loading schedules..." height="50vh" />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Schedule Management</h1>
        {!isAdmin && (
          <Badge variant="destructive" className="ml-auto">
            Admin Access Required
          </Badge>
        )}
      </div>

      {apiError && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {apiError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New Schedule</CardTitle>
          <CardDescription>
            {isAdmin ? "Add a new schedule for classes" : "Admin access required"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select
                  value={scheduleForm.classId}
                  onValueChange={(val) => setScheduleForm({...scheduleForm, classId: val})}
                  required
                  disabled={!isAdmin || classes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={classes.length === 0 ? "No classes available" : "Select class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} (Grade {cls.numericalName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input 
                  type="date"
                  value={scheduleForm.date}
                  onChange={handleDateChange}
                  required
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day</Label>
                <Input
                  value={scheduleForm.day}
                  readOnly
                  disabled
                  placeholder="Auto-calculated from date"
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input 
                  type="time"
                  value={scheduleForm.startTime}
                  onChange={(e) => setScheduleForm({...scheduleForm, startTime: e.target.value})}
                  required
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input 
                  type="time"
                  value={scheduleForm.endTime}
                  onChange={(e) => setScheduleForm({...scheduleForm, endTime: e.target.value})}
                  required
                  disabled={!isAdmin}
                />
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select
                  value={scheduleForm.courseId}
                  onValueChange={(val) => setScheduleForm({...scheduleForm, courseId: val})}
                  disabled={!isAdmin || courses.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={courses.length === 0 ? "No courses available" : "Select course"} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.filter(c => c.status === 'active').map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select
                  value={scheduleForm.teacherId}
                  onValueChange={(val) => setScheduleForm({...scheduleForm, teacherId: val})}
                  disabled={!isAdmin || teachers.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={teachers.length === 0 ? "No teachers available" : "Select teacher"} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.filter(t => t.status === 'active').map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Classroom *</Label>
                <Select
                  value={scheduleForm.classroomId}
                  onValueChange={(val) => setScheduleForm({...scheduleForm, classroomId: val})}
                  required
                  disabled={!isAdmin || classrooms.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={classrooms.length === 0 ? "No classrooms available" : "Select classroom"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map(classroom => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name} ({classroom.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                type="submit" 
                disabled={!isAdmin || 
                  !scheduleForm.classId || 
                  !scheduleForm.date ||
                  !scheduleForm.startTime || 
                  !scheduleForm.endTime || 
                  !scheduleForm.classroomId
                } 
                className="mt-4"
              >
                <Plus className="mr-2" /> Create Schedule
              </Button>
              
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={scheduleForm.isActive}
                  onChange={(e) => setScheduleForm({...scheduleForm, isActive: e.target.checked})}
                  className="h-4 w-4"
                  disabled={!isAdmin}
                />
                <Label htmlFor="isActive">Active Schedule</Label>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule List</CardTitle>
          <CardDescription>All scheduled classes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Classroom</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-8">
                    No schedules found
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map(schedule => {
                  const startTime = schedule.startTime.includes('T') 
                    ? schedule.startTime.split('T')[1].substring(0, 5)
                    : schedule.startTime;
                  const endTime = schedule.endTime.includes('T')
                    ? schedule.endTime.split('T')[1].substring(0, 5)
                    : schedule.endTime;
                  const date = schedule.date.split('T')[0];

                  return (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.class?.name || 'N/A'}</TableCell>
                      <TableCell>{date}</TableCell>
                      <TableCell>{schedule.day}</TableCell>
                      <TableCell>{startTime} - {endTime}</TableCell>
                      <TableCell>
                        {schedule.course ? `${schedule.course.name} (${schedule.course.code})` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {schedule.teacher ? 
                          `${schedule.teacher.firstName} ${schedule.teacher.lastName}` : 
                          'N/A'}
                      </TableCell>
                      <TableCell>
                        {schedule.classroom ? `${schedule.classroom.name} (${schedule.classroom.code})` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleScheduleStatus(schedule.id, schedule.isActive)}
                            >
                              {schedule.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteSchedule(schedule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}