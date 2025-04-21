
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

// Mock students data
const mockStudents = [
  { id: "1", name: "John Doe", grade: "10A", currentGrade: "" },
  { id: "3", name: "Michael Johnson", grade: "11B", currentGrade: "" },
  { id: "4", name: "Emily Davis", grade: "10A", currentGrade: "" },
  { id: "7", name: "David Miller", grade: "11B", currentGrade: "" },
];

export default function SubmitGrades() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [assessmentTitle, setAssessmentTitle] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  
  if (!user || user.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  const handleClassSelect = (value: string) => {
    setSelectedClass(value);
    // Filter students based on selected class
    const filteredStudents = mockStudents.filter(
      student => student.grade === value && 
      (user.teacherData?.students?.includes(student.id) || false)
    );
    setStudents(filteredStudents);
  };

  const handleGradeChange = (studentId: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleSubmitGrades = () => {
    if (!selectedClass || !selectedSubject || !assessmentTitle) {
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
        title: "No grades entered",
        description: "Please enter grades for at least one student.",
      });
      return;
    }

    console.log("Submitting grades:", {
      class: selectedClass,
      subject: selectedSubject,
      assessment: assessmentTitle,
      grades,
    });

    toast({
      title: "Grades submitted successfully",
      description: `Grades for "${assessmentTitle}" have been recorded.`,
    });

    // Reset form
    setSelectedClass("");
    setSelectedSubject("");
    setAssessmentTitle("");
    setStudents([]);
    setGrades({});
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
              <Select value={selectedClass} onValueChange={handleClassSelect}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {user.teacherData?.classes?.map((className) => (
                    <SelectItem key={className} value={className}>Class {className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {user.teacherData?.subjects?.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment Title *</Label>
              <Input 
                id="assessment" 
                placeholder="e.g., Midterm Exam" 
                value={assessmentTitle}
                onChange={(e) => setAssessmentTitle(e.target.value)}
              />
            </div>
          </div>

          {students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>
                      <Input 
                        placeholder="e.g., A, B, C or 1-100" 
                        value={grades[student.id] || ""}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                        className="max-w-[120px]"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            selectedClass ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found for this class or you don't teach any students in this class.
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please select a class to view students.
              </div>
            )
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmitGrades} 
            disabled={!selectedClass || !selectedSubject || !assessmentTitle || students.length === 0}
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
