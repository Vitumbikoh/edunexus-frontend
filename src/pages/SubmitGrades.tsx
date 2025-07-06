import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, BookOpen, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface ClassInfo {
  id: string;
  name: string;
}

interface CourseInfo {
  id: string;
  name: string;
}

interface StudentInfo {
  id: string;
  studentId: string;
  name: string;
}

const assessmentTypes = [
  { value: "midterm", label: "Mid-term Exam" },
  { value: "endterm", label: "End-term Exam" },
  { value: "quiz", label: "Quiz" },
  { value: "assignment", label: "Assignment" },
  { value: "practical", label: "Practical Exam" },
];

export default function SubmitGrades() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [assessmentType, setAssessmentType] = useState<string>("");
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const fetchCourses = async (classId: string) => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const fetchStudents = async (courseId: string) => {
    try {
      setIsLoading(true);
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
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
        }))
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'teacher') {
      fetchClasses();
    }
  }, [user, token]);

  useEffect(() => {
    if (selectedClass) {
      fetchCourses(selectedClass);
    } else {
      setCourses([]);
      setSelectedCourse('');
      setStudents([]);
      setGrades({});
      setFile(null);
    }
  }, [selectedClass, token]);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse);
    } else {
      setStudents([]);
      setGrades({});
      setFile(null);
    }
  }, [selectedCourse, token]);

 const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files?.[0]) return;

  const uploadedFile = e.target.files[0];
  setFile(uploadedFile);

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // 1. Get first sheet (simplified since we know the structure)
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // 2. Convert to array of objects with original headers
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      console.log('Raw parsed data:', jsonData); // Critical for debugging

      if (!jsonData || jsonData.length === 0) {
        throw new Error('File is empty or contains no data');
      }

      // 3. Find studentId and grade columns (case insensitive)
      const firstRow = jsonData[0];
      const studentIdKey = Object.keys(firstRow).find(
        key => key.toLowerCase().replace(/\s/g, '') === 'studentid'
      );
      const gradeKey = Object.keys(firstRow).find(
        key => key.toLowerCase().replace(/\s/g, '') === 'grade'
      );

      if (!studentIdKey || !gradeKey) {
        throw new Error(
          `Required columns not found. Found: ${Object.keys(firstRow).join(', ')}. ` +
          `Looking for 'studentId' and 'grade' (case insensitive)`
        );
      }

      // 4. Process all rows
      const parsedGrades: Record<string, string> = {};
      let validCount = 0;
      let invalidCount = 0;
      const missingStudents: string[] = [];

      jsonData.forEach((row: any) => {
        try {
          const studentId = String(row[studentIdKey]).trim();
          let grade = row[gradeKey];
          
          // Convert grade to string, handling numbers
          grade = typeof grade === 'number' ? grade.toString() : String(grade).trim();

          // Validate required fields
          if (!studentId || !grade) {
            invalidCount++;
            return;
          }

          // Check student exists
          const studentExists = students.some(s => s.studentId === studentId);
          if (!studentExists) {
            missingStudents.push(studentId);
            invalidCount++;
            return;
          }

          // Validate grade format (0-100 or 0.0-1.0)
          const gradeNum = parseFloat(grade);
          if (isNaN(gradeNum) || (gradeNum < 0 || gradeNum > 100 && (gradeNum < 0 || gradeNum > 1))) {
            invalidCount++;
            return;
          }

          // Store valid grade
          parsedGrades[studentId] = grade;
          validCount++;
          
        } catch (err) {
          console.error('Error processing row:', row, err);
          invalidCount++;
        }
      });

      // 5. Final validation
      if (validCount === 0) {
        let errorMsg = 'No valid grades found. Reasons:\n';
        if (missingStudents.length > 0) {
          errorMsg += `- ${missingStudents.length} student IDs not found in class (e.g. ${missingStudents.slice(0, 3).join(', ')}${missingStudents.length > 3 ? '...' : ''}\n`;
        }
        if (invalidCount > 0) {
          errorMsg += `- ${invalidCount} rows had invalid data\n`;
        }
        throw new Error(errorMsg);
      }

      setGrades(parsedGrades);
      toast({
        title: "Success!",
        description: `Loaded grades for ${validCount} students${invalidCount > 0 ? ` (${invalidCount} issues detected)` : ''}`,
      });

    } catch (err) {
      console.error('Full error details:', err);
      toast({
        variant: "destructive",
        title: "Cannot process file",
        description: err instanceof Error ? err.message : 'Invalid file format',
      });
      setFile(null);
      setGrades({});
    }
  };
  
  reader.onerror = () => {
    toast({
      variant: "destructive",
      title: "File read error",
      description: "Could not read the file. Please try again.",
    });
    setFile(null);
    setGrades({});
  };
  
  reader.readAsArrayBuffer(uploadedFile);
};
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmitGrades = async () => {
    if (!selectedClass || !selectedCourse || !assessmentType) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill all required fields marked with *",
      });
      return;
    }

    if (!file || Object.keys(grades).length === 0) {
      toast({
        variant: "destructive",
        title: "No grades provided",
        description: "Please upload an Excel file with valid grades.",
      });
      return;
    }

    const payload = {
      classId: selectedClass,
      courseId: selectedCourse,
      assessmentType,
      grades,
    };

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/v1/grades', {
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
        throw new Error(errorData.message || 'Failed to submit grades');
      }

      const data = await response.json();
      toast({
        title: "Grades submitted successfully",
        description: `Grades for ${assessmentTypes.find(a => a.value === assessmentType)?.label} have been recorded.`,
      });

      // Reset form
      setSelectedClass("");
      setSelectedCourse("");
      setAssessmentType("");
      setStudents([]);
      setGrades({});
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit grades';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Submit Grades</h1>
          <p className="text-muted-foreground">Record student assessment results</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="h-6 bg-gray-200 animate-pulse rounded"></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
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
          <h1 className="text-2xl font-bold">Submit Grades</h1>
          <p className="text-muted-foreground">Record student assessment results</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <BookOpen className="h-4 w-4" />
          View Gradebook
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grade Entry</CardTitle>
          <CardDescription>Enter assessment results for your students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
                disabled={isLoading}
              >
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      Class {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Select 
                value={selectedCourse} 
                onValueChange={setSelectedCourse}
                disabled={!selectedClass || isLoading}
              >
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
            
            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment Type *</Label>
              <Select
                value={assessmentType}
                onValueChange={setAssessmentType}
                disabled={!selectedCourse || isLoading}
              >
                <SelectTrigger id="assessment">
                  <SelectValue placeholder="Select assessment type" />
                </SelectTrigger>
                <SelectContent>
                  {assessmentTypes.map((assessment) => (
                    <SelectItem key={assessment.value} value={assessment.value}>
                      {assessment.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedClass && selectedCourse && assessmentType && (
            <div className="mb-6">
              <Label>Upload Grades (Excel File)</Label>
              <div className="flex items-center gap-4 mt-2">
                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={handleFileButtonClick}
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4" />
                  {file ? file.name : "Choose File"}
                </Button>
                <Input 
                  id="file-upload" 
                  type="file" 
                  accept=".xlsx,.xls" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
                {file && (
                  <span className="text-sm text-muted-foreground">
                    File ready for submission
                  </span>
                )}
              </div>
            </div>
          )}

          {students.length > 0 && Object.keys(grades).length > 0 && (
            <div>
              <h3 className="font-medium mb-4">Grade Preview</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{grades[student.studentId] || "Not graded"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmitGrades} 
            disabled={!selectedClass || !selectedCourse || !assessmentType || !file || isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Submit Grades
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}