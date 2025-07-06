
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award } from "lucide-react";

export default function StudentGrades() {
  const { user } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  
  if (!user || user.role !== 'student') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  // Use studentData if available, otherwise create fallback data
  const fallbackGrades = [
    { course: 'Mathematics', grade: 'A-', term: 'Midterm' },
    { course: 'Physics', grade: 'B+', term: 'Midterm' },
    { course: 'Chemistry', grade: 'A', term: 'Midterm' },
    { course: 'English', grade: 'B+', term: 'Final' },
    { course: 'History', grade: 'B', term: 'Final' },
    { course: 'Computer Science', grade: 'A+', term: 'Final' },
  ];
  
  const fallbackCourses = ['Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Computer Science'];
  
  const grades = user.studentData?.grades || fallbackGrades;
  const courses = user.studentData?.courses || fallbackCourses;
  
  const terms = ["Midterm", "Final"];
  const filteredGrades = selectedTerm === "all" 
    ? grades 
    : grades.filter(grade => grade.term === selectedTerm);
  
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return "text-green-600";
    if (grade.startsWith('B')) return "text-blue-600";
    if (grade.startsWith('C')) return "text-yellow-600";
    if (grade.startsWith('D')) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Grades</h1>
        <p className="text-muted-foreground">View your academic performance</p>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5" />
              Grade Report
            </CardTitle>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms.map(term => (
                  <SelectItem key={term} value={term}>{term}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGrades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead className="text-right">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((grade, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{grade.course}</TableCell>
                    <TableCell>{grade.term}</TableCell>
                    <TableCell className={`text-right font-bold ${getGradeColor(grade.grade)}`}>
                      {grade.grade}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No grades found for the selected term.
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Overview of your academic performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-6 text-center border border-blue-100">
              <h3 className="text-lg font-medium text-blue-800">Total Courses</h3>
              <p className="text-3xl font-bold text-blue-700 mt-2">{courses.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-6 text-center border border-green-100">
              <h3 className="text-lg font-medium text-green-800">Class Average</h3>
              <p className="text-3xl font-bold text-green-700 mt-2">A-</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 text-center border border-purple-100">
              <h3 className="text-lg font-medium text-purple-800">Rank</h3>
              <p className="text-3xl font-bold text-purple-700 mt-2">3 / 35</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
