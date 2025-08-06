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
  const [examTitle, setExamTitle] = useState<string>("");
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [academicYear] = useState<string>("2024-2025");
  const [term] = useState<string>("First Term");

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

      const fetchedStudents = data.students.map((student: any) => ({
        id: student.id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
      }));

      console.log('Fetched students:', fetchedStudents);
      setStudents(fetchedStudents);

      // Initialize grades with 0 for each student
      const initialGrades = fetchedStudents.reduce((acc: Record<string, number>, student: StudentInfo) => {
        acc[student.studentId] = 0;
        return acc;
      }, {});
      setGrades(initialGrades);
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
      setExamTitle('');
    }
  }, [selectedClass, token]);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse);
    } else {
      setStudents([]);
      setGrades({});
      setFile(null);
      setExamTitle('');
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

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet);
        console.log('Parsed Excel data:', jsonData);

        if (!jsonData || jsonData.length === 0) {
          throw new Error('File is empty or contains no data');
        }

        const firstRow = jsonData[0];
        const studentIdKey = Object.keys(firstRow).find(
          key => key.toLowerCase().replace(/\s/g, '') === 'studentid'
        );
        const gradeKey = Object.keys(firstRow).find(
          key => key.toLowerCase().replace(/\s/g, '') === 'grade' || key.toLowerCase().replace(/\s/g, '') === 'marksobtained'
        );

        if (!studentIdKey || !gradeKey) {
          throw new Error(
            `Required columns not found. Found: ${Object.keys(firstRow).join(', ')}. ` +
            `Expected: studentId, grade or marksObtained (case insensitive)`
          );
        }

        const parsedGrades: Record<string, number> = {};
        let validCount = 0;
        let invalidCount = 0;
        const missingStudents: string[] = [];
        const invalidGrades: string[] = [];

        jsonData.forEach((row: any, index: number) => {
          try {
            const studentId = String(row[studentIdKey]).trim();
            let marks = row[gradeKey];

            marks = typeof marks === 'string' ? parseFloat(marks.replace('%', '')) : Number(marks);

            if (!studentId || isNaN(marks)) {
              console.warn(`Invalid data in row ${index + 2}: studentId=${studentId}, marks=${marks}`);
              invalidCount++;
              return;
            }

            const studentExists = students.some(s => s.studentId === studentId);
            if (!studentExists) {
              missingStudents.push(studentId);
              invalidCount++;
              return;
            }

            if (marks < 0 || marks > totalMarks) {
              invalidGrades.push(`Row ${index + 2}: ${marks} (must be 0-${totalMarks})`);
              invalidCount++;
              return;
            }

            parsedGrades[studentId] = marks;
            validCount++;
          } catch (err) {
            console.error(`Error processing row ${index + 2}:`, row, err);
            invalidCount++;
          }
        });

        if (validCount === 0) {
          let errorMsg = 'No valid grades found. Reasons:\n';
          if (missingStudents.length > 0) {
            errorMsg += `- ${missingStudents.length} student IDs not found in class (e.g. ${missingStudents.slice(0, 3).join(', ')}${missingStudents.length > 3 ? '...' : ''})\n`;
          }
          if (invalidGrades.length > 0) {
            errorMsg += `- ${invalidGrades.length} invalid grades (e.g. ${invalidGrades.slice(0, 3).join(', ')}${invalidGrades.length > 3 ? '...' : ''})\n`;
          }
          throw new Error(errorMsg);
        }

        setGrades({ ...grades, ...parsedGrades });
        console.log('Parsed grades:', parsedGrades);
        toast({
          title: "Success",
          description: `Loaded grades for ${validCount} students${invalidCount > 0 ? ` (${invalidCount} issues detected)` : ''}`,
        });
      } catch (err) {
        console.error('File processing error:', err);
        toast({
          variant: "destructive",
          title: "Cannot process file",
          description: err instanceof Error ? err.message : 'Invalid file format',
        });
        setFile(null);
        setGrades({ ...grades });
      }
    };

    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "File read error",
        description: "Could not read the file. Please try again.",
      });
      setFile(null);
      setGrades({ ...grades });
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGradeChange = (studentId: string, value: string) => {
    const marks = parseFloat(value);
    if (isNaN(marks) || marks < 0 || marks > totalMarks) {
      toast({
        variant: "destructive",
        title: "Invalid grade",
        description: `Marks for ${studentId} must be between 0 and ${totalMarks}`,
      });
      return;
    }
    setGrades(prev => ({ ...prev, [studentId]: marks }));
  };

  const handleSubmitGrades = async () => {
    if (!selectedClass || !selectedCourse || !assessmentType || !examTitle) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill all required fields marked with *",
      });
      return;
    }

    if (Object.keys(grades).length === 0) {
      toast({
        variant: "destructive",
        title: "No grades provided",
        description: "Please upload an Excel file or enter grades manually.",
      });
      return;
    }

    const payload = {
      classId: selectedClass,
      courseId: selectedCourse,
      assessmentType,
      examTitle,
      totalMarks,
      academicYear,
      term,
      grades,
    };

    console.log('Submitting grades payload:', payload);

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

      toast({
        title: "Grades submitted successfully",
        description: `Grades for ${examTitle} have been recorded.`,
      });

      setSelectedClass("");
      setSelectedCourse("");
      setAssessmentType("");
      setExamTitle("");
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

            <div className="space-y-2">
              <Label htmlFor="examTitle">Exam Title *</Label>
              <Input
                id="examTitle"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="Enter exam title (e.g., Introduction To Physical Science)"
                disabled={!selectedCourse || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks *</Label>
              <Input
                id="totalMarks"
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseInt(e.target.value) || 100)}
                placeholder="Enter total marks"
                disabled={!selectedCourse || isLoading}
              />
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

          {students.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-4">Manual Grade Entry (Optional)</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Marks Obtained</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={grades[student.studentId] || ''}
                            onChange={(e) => handleGradeChange(student.studentId, e.target.value)}
                            placeholder="Enter marks"
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                      <TableHead>Marks Obtained</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{grades[student.studentId] !== undefined ? grades[student.studentId] : "Not graded"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 space-y-2">
                <p><strong>Exam Title:</strong> {examTitle || "Not set"}</p>
                <p><strong>Total Marks:</strong> {totalMarks}</p>
                <p><strong>Academic Year:</strong> {academicYear}</p>
                <p><strong>Term:</strong> {term}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmitGrades} 
            disabled={!selectedClass || !selectedCourse || !assessmentType || !examTitle || Object.keys(grades).length === 0 || isLoading}
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