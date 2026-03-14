import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Download,
  RefreshCw,
  Filter,
  Eye
} from "lucide-react";
import { API_CONFIG } from '@/config/api';

interface ScheduleItem {
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

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

interface TeacherScheduleData {
  teacherId: string;
  teacherName: string;
  schedules: ScheduleItem[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TeacherScheduleView() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  const [scheduleData, setScheduleData] = useState<TeacherScheduleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(DAYS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  useEffect(() => {
    if (token) {
      if (isAdmin) {
        loadTeachers();
      } else if (user?.id) {
        loadTeacherSchedule();
      }
    }
  }, [token, user?.id, isAdmin]);

  useEffect(() => {
    if (selectedTeacherId && token) {
      loadTeacherSchedule();
    }
  }, [selectedTeacherId, token]);

  const loadTeachers = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load teachers');
      }

      const teachersData = await response.json();
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      
      // Auto-select first teacher if available
      if (teachersData.length > 0) {
        setSelectedTeacherId(teachersData[0].id);
      }
    } catch (error) {
      toast({
        title: "Error loading teachers",
        description: error instanceof Error ? error.message : "Failed to load teachers",
        variant: "destructive"
      });
    }
  };

  const loadTeacherSchedule = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      let teacherId: string;
      let teacherName: string;

      if (isAdmin && selectedTeacherId) {
        // Admin viewing a specific teacher's schedule
        teacherId = selectedTeacherId;
        const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
        teacherName = selectedTeacher 
          ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`.trim()
          : 'Selected Teacher';
      } else {
        // Teacher viewing their own schedule or fallback
        const profileResponse = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to load profile');
        }

        const profile = await profileResponse.json();
        teacherId = profile.teacherId || user.id;
        teacherName = isTeacher 
          ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
          : 'Teacher Schedule';
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/schedules/teacher/${teacherId}/weekly`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load teacher schedule');
      }

      const data = await response.json();
      
