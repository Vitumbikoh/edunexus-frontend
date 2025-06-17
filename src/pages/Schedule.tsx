import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, ArrowLeft } from "lucide-react";

interface Class {
  id: string;
  name: string;
  numericalName: number;
  description: string;
}

interface Schedule {
  id: string;
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

export default function ClassScheduleManagement() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState<Class[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isAdmin] = useState(user?.role === 'admin');

  // Form states
  const [classForm, setClassForm] = useState({
    name: '',
    numericalName: 1
  });

  const [scheduleForm, setScheduleForm] = useState({
    classId: '',
    day: '',
    startTime: '',
    endTime: '',
    courseId: '',
    teacherId: '',
    classroomId: '',
    isActive: true
  });

  // Fetch all required data with proper error handling
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      
      // Fetch all endpoints in parallel
      const [classesRes, schedulesRes, coursesRes, teachersRes, classroomsRes] = await Promise.all([
        fetch("http://localhost:5000/api/v1/classes", {
          headers: { Authorization: `Bearer ${token}` }
        }),
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
        })
      ]);

      // Process responses
      const classesData = classesRes.ok ? await classesRes.json() : [];
      const schedulesData = schedulesRes.ok ? await schedulesRes.json() : { data: [] };
      const coursesData = coursesRes.ok ? await coursesRes.json() : [];
      const teachersData = teachersRes.ok ? await teachersRes.json() : [];
      const classroomsData = classroomsRes.ok ? await classroomsRes.json() : [];

      // Handle cases where endpoints might return paginated data
      const processedCourses = coursesData.courses || coursesData;
      const processedTeachers = teachersData.teachers || teachersData;

      setClasses(classesData);
      setCourses(Array.isArray(processedCourses) ? processedCourses : []);
      setTeachers(Array.isArray(processedTeachers) ? processedTeachers : []);
      setClassrooms(classroomsData);
      
      // Transform schedule data to match our interface
      const transformedSchedules = schedulesData.data?.map((s: any) => ({
        id: s.id,
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

  // Create new class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/v1/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: classForm.name,
          numericalName: Number(classForm.numericalName),
          description: `Grade ${classForm.numericalName} class`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create class");
      }

      const result = await response.json();
      setClasses([...classes, result]);
      setClassForm({ name: '', numericalName: 1 });
      toast({ title: "Class created successfully!" });
      fetchData();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to create class");
    }
  };

  // Create new schedule with proper time formatting
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setApiError("Only admins can create schedules");
      return;
    }

    try {
      // Format time to ISO string if it's not already
      const startTime = scheduleForm.startTime.includes('T') 
        ? scheduleForm.startTime 
        : `1970-01-01T${scheduleForm.startTime}:00Z`;
      const endTime = scheduleForm.endTime.includes('T') 
        ? scheduleForm.endTime 
        : `1970-01-01T${scheduleForm.endTime}:00Z`;

      const payload = {
        day: scheduleForm.day,
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
        classId: '', day: '', startTime: '', endTime: '', 
        courseId: '', teacherId: '', classroomId: '', isActive: true
      });
      toast({ title: "Schedule created successfully!" });
      fetchData();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to create schedule");
    }
  };

  // Delete class
  const deleteClass = async (id: string) => {
    if (!window.confirm("Delete this class?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/v1/classes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to delete class");
      setClasses(classes.filter(c => c.id !== id));
      toast({ title: "Class deleted successfully!" });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to delete class");
    }
  };

  // Delete schedule
  const deleteSchedule = async (id: string) => {
    if (!window.confirm("Delete this schedule?")) return;
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
    }
  };

  // Initial data load
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  if (isLoading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Class & Schedule Management</h1>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Class</CardTitle>
              <CardDescription>
                {isAdmin ? "Add a new class to the system" : "Admin access required"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class Name</Label>
                    <Input
                      value={classForm.name}
                      onChange={(e) => setClassForm({...classForm, name: e.target.value})}
                      placeholder="e.g., Form One"
                      required
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade Level</Label>
                    <Input
                      type="number"
                      value={classForm.numericalName}
                      onChange={(e) => setClassForm({...classForm, numericalName: Number(e.target.value)})}
                      placeholder="e.g., 1"
                      min="1"
                      required
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={!isAdmin}>
                  <Plus className="mr-2" /> Create Class
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Class List</CardTitle>
              <CardDescription>All classes in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Description</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map(cls => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>Grade {cls.numericalName}</TableCell>
                      <TableCell>{cls.description}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteClass(cls.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-6">
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
                    <Label>Class</Label>
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
                    <Label>Day</Label>
                    <Select
                      value={scheduleForm.day}
                      onValueChange={(val) => setScheduleForm({...scheduleForm, day: val})}
                      required
                      disabled={!isAdmin}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input 
                      type="time"
                      value={scheduleForm.startTime}
                      onChange={(e) => setScheduleForm({...scheduleForm, startTime: e.target.value})}
                      required
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input 
                      type="time"
                      value={scheduleForm.endTime}
                      onChange={(e) => setScheduleForm({...scheduleForm, endTime: e.target.value})}
                      required
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select
                      value={scheduleForm.courseId}
                      onValueChange={(val) => setScheduleForm({...scheduleForm, courseId: val})}
                      required
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
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Select
                      value={scheduleForm.teacherId}
                      onValueChange={(val) => setScheduleForm({...scheduleForm, teacherId: val})}
                      required
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
                    <Label>Classroom</Label>
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

                <Button 
                  type="submit" 
                  disabled={!isAdmin || 
                    !scheduleForm.classId || 
                    !scheduleForm.day || 
                    !scheduleForm.startTime || 
                    !scheduleForm.endTime || 
                    !scheduleForm.classroomId
                  } 
                  className="mt-4"
                >
                  <Plus className="mr-2" /> Create Schedule
                </Button>
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
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Classroom</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map(schedule => {
                    const startTime = schedule.startTime.includes('T') 
                      ? schedule.startTime.split('T')[1].substring(0, 5)
                      : schedule.startTime;
                    const endTime = schedule.endTime.includes('T')
                      ? schedule.endTime.split('T')[1].substring(0, 5)
                      : schedule.endTime;

                    return (
                      <TableRow key={schedule.id}>
                        <TableCell>{schedule.class?.name || 'N/A'}</TableCell>
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
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
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
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}