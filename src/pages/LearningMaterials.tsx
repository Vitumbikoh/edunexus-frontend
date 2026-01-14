import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileType, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from 'react-router-dom';
import { API_CONFIG } from '@/config/api';

interface Class {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
}

export default function LearningMaterials() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [prefillCourseId, setPrefillCourseId] = useState<string>("");
  const [prefillCourseName, setPrefillCourseName] = useState<string>("");
  const [prefillClassId, setPrefillClassId] = useState<string>("");

  useEffect(() => {
    // Read query params or navigation state to prefill class/course when available
    const params = new URLSearchParams(location.search);
    const statePrefill: any = (location.state as any)?.prefill || {};
    const classId = statePrefill.classId || params.get('classId') || '';
    const courseId = statePrefill.courseId || params.get('courseId') || '';
    const courseName = statePrefill.courseName || '';
    if (classId) {
      setSelectedClass(classId);
      setPrefillClassId(classId);
    }
    if (courseId) {
      setPrefillCourseId(courseId);
    }
    if (courseName) {
      setPrefillCourseName(courseName);
    }
  }, [location.search, location.state]);

  // If only courseId is provided, derive classId from course details
  useEffect(() => {
    const deriveClassFromCourse = async () => {
      if (!prefillCourseId || prefillClassId || !token) return;
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/course/${prefillCourseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.classId) {
            setPrefillClassId(data.classId);
            setSelectedClass(data.classId);
          }
          if (data?.name && !prefillCourseName) {
            setPrefillCourseName(data.name);
          }
        }
      } catch (e) {
        // Silent fail; user can still select manually
      }
    };
    deriveClassFromCourse();
  }, [prefillCourseId, prefillClassId, token, prefillCourseName]);

  useEffect(() => {
    if (user && user.role === 'teacher' && token) {
      // Fetch classes from TeacherController
      fetch(`${API_CONFIG.BASE_URL}/teacher/my-classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch classes');
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            setClasses(data.classes);
            // If prefilled class is present but not yet selected, ensure it's set
            if (prefillClassId) {
              setSelectedClass(prefillClassId);
            }
          } else {
            throw new Error('Failed to fetch classes');
          }
        })
        .catch((error) => {
          console.error('Error fetching classes:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch classes",
          });
        });
    }
  }, [user, token]);

  useEffect(() => {
    if (selectedClass && user && user.role === 'teacher' && token) {
      // Fetch courses from TeacherController
      fetch(`${API_CONFIG.BASE_URL}/teacher/my-courses/by-class/${selectedClass}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch courses');
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            let nextCourses = data.courses || [];
            // If we have a prefilled course, ensure it's selected and present in options
            if (prefillCourseId) {
              const exists = nextCourses.some((c: Course) => c.id === prefillCourseId);
              if (!exists && selectedClass === prefillClassId && prefillCourseName) {
                nextCourses = [...nextCourses, { id: prefillCourseId, name: prefillCourseName } as Course];
              }
              setSelectedCourse(prefillCourseId);
            } else {
              setSelectedCourse(""); // Reset course selection when class changes
            }
            setCourses(nextCourses);
          } else {
            throw new Error('Failed to fetch courses');
          }
        })
        .catch((error) => {
          console.error('Error fetching courses:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch courses",
          });
        });
    }
  }, [selectedClass, user, token, prefillCourseId]);

  if (!user || user.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedCourse || !title) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill all required fields marked with *",
      });
      return;
    }

    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a file to upload",
      });
      return;
    }

    if (!token) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "No authentication token found. Please log in again.",
      });
      return;
    }

    const formData = new FormData();
    formData.append('classId', selectedClass);
    formData.append('courseId', selectedCourse);
    formData.append('title', title);
    formData.append('description', description || '');
    formData.append('file', file);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/learning-materials`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload material');
      }

      const data = await response.json();
      if (data.success) {
        console.log('Uploaded material:', data.material);
        toast({
          title: "Material uploaded successfully",
          description: `"${title}" has been uploaded for ${classes.find(c => c.id === selectedClass)?.name} - ${courses.find(c => c.id === selectedCourse)?.name}`,
        });

        // Reset form
        setSelectedClass("");
        setSelectedCourse("");
        setTitle("");
        setDescription("");
        setFile(null);
      } else {
        throw new Error('Failed to upload material');
      }
    } catch (error) {
      console.error('Error uploading material:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload material",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Upload Learning Materials</h1>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <BookOpen className="h-4 w-4" />
          View Materials
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Learning Material</CardTitle>
          <CardDescription>Upload documents, presentations, or other resources</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!!prefillClassId}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={!!prefillCourseId}>
                  <SelectTrigger id="course">
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

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="e.g., Chapter 5 Notes" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe what this material contains..." 
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input 
                  id="file" 
                  type="file" 
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Label 
                  htmlFor="file" 
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-10 w-10 text-gray-400" />
                  <span className="text-sm font-medium">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, DOC, PPT, XLS, ZIP (max. 50MB)
                  </span>
                </Label>
                {file && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
                    <FileType className="h-4 w-4" />
                    <span>File selected: {file.name}</span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" className="mr-2" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Material
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}