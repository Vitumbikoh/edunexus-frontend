import React, { useState, useEffect } from 'react';
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

interface ClassInfo {
  id: string;
  name: string;
  courses: string[];
}

const assessmentTypes = [
  { value: "midterm", label: "Mid-term Exam" },
  { value: "endterm", label: "End-term Exam" },
  { value: "quiz", label: "Quiz" },
  { value: "assignment", label: "Assignment" },
  { value: "practical", label: "Practical Exam" },
];

export default function SubmitGrades() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [assessmentType, setAssessmentType] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Fetch teacher's classes from backend
  useEffect(() => {
    if (user?.role === 'teacher') {
      const fetchClasses = async () => {
        try {
          setIsLoading(true);
          // Replace with actual API call
          // const response = await fetch('/api/teacher/classes');
          // const data = await response.json();
          
          // Mock data - replace with actual API call
          const mockClasses: ClassInfo[] = [
            { id: "1", name: "10A", courses: ["Mathematics", "Physics"] },
            { id: "2", name: "11B", courses: ["Mathematics", "Chemistry"] },
          ];
          setClasses(mockClasses);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error loading classes",
            description: "Could not fetch your classes. Please try again.",
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchClasses();
    }
  }, [user]);

  if (!user || user.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  const handleClassSelect = async (value: string) => {
    setSelectedClass(value);
    setSelectedCourse("");
    setAssessmentType("");
    setStudents([]);
    setGrades({});
    setFile(null);
    
    try {
      setIsLoading(true);
      // Replace with actual API call to fetch students for the selected class
      // const response = await fetch(`/api/class/${value}/students`);
      // const data = await response.json();
      
      // Mock data - replace with actual API call
      const mockStudents = [
        { id: "1", name: "John Doe", currentGrade: "" },
        { id: "2", name: "Jane Smith", currentGrade: "" },
        { id: "3", name: "Michael Johnson", currentGrade: "" },
      ];
      
      setStudents(mockStudents);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading students",
        description: "Could not fetch students for this class. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      
      // Here you would parse the Excel file and extract grades
      // For now, we'll just show a success message
      toast({
        title: "File uploaded successfully",
        description: `File "${uploadedFile.name}" is ready for processing.`,
      });
      
      // Mock parsing - replace with actual Excel parsing logic
      const mockParsedGrades = {
        "1": "A",
        "2": "B+",
        "3": "C"
      };
      setGrades(mockParsedGrades);
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

    if (!file) {
      toast({
        variant: "destructive",
        title: "No file uploaded",
        description: "Please upload an Excel file with grades.",
      });
      return;
    }

    try {
      setIsLoading(true);
      // Replace with actual API call to submit grades
      // const response = await fetch('/api/grades/submit', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     classId: selectedClass,
      //     course: selectedCourse,
      //     assessmentType,
      //     grades,
      //   }),
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // });
      
      // if (!response.ok) throw new Error('Submission failed');
      
      // Mock submission
      console.log("Submitting grades:", {
        class: selectedClass,
        course: selectedCourse,
        assessmentType,
        grades,
      });

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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "There was an error submitting grades. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedClassCourses = () => {
    const selected = classes.find(cls => cls.name === selectedClass);
    return selected?.courses || [];
  };

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
                onValueChange={handleClassSelect}
                disabled={isLoading}
              >
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>
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
                  {getSelectedClassCourses().map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
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
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    {file ? file.name : "Choose File"}
                  </Button>
                  <Input 
                    id="file-upload" 
                    type="file" 
                    accept=".xlsx,.xls" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </Label>
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
                        <TableCell>{student.id}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{grades[student.id] || "Not graded"}</TableCell>
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