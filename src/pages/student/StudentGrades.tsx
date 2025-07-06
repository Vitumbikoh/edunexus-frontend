import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function StudentGrades() {
  const { user, token } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.role !== 'student') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('http://localhost:5000/api/v1/grades/students', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch grades');
        }

        const data = await response.json();
        if (!data.success || !data.grades) {
          throw new Error('No grades data available');
        }

        // Transform backend data to match the expected structure
        const transformedGrades = data.grades.map(grade => ({
          course: grade.course.name || grade.course,
          grade: grade.grade,
          term: grade.assessmentType === 'midterm' ? 'Midterm' : 'Final', // Map assessmentType to term
        }));
        const uniqueCourses = [...new Set(transformedGrades.map(g => g.course))];

        setGrades(transformedGrades);
        setCourses(uniqueCourses);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load grades';
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

    fetchGrades();
  }, [token]);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Grades</h1>
          <p className="text-muted-foreground">View your academic performance</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="h-6 bg-gray-200 animate-pulse rounded"></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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