import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Plus, 
  Save, 
  Download, 
  Upload, 
  AlertTriangle, 
  Clock,
  User,
  BookOpen,
  MapPin,
  Edit,
  Trash2,
  RefreshCw,
  Copy,
  FileUp,
  AlertCircle
} from "lucide-react";
import { API_CONFIG } from '@/config/api';

// Enhanced interfaces for the schedule module
interface GridItem {
  id?: string;
  day: string;
  startTime: string;
  endTime: string;
  courseId: string;
  teacherId: string;
  classroomId?: string;
  isActive?: boolean;
  // Display properties
  courseName?: string;
  teacherName?: string;
  classroomName?: string;
}

interface Conflict {
  type: 'teacher' | 'class' | 'room';
  message: string;
  existingSchedule: {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    className?: string;
    teacherName?: string;
    roomName?: string;
  };
}

interface Class {
  id: string;
  name: string;
  numericalName: number;
}

interface Course {
  id: string;
  name: string;
  code: string;
  classId?: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  class?: {
    id: string;
    name: string;
  };
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
}

interface Classroom {
  id: string;
  name: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', // Morning sessions
  '13:30', '14:30' // Afternoon sessions (lunch break 12:00-13:30)
];

// Academic periods mapping for template generation
const ACADEMIC_PERIODS = {
  MORNING: ['08:00', '09:00', '10:00', '11:00'],
  LUNCH_BREAK: ['12:00'], // Not used for classes
  AFTERNOON: ['13:30', '14:30']
};