      // Transform the data defensively
      setScheduleData({
        teacherId: teacherId,
        teacherName: teacherName,
        schedules: (data?.days || []).flatMap((day: any) =>
          (day?.items || []).map((item: any) => ({
            ...item,
            // Ensure required fields exist for rendering/color coding
            course: {
              id: item?.course?.id,
              name: item?.course?.name,
              code: item?.course?.code || item?.course?.id || item?.course?.name || 'COURSE',
            },
            class: {
              id: item?.class?.id,
              name: item?.class?.name,
            },
            day: day.day,
          }))
        )
      });

    } catch (error) {
      toast({
        title: "Error loading schedule",
        description: error instanceof Error ? error.message : "Failed to load teacher schedule",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };  const exportSchedule = async () => {
    if (!user?.id) return;

    try {
      // Prefer the teacherId we already resolved during load
      let teacherId = scheduleData?.teacherId;
      if (!teacherId) {
        if (isAdmin && selectedTeacherId) {
          teacherId = selectedTeacherId;
        } else {
          // Fallback: fetch profile to get teacherId when possible
          const profileRes = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            teacherId = profile.teacherId || user.id;
          } else {
            teacherId = user.id;
          }
        }
      }
      const daysParam = selectedDays.join(',');
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/schedules/teacher/${teacherId}/export.csv?days=${daysParam}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to export schedule');
      
      const data = await response.json();
      
      // Download the CSV file
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

  const getSchedulesForDay = (day: string) => {
    if (!scheduleData) return [];
    return scheduleData.schedules
      .filter(schedule => schedule.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getColorForCourse = (courseCode: string) => {
    // Generate consistent colors based on course code
    const colors = [
      'bg-transparent text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-500/40',
      'bg-transparent text-green-700 border-green-300 dark:text-green-300 dark:border-green-500/40',
      'bg-transparent text-purple-700 border-purple-300 dark:text-purple-300 dark:border-purple-500/40',
      'bg-transparent text-orange-700 border-orange-300 dark:text-orange-300 dark:border-orange-500/40',
      'bg-transparent text-pink-700 border-pink-300 dark:text-pink-300 dark:border-pink-500/40',
      'bg-transparent text-indigo-700 border-indigo-300 dark:text-indigo-300 dark:border-indigo-500/40',
      'bg-transparent text-teal-700 border-teal-300 dark:text-teal-300 dark:border-teal-500/40',
      'bg-transparent text-yellow-700 border-yellow-300 dark:text-yellow-300 dark:border-yellow-500/40'
    ];
    
    const hash = courseCode.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getTotalClassesPerDay = () => {
    if (!scheduleData) return {};
    
    const counts: Record<string, number> = {};
    DAYS.forEach(day => {
      counts[day] = getSchedulesForDay(day).length;
    });
    return counts;
  };

  const getUniqueClasses = () => {
    if (!scheduleData) return [];
    const classMap = new Map();
    scheduleData.schedules.forEach(schedule => {
      classMap.set(schedule.class.id, schedule.class);
    });
    return Array.from(classMap.values());
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading teacher schedule...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {isTeacher ? 'My Schedule' : 'Teacher Schedule'}
            </h1>
            {scheduleData && (
              <p className="text-muted-foreground">{scheduleData.teacherName}</p>
            )}
          </div>
          
          {/* Teacher Selector for Admins */}
          {isAdmin && teachers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Teacher:</span>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTeacherSchedule}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportSchedule}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Schedule Overview Cards */}
      {scheduleData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-transparent border border-blue-300/70 dark:border-blue-500/40 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{scheduleData.schedules.length}</div>
                  <div className="text-sm text-muted-foreground">Total Classes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-transparent border border-green-300/70 dark:border-green-500/40 rounded-lg">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{getUniqueClasses().length}</div>
                  <div className="text-sm text-muted-foreground">Classes Teaching</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-transparent border border-purple-300/70 dark:border-purple-500/40 rounded-lg">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {new Set(scheduleData.schedules.map(s => s.course.id)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">Subjects</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and View Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            View Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <span className="text-sm font-medium">Days:</span>
              {DAYS.map(day => (
                <Badge
                  key={day}
                  variant={selectedDays.includes(day) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedDays(prev => 
                      prev.includes(day) 
                        ? prev.filter(d => d !== day)
                        : [...prev, day]
                    );
                  }}
                >
                  {day.slice(0, 3)}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">View:</span>
              <Select value={viewMode} onValueChange={(val: 'grid' | 'list') => setViewMode(val)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Display */}
      {scheduleData && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {selectedDays.map(day => {
                  const daySchedules = getSchedulesForDay(day);
                  const classCount = getTotalClassesPerDay()[day] || 0;
                  
                  return (
                    <div key={day} className="space-y-3">
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">{day}</h3>
                        <Badge variant="outline" className="text-xs">
                          {classCount} {classCount === 1 ? 'class' : 'classes'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {daySchedules.length === 0 ? (
                          <div className="text-center text-muted-foreground text-sm py-8">
                            No classes scheduled
                          </div>
                        ) : (
                          daySchedules.map(schedule => (
                            <div
                              key={schedule.id}
                              className={`p-3 rounded-lg border ${getColorForCourse(schedule.course.code)}`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium text-sm">
                                    {schedule.startTime} - {schedule.endTime}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  <span className="font-semibold">
                                    {schedule.course.name}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span className="text-sm">
                                    {schedule.class.name}
                                  </span>
                                </div>
                                
                                {schedule.classroom && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-sm">
                                      {schedule.classroom.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {selectedDays.map(day => {
                  const daySchedules = getSchedulesForDay(day);
                  
                  return (
                    <div key={day}>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        {day}
                        <Badge variant="outline" className="text-xs">
                          {daySchedules.length} {daySchedules.length === 1 ? 'class' : 'classes'}
                        </Badge>
                      </h3>
                      
                      {daySchedules.length === 0 ? (
                        <p className="text-muted-foreground text-sm italic ml-4">
                          No classes scheduled for {day}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {daySchedules.map(schedule => (
                            <div
                              key={schedule.id}
                              className="flex items-center gap-4 p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-1">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">
                                  {schedule.course.name} ({schedule.course.code})
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{schedule.class.name}</span>
                              </div>
                              
                              {schedule.classroom && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{schedule.classroom.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!scheduleData && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Schedule Found</h3>
            <p className="text-muted-foreground mb-4">
              {isTeacher 
                ? "You don't have any classes scheduled yet. Contact your admin if this seems incorrect."
                : "No schedule data available for this teacher."
              }
            </p>
            <Button onClick={loadTeacherSchedule} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Schedule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}