import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, BookOpen, Upload, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { API_CONFIG } from '@/config/api';
import { Preloader } from '@/components/ui/preloader';

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

interface ExamInfo {
  id: string;
  title: string;
  examType: string;
  totalMarks: number;
  date: string;
  status: string;
  description?: string;
}

export default function SubmitGrades() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as any;
  const params = new URLSearchParams(location.search);
  const courseIdFromQuery = params.get('courseId');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [availableExams, setAvailableExams] = useState<ExamInfo[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [grades, setGrades] = useState<Record<string, number>>({});
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/teacher/my-classes`, {
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
      setIsLoading(false);
    }
  };

  const fetchStudents = async (courseId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_CONFIG.BASE_URL}/teacher/my-students/by-course/${courseId}`, {
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

  const fetchExamsForGrading = async (courseId: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching exams for grading with courseId:', courseId);
      console.log('Current user (teacher):', user);
      
      // First, let's also check what regular exams exist for comparison
      try {
        const regularExamsResponse = await fetch(
          `${API_CONFIG.BASE_URL}/exams?courseId=${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (regularExamsResponse.ok) {
          const regularExamsData = await regularExamsResponse.json();
          console.log('Regular exams API response for comparison:', regularExamsData);
        }
      } catch (debugError) {
        console.log('Could not fetch regular exams for comparison:', debugError);
      }
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/teacher/exams-for-grading?courseId=${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Exams for grading API response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }

      const data = await response.json();
      console.log('Exams for grading API response data:', data);
      
      if (!data.success) {
        throw new Error('Failed to fetch exams');
      }

      setAvailableExams(data.exams);
      
      if (data.exams.length === 0) {
        console.warn('No exams found for grading. This could be due to:');
        console.warn('1. Exam status (only administered/completed exams might be available for grading)');
        console.warn('2. Teacher permissions (teacher might not be assigned to exams for this course)');
        console.warn('3. Academic year filters (exams might be from different academic year)');
        
        toast({
          title: 'No Exams Available',
          description: 'No exams are currently available for grading for this course. This could be because exams haven\'t been administered yet or you don\'t have permission to grade them.',
          variant: 'default',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load exams';
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

  // Prefill class & course if provided via navigation state or query param
  useEffect(() => {
    const prefill = routeState?.prefill;
    if (prefill?.courseId) {
      // Set class first (triggers course fetch) then course
      if (prefill.classId) setSelectedClass(prefill.classId);
      // Delay setting course until classes fetched if class provided
      if (!prefill.classId) {
        setSelectedCourse(prefill.courseId);
      } else {
        // Poll for courses list to contain the course
        const interval = setInterval(() => {
          const found = courses.find(c => c.id === prefill.courseId);
          if (found) {
            setSelectedCourse(prefill.courseId);
            clearInterval(interval);
          }
        }, 200);
        setTimeout(() => clearInterval(interval), 4000);
      }
    } else if (courseIdFromQuery) {
      setSelectedCourse(courseIdFromQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeState, courseIdFromQuery, courses]);

  useEffect(() => {
    if (selectedClass) {
      fetchCourses(selectedClass);
    } else {
      setCourses([]);
      setSelectedCourse('');
      setStudents([]);
      setGrades({});
      setFile(null);
      setAvailableExams([]);
      setSelectedExam('');
    }
  }, [selectedClass, token]);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse);
      fetchExamsForGrading(selectedCourse);
    } else {
      setStudents([]);
      setGrades({});
      setFile(null);
      setAvailableExams([]);
      setSelectedExam('');
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

        const selectedExamData = availableExams.find(e => e.id === selectedExam);
        if (!selectedExamData) {
          throw new Error('Selected exam not found');
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

            if (marks < 0 || marks > selectedExamData.totalMarks) {
              invalidGrades.push(`Row ${index + 2}: ${marks} (must be 0-${selectedExamData.totalMarks})`);
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
    const selectedExamData = availableExams.find(e => e.id === selectedExam);
    if (!selectedExamData) return;

    const marks = parseFloat(value);
    if (isNaN(marks)) {
      return;
    }

    if (marks < 0 || marks > selectedExamData.totalMarks) {
      toast({
        variant: "destructive",
        title: "Invalid grade",
        description: `Marks for ${studentId} must be between 0 and ${selectedExamData.totalMarks}`,
      });
      return;
    }
    setGrades(prev => ({ ...prev, [studentId]: marks }));
  };

  const downloadTemplate = () => {
    if (!students || students.length === 0) {
      toast({
        variant: "destructive",
        title: "No students available",
        description: "Please select a class and exam first to generate template",
      });
      return;
    }

    const selectedExamData = availableExams.find(e => e.id === selectedExam);
    if (!selectedExamData) {
      toast({
        variant: "destructive",
        title: "No exam selected",
        description: "Please select an exam first",
      });
      return;
    }

    // Prepare data for Excel template
    const templateData = students.map((student) => ({
      "Student ID": student.studentId,
      "Name": student.name,
      "Marks Obtained": "" // Empty column for teacher to fill
    }));

    // Create main grades worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Grades");

    // Set column widths for better readability
    const colWidths = [
      { wch: 12 }, // Student ID
      { wch: 25 }, // Name
      { wch: 15 }  // Marks Obtained
    ];
    ws['!cols'] = colWidths;

    // Create instructions sheet
    const className = classes.find(c => c.id === selectedClass)?.name || 'Unknown';
    const courseName = courses.find(c => c.id === selectedCourse)?.name || 'Unknown';
    
    const instructions = [
      { "Instructions": "HOW TO USE THIS TEMPLATE:" },
      { "Instructions": "" },
      { "Instructions": "1. Enter marks in the 'Marks Obtained' column only" },
      { "Instructions": "2. Do NOT modify Student ID or Name columns" },
      { "Instructions": "3. Marks must be between 0 and " + selectedExamData.totalMarks },
      { "Instructions": "4. Save the file and upload it back to the system" },
      { "Instructions": "" },
      { "Instructions": "EXAM INFORMATION:" },
      { "Instructions": "Exam: " + selectedExamData.title },
      { "Instructions": "Type: " + selectedExamData.examType },
      { "Instructions": "Total Marks: " + selectedExamData.totalMarks },
      { "Instructions": "Class: " + className },
      { "Instructions": "Course: " + courseName },
      { "Instructions": "Date: " + new Date(selectedExamData.date).toLocaleDateString() },
      { "Instructions": "" },
      { "Instructions": "Total Students: " + students.length },
    ];
    
    const instructionWs = XLSX.utils.json_to_sheet(instructions);
    instructionWs['!cols'] = [{ wch: 50 }];
    XLSX.utils.book_append_sheet(wb, instructionWs, "Instructions");

    // Generate filename with exam and class info
    const filename = `${selectedExamData.title}_${className}_${courseName}_Template.xlsx`
      .replace(/[^a-zA-Z0-9-_\.]/g, '_'); // Clean filename

    // Download the file
    XLSX.writeFile(wb, filename);
    
    toast({
      title: "Student file downloaded",
      description: `Excel file downloaded: ${filename}`,
    });
  };

  const handleSubmitGrades = async () => {
    if (!selectedExam || Object.keys(grades).length === 0) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select an exam and enter grades",
      });
      return;
    }

    // Filter out students without actual grades (only include students with valid marks)
    const filteredGrades: Record<string, number> = {};
    Object.entries(grades).forEach(([studentId, mark]) => {
      if (mark !== undefined && mark !== null && !isNaN(Number(mark))) {
        filteredGrades[studentId] = Number(mark);
      }
    });

    if (Object.keys(filteredGrades).length === 0) {
      toast({
        variant: "destructive",
        title: "No valid grades",
        description: "Please enter valid grades for at least one student",
      });
      return;
    }

    const payload = {
      examId: selectedExam,
      grades: filteredGrades,
    };

    console.log('Submitting grades payload:', payload);
    console.log(`Submitting grades for ${Object.keys(filteredGrades).length} students out of ${students.length} total students`);

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_CONFIG.BASE_URL}/teacher/submit-grades`, {
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

      const examTitle = availableExams.find(e => e.id === selectedExam)?.title || 'the exam';
      toast({
        title: "Grades submitted successfully",
        description: `Grades for ${Object.keys(filteredGrades).length} students have been recorded for ${examTitle}.`,
      });

      // Reset form
      setSelectedClass("");
      setSelectedCourse("");
      setSelectedExam("");
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
        <Preloader variant="skeleton" rows={5} className="space-y-6" />
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

  const selectedExamData = availableExams.find(e => e.id === selectedExam);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
          </div>

          {selectedCourse && (
            <div className="space-y-2 mb-6">
              <Label htmlFor="exam">Select Exam *</Label>
              <Select
                value={selectedExam}
                onValueChange={(value) => {
                  setSelectedExam(value);
                  const exam = availableExams.find(e => e.id === value);
                  if (exam) {
                    setGrades({}); // Reset grades when exam changes
                  }
                }}
                disabled={availableExams.length === 0 || isLoading}
              >
                <SelectTrigger id="exam">
                  <SelectValue placeholder={
                    availableExams.length === 0 ? "No exams available" : "Select an exam"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableExams.map((exam) => (
                    <SelectItem 
                      key={exam.id} 
                      value={exam.id}
                      disabled={exam.status === 'graded'}
                    >
                      {exam.title} ({exam.examType}) - {new Date(exam.date).toLocaleDateString()}
                      {exam.status === 'graded' && ' (Already Graded)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedExam && selectedExamData && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Assessment Type</Label>
                  <Input value={selectedExamData.examType} readOnly />
                </div>
                <div>
                  <Label>Exam Title</Label>
                  <Input value={selectedExamData.title} readOnly />
                </div>
                <div>
                  <Label>Total Marks</Label>
                  <Input value={selectedExamData.totalMarks} readOnly />
                </div>
              </div>
              {selectedExamData.description && (
                <div className="mt-4">
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedExamData.description}</p>
                </div>
              )}
            </div>
          )}

          {selectedExam && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label>Upload Grades (Excel File)</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2" 
                  onClick={downloadTemplate}
                  disabled={isLoading || students.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Download Student File ({students.length} students)
                </Button>
              </div>
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
              <p className="text-sm text-muted-foreground mt-2">
                Download student file with the exact {students.length} students shown below. Just add marks in the "Marks Obtained" column and upload back.
              </p>
            </div>
          )}

          {students.length > 0 && selectedExam && (
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
                            value={grades[student.studentId] ?? ''}
                            onChange={(e) => handleGradeChange(student.studentId, e.target.value)}
                            placeholder="Enter marks"
                            className="w-24"
                            min={0}
                            max={selectedExamData?.totalMarks}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {students.length > 0 && selectedExamData && (
            <div>
              <h3 className="font-medium mb-4">Grade Preview</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Marks Obtained</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const mark = grades[student.studentId];
                      const hasGrade = mark !== undefined && mark !== null;
                      const displayMark = hasGrade ? mark : 'not graded';
                      const percentage = hasGrade ? ((mark / selectedExamData.totalMarks) * 100).toFixed(1) + '%' : 'not graded';
                      return (
                        <TableRow key={student.id}>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{displayMark}</TableCell>
                          <TableCell>{percentage}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 space-y-2">
                <p><strong>Exam Title:</strong> {selectedExamData.title}</p>
                <p><strong>Assessment Type:</strong> {selectedExamData.examType}</p>
                <p><strong>Total Marks:</strong> {selectedExamData.totalMarks}</p>
                <p><strong>Exam Date:</strong> {new Date(selectedExamData.date).toLocaleDateString()}</p>
                <p><strong>Students to be graded:</strong> {Object.keys(grades).filter(studentId => grades[studentId] !== undefined && grades[studentId] !== null && !isNaN(Number(grades[studentId]))).length} out of {students.length}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmitGrades} 
            disabled={!selectedExam || isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Submit Grades {Object.keys(grades).filter(studentId => grades[studentId] !== undefined && grades[studentId] !== null && !isNaN(Number(grades[studentId]))).length > 0 && `(${Object.keys(grades).filter(studentId => grades[studentId] !== undefined && grades[studentId] !== null && !isNaN(Number(grades[studentId]))).length} students)`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}