export default function WeeklyScheduleGrid() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  // State management
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [scheduleItems, setScheduleItems] = useState<GridItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiError, setHasApiError] = useState(false);
  const [conflicts, setConflicts] = useState<Array<{ item: GridItem; conflicts: Conflict[] }>>([]);
  
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GridItem | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  // Form for editing schedule items
  const [itemForm, setItemForm] = useState<GridItem>({
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    courseId: '',
    teacherId: '',
    classroomId: ''
  });

  // Load initial data
  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  // Load schedule when class is selected
  useEffect(() => {
    if (selectedClassId && token) {
      loadClassSchedule();
    }
  }, [selectedClassId, token]);

  // Auto-set teacher when course changes
  useEffect(() => {
    if (itemForm.courseId) {
      const selectedCourse = courses.find(c => c.id === itemForm.courseId);
      if (selectedCourse?.teacher?.id) {
        setItemForm(prev => ({ ...prev, teacherId: selectedCourse.teacher.id }));
      }
    }
  }, [itemForm.courseId, courses]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [classesRes, coursesRes, teachersRes, classroomsRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/classes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/course?page=1&limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/users/teachers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/classrooms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Check if responses are ok before parsing JSON
      const classesData = classesRes.ok ? await classesRes.json() : { data: [] };
      const coursesData = coursesRes.ok ? await coursesRes.json() : { courses: [] };
      const teachersData = teachersRes.ok ? await teachersRes.json() : { data: [] };
      const classroomsData = classroomsRes.ok ? await classroomsRes.json() : { data: [] };

      setClasses(Array.isArray(classesData.data) ? classesData.data : Array.isArray(classesData) ? classesData : []);
      // Debug: Log course data to understand structure
      console.log('Raw courses response:', coursesData);
      const coursesList = Array.isArray(coursesData.courses) ? coursesData.courses : 
                         Array.isArray(coursesData.data) ? coursesData.data : 
                         Array.isArray(coursesData) ? coursesData : [];
      console.log('Processed courses:', coursesList);
      setCourses(coursesList);
      setTeachers(Array.isArray(teachersData.data) ? teachersData.data : Array.isArray(teachersData) ? teachersData : []);
      setClassrooms(Array.isArray(classroomsData.data) ? classroomsData.data : Array.isArray(classroomsData) ? classroomsData : []);
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setHasApiError(true);
      // Ensure all state remains as empty arrays even on error
      setClasses([]);
      setCourses([]);
      setTeachers([]);
      setClassrooms([]);
      
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "Failed to load schedule data. Backend server may not be running.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassSchedule = async () => {
    if (!selectedClassId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/schedules/class/${selectedClassId}/weekly`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to load schedule');
      
      const data = await response.json();
      
      // Transform the weekly data into grid items
      const items: GridItem[] = [];
      data.days.forEach((day: any) => {
        day.items.forEach((item: any) => {
          items.push({
            id: item.id,
            day: day.day,
            startTime: item.startTime,
            endTime: item.endTime,
            courseId: item.course.id,
            teacherId: item.teacher.id,
            classroomId: item.classroom?.id || '',
            courseName: item.course.name,
            teacherName: item.teacher.name,
            classroomName: item.classroom?.name || ''
          });
        });
      });
      
      setScheduleItems(items);
    } catch (error) {
      toast({
        title: "Error loading schedule",
        description: error instanceof Error ? error.message : "Failed to load class schedule",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateConflicts = async (items: GridItem[]) => {
    if (!selectedClassId || items.length === 0) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/schedules/validate-conflicts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClassId,
          schedules: items
        })
      });

      if (!response.ok) throw new Error('Failed to validate conflicts');
      
      const results = await response.json();
      const conflictResults = results.filter((r: any) => !r.validation.isValid);
      setConflicts(conflictResults);
      
      return conflictResults.length === 0;
    } catch (error) {
      toast({
        title: "Validation error",
        description: error instanceof Error ? error.message : "Failed to validate schedule",
        variant: "destructive"
      });
      return false;
    }
  };

  const saveSchedule = async () => {
    if (!selectedClassId || !isAdmin) return;

    // Validate conflicts first
    const isValid = await validateConflicts(scheduleItems);
    if (!isValid) {
      toast({
        title: "Schedule conflicts detected",
        description: "Please resolve conflicts before saving",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/schedules/grid-upsert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClassId,
          replaceAll: true,
          schedules: scheduleItems.map(item => ({
            ...(item.id && !item.id.startsWith('temp-') ? { id: item.id } : {}),
            day: item.day,
            startTime: item.startTime,
            endTime: item.endTime,
            courseId: item.courseId,
            teacherId: item.teacherId,
            classroomId: item.classroomId || undefined,
            isActive: item.isActive ?? true
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to save schedule');
      
      const result = await response.json();
      toast({
        title: "Schedule saved successfully",
        description: `Created: ${result.created}, Updated: ${result.updated}, Deleted: ${result.deleted}`,
      });
      
      // Reload the schedule
      await loadClassSchedule();
    } catch (error) {
      toast({
        title: "Error saving schedule",
        description: error instanceof Error ? error.message : "Failed to save schedule",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = async () => {
    if (!selectedClassId) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/schedules/class/${selectedClassId}/export.csv`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to export schedule');
      
      const data = await response.json();
      
      // Create and download the CSV file
      const blob = new Blob([data.content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Schedule exported",
        description: "CSV file downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Export error",
        description: error instanceof Error ? error.message : "Failed to export schedule",
        variant: "destructive"
      });
    }
  };

  const addScheduleItem = () => {
    setEditingItem(null);
    setItemForm({
      day: 'Monday',
      startTime: '08:00',
      endTime: '09:00',
      courseId: '',
      teacherId: '',
      classroomId: ''
    });
    setIsEditDialogOpen(true);
  };

  const editScheduleItem = (item: GridItem) => {
    setEditingItem(item);
    setItemForm({ ...item });
    setIsEditDialogOpen(true);
  };

  const deleteScheduleItem = (itemId: string) => {
    setScheduleItems(prev => prev.filter(item => item.id !== itemId));
  };

  const saveScheduleItem = () => {
    const course = courses.find(c => c.id === itemForm.courseId);
    const teacher = teachers.find(t => t.id === itemForm.teacherId);
    const classroom = classrooms.find(c => c.id === itemForm.classroomId);

    const newItem: GridItem = {
      ...itemForm,
      id: editingItem?.id || `temp-${Date.now()}`,
      courseName: course?.name,
      teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : '',
      classroomName: classroom?.name
    };

    if (editingItem) {
      setScheduleItems(prev => prev.map(item => 
        item.id === editingItem.id ? newItem : item
      ));
    } else {
      setScheduleItems(prev => [...prev, newItem]);
    }

    setIsEditDialogOpen(false);
  };

  const getItemsForDayAndTime = (day: string, timeSlot: string) => {
    return scheduleItems.filter(item => 
      item.day === day && 
      item.startTime <= timeSlot && 
      item.endTime > timeSlot
    );
  };

  const getConflictColor = (item: GridItem) => {
    const hasConflict = conflicts.some(c => 
      c.item.day === item.day && 
      c.item.startTime === item.startTime &&
      c.item.courseId === item.courseId
    );
    return hasConflict ? 'bg-red-100 border-red-300' : 'bg-blue-50 border-blue-200';
  };

  // Template Generation Functions
  const generateOptimalScheduleTemplate = () => {
    if (!selectedClassId) {
      toast({
        title: "No class selected",
        description: "Please select a class before generating a template",
        variant: "destructive"
      });
      return;
    }

    // Support both flat classId and nested class.id
    const classCourses = courses.filter(course => (course.classId || course.class?.id) === selectedClassId);
    
    if (classCourses.length === 0) {
      toast({
        title: "No courses found",
        description: "No courses are assigned to the selected class",
        variant: "destructive"
      });
      return;
    }

    const newScheduleItems: GridItem[] = [];
    const allTimeSlots = [...ACADEMIC_PERIODS.MORNING, ...ACADEMIC_PERIODS.AFTERNOON];
    let itemIdCounter = 1;

    // Enforce per-course weekly quotas and daily uniqueness
    // Total periods per week = 6 periods/day * 5 days = 30
    // With ~10 courses, default target = 3 occurrences per course
    const targetPerCourse = Math.floor((DAYS.length * allTimeSlots.length) / classCourses.length) || 1; // typically 3
    const remainingByCourse: Record<string, number> = {};
    classCourses.forEach(c => { remainingByCourse[c.id] = targetPerCourse; });

    // If there is remainder (e.g., 30 % 10 = 0, nothing to distribute). If not zero, distribute +1 to first N courses
    const totalNeeded = DAYS.length * allTimeSlots.length;
    let assignedTotal = targetPerCourse * classCourses.length;
    let cursor = 0; // used to rotate fairness
    while (assignedTotal < totalNeeded) {
      const course = classCourses[cursor % classCourses.length];
      remainingByCourse[course.id] += 1;
      assignedTotal++;
      cursor++;
    }

    // Helper to pick next course for a day that still has quota and not used on that day yet
    const pickCourse = (usedToday: Set<string>, offset: number) => {
      for (let i = 0; i < classCourses.length; i++) {
        const idx = (offset + i) % classCourses.length;
        const c = classCourses[idx];
        if (remainingByCourse[c.id] > 0 && !usedToday.has(c.id)) {
          return c;
        }
      }
      // If forced (not enough unique), allow repeat within the day as last resort
      for (let i = 0; i < classCourses.length; i++) {
        const idx = (offset + i) % classCourses.length;
        const c = classCourses[idx];
        if (remainingByCourse[c.id] > 0) return c;
      }
      return null;
    };

    // Fill each day with exactly 6 periods
    let globalOffset = 0;
    DAYS.forEach((day) => {
      const usedToday = new Set<string>();
      allTimeSlots.forEach((timeSlot, slotIndex) => {
        const course = pickCourse(usedToday, globalOffset + slotIndex);
        if (!course) return; // should not happen with healthy data
        usedToday.add(course.id);
        remainingByCourse[course.id] -= 1;

        newScheduleItems.push({
          id: `template-${itemIdCounter++}`,
          day,
          startTime: timeSlot,
          endTime: getEndTime(timeSlot),
          courseId: course.id,
          teacherId: course.teacher?.id || '',
          classroomId: '',
          courseName: course.name,
          teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'Unassigned',
          classroomName: 'TBA'
        });
      });
      // Rotate start to avoid same ordering every day
      globalOffset += 3;
    });

    setScheduleItems(newScheduleItems);
    setIsTemplateDialogOpen(false);
    
    // Calculate statistics for user feedback
    const dailyDistribution = DAYS.map(day => {
      const dayCount = newScheduleItems.filter(item => item.day === day).length;
      return `${day}: ${dayCount}`;
    }).join(', ');
    
    toast({
      title: "Balanced schedule template generated",
      description: `Generated ${newScheduleItems.length} periods (6 per day) for ${classCourses.length} courses. Distribution: ${dailyDistribution}`,
    });
  };

  const getEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = hours + 1;
    return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const clearSchedule = () => {
    setScheduleItems([]);
    toast({
      title: "Schedule cleared",
      description: "All schedule items have been removed",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading schedule data...</span>
      </div>
    );
  }

  if (hasApiError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Backend Connection Error</AlertTitle>
          <AlertDescription>
            Unable to connect to the backend server. Please ensure:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>The backend server is running on port 5000</li>
              <li>You have proper authentication</li>
              <li>The API endpoints are available</li>
            </ul>
            <Button 
              onClick={() => {
                setHasApiError(false);
                loadInitialData();
              }} 
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weekly Schedule Grid</h1>
          <p className="text-muted-foreground">Professional timetable management with conflict detection</p>
        </div>
        {!isAdmin && (
          <Badge variant="secondary">Read-only access</Badge>
        )}
      </div>

      {/* Class Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class to manage schedule" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(classes) && classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClassId && (
              <div className="flex gap-2">
                <Button onClick={loadClassSchedule} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={exportCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                {isAdmin && (
                  <>
                    <Button onClick={addScheduleItem} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Period
                    </Button>
                    <Button 
                      onClick={() => setIsTemplateDialogOpen(true)} 
                      variant="outline"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FileUp className="h-4 w-4 mr-2" />
                      Generate Template
                    </Button>
                    <Button onClick={saveSchedule} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Schedule
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{conflicts.length} conflict(s) detected:</strong>
            <ul className="mt-2 space-y-1">
              {conflicts.slice(0, 3).map((conflict, idx) => (
                <li key={idx} className="text-sm">
                  • {conflict.conflicts[0]?.message}
                </li>
              ))}
              {conflicts.length > 3 && (
                <li className="text-sm font-medium">...and {conflicts.length - 3} more</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Weekly Grid */}
      {selectedClassId && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Timetable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 gap-2 min-w-[800px]">
                {/* Header row */}
                <div className="font-semibold p-2 border rounded bg-muted">Time</div>
                {DAYS.map(day => (
                  <div key={day} className="font-semibold p-2 border rounded bg-muted text-center">
                    {day}
                  </div>
                ))}

                {/* Lunch break indicator row */}
                <div className="contents">
                  <div className="p-2 border rounded bg-orange-100 text-sm font-medium text-orange-800">
                    12:00-13:30
                  </div>
                  {DAYS.map(day => (
                    <div key={`${day}-lunch`} className="p-2 border rounded bg-orange-50 text-center text-sm text-orange-700 font-medium">
                      🍽️ LUNCH BREAK
                    </div>
                  ))}
                </div>

                {/* Time slot rows */}
                {TIME_SLOTS.map((timeSlot, timeIndex) => (
                  <div key={timeSlot} className="contents">
                    <div className="p-2 border rounded bg-muted text-sm font-medium">
                      {timeSlot}
                      {timeSlot === '11:00' && <div className="text-xs text-gray-500 mt-1">↓ Lunch Break</div>}
                    </div>
                    {DAYS.map(day => {
                      const items = getItemsForDayAndTime(day, timeSlot);
                      return (
                        <div key={`${day}-${timeSlot}`} className="p-1 border rounded min-h-[60px]">
                          {items.map(item => (
                            <div
                              key={item.id}
                              className={`p-2 rounded border text-xs space-y-1 ${getConflictColor(item)}`}
                            >
                              <div className="font-semibold flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {item.courseName}
                              </div>
                              <div className="text-gray-600 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.teacherName}
                              </div>
                              {item.classroomName && (
                                <div className="text-gray-600 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {item.classroomName}
                                </div>
                              )}
                              <div className="text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.startTime}-{item.endTime}
                              </div>
                              {isAdmin && (
                                <div className="flex gap-1 mt-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-5 w-5 p-0"
                                    onClick={() => editScheduleItem(item)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-5 w-5 p-0 text-red-600 hover:bg-red-50"
                                    onClick={() => deleteScheduleItem(item.id!)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Template Generation Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generate Schedule Template</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Balanced Daily Schedule Template:</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• <strong>Every Class, Every Day:</strong> Each form gets 6 periods daily (Mon-Fri)</li>
                <li>• <strong>Daily Structure:</strong> 4 morning periods + 2 afternoon periods</li>
                <li>• <strong>Protected Lunch:</strong> 12:00 PM - 1:30 PM break (no classes)</li>
                <li>• <strong>Equal Distribution:</strong> All 10 courses appear ~3 times per week</li>
                <li>• <strong>Core Priority:</strong> Math & English guaranteed daily presence</li>
                <li>• <strong>Auto-Assignment:</strong> Teachers assigned from course data</li>
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2">Current Class Information:</h4>
              <div className="text-sm text-amber-700">
                <p><strong>Selected Class:</strong> {classes.find(c => c.id === selectedClassId)?.name || 'None'}</p>
                <p><strong>Available Courses:</strong> {courses.filter(c => (c.classId || c.class?.id) === selectedClassId).length}</p>
                <p><strong>Template will create:</strong> Exactly 30 periods (6 per day × 5 days)</p>
                <p><strong>Daily Schedule:</strong> 8:00-12:00 (4 periods), 1:30-3:30 (2 periods)</p>
                <p><strong>Guaranteed:</strong> Every form has classes every single weekday</p>
              </div>

              <div className="mt-3 p-3 bg-white rounded border">
                <p className="font-medium text-amber-900 mb-2">Daily Distribution Preview:</p>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {DAYS.map(day => (
                    <div key={day} className="text-center p-2 bg-amber-100 rounded">
                      <div className="font-semibold">{day.slice(0,3)}</div>
                      <div className="text-amber-800">6 periods</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {scheduleItems.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Current Schedule Summary:</h4>
                <div className="text-sm text-green-700">
                  <p><strong>Total Periods:</strong> {scheduleItems.length}</p>
                  <p><strong>Unique Courses:</strong> {new Set(scheduleItems.map(item => item.courseId)).size}</p>
                  <p><strong>Daily Distribution:</strong> {DAYS.map(day =>
                    `${day}: ${scheduleItems.filter(item => item.day === day).length}`
                  ).join(', ')}</p>
                </div>
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This will replace your current schedule.
                Make sure to save any existing work before proceeding.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button
              onClick={generateOptimalScheduleTemplate}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <FileUp className="h-4 w-4 mr-2" />
              Generate Optimal Template
            </Button>
            <Button
              variant="outline"
              onClick={clearSchedule}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Schedule
            </Button>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Schedule Period' : 'Add Schedule Period'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Day</Label>
                <Select value={itemForm.day} onValueChange={(val) => setItemForm({...itemForm, day: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Course</Label>
                <Select value={itemForm.courseId} onValueChange={(val) => setItemForm({...itemForm, courseId: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(courses) && courses
                      .filter(course => {
                        // If no class is selected, show all courses
                        if (!selectedClassId) return true;
                        
                        // Show courses that match the selected class OR courses without classId (unassigned)
                        return course.classId === selectedClassId || 
                               course.class?.id === selectedClassId ||
                               (!course.classId && !course.class?.id); // Show unassigned courses
                      })
                      .map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} ({course.code})
                          {(!course.classId && !course.class?.id) && ' - Unassigned'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={itemForm.startTime}
                  onChange={(e) => setItemForm({...itemForm, startTime: e.target.value})}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={itemForm.endTime}
                  onChange={(e) => setItemForm({...itemForm, endTime: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Teacher (Auto-assigned from course)</Label>
              <Input
                value={(() => {
                  const selectedCourse = courses.find(c => c.id === itemForm.courseId);
                  return selectedCourse?.teacher ? `${selectedCourse.teacher.firstName} ${selectedCourse.teacher.lastName} (${selectedCourse.teacher.username})` : 'Select a course first';
                })()}
                readOnly
                placeholder="Teacher will be auto-assigned when course is selected"
              />
            </div>

            <div>
              <Label>Classroom (Optional)</Label>
              <Select value={itemForm.classroomId || ''} onValueChange={(val) => setItemForm({...itemForm, classroomId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select classroom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No classroom</SelectItem>
                  {Array.isArray(classrooms) && classrooms.map(classroom => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={saveScheduleItem} className="flex-1">
                {editingItem ? 'Update' : 'Add'} Period
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}