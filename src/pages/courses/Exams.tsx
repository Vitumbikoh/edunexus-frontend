import React, { useState } from 'react';
import { Search, FileText, CheckCircle, Clock, Users, BookOpen, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Exam {
  id: string;
  title: string;
  subject: string;
  class: string;
  teacher: string;
  date: string;
  duration: string;
  totalMarks: number;
  status: 'upcoming' | 'administered' | 'graded';
  studentsEnrolled: number;
  studentsCompleted: number;
}

// Mock data for exams
const mockExams: Exam[] = [
  {
    id: '1',
    title: 'Mathematics Final Exam',
    subject: 'Mathematics',
    class: 'Grade 10',
    teacher: 'Dr. Smith',
    date: '2024-01-15',
    duration: '2 hours',
    totalMarks: 100,
    status: 'graded',
    studentsEnrolled: 28,
    studentsCompleted: 26
  },
  {
    id: '2',
    title: 'English Literature Assessment',
    subject: 'English',
    class: 'Grade 11',
    teacher: 'Ms. Johnson',
    date: '2024-01-20',
    duration: '1.5 hours',
    totalMarks: 80,
    status: 'administered',
    studentsEnrolled: 32,
    studentsCompleted: 30
  },
  {
    id: '3',
    title: 'Physics Mid-term',
    subject: 'Physics',
    class: 'Grade 12',
    teacher: 'Prof. Davis',
    date: '2024-01-25',
    duration: '2.5 hours',
    totalMarks: 120,
    status: 'upcoming',
    studentsEnrolled: 24,
    studentsCompleted: 0
  },
  {
    id: '4',
    title: 'Chemistry Lab Test',
    subject: 'Chemistry',
    class: 'Grade 11',
    teacher: 'Dr. Wilson',
    date: '2024-01-18',
    duration: '1 hour',
    totalMarks: 50,
    status: 'graded',
    studentsEnrolled: 30,
    studentsCompleted: 28
  },
  {
    id: '5',
    title: 'History Essay Exam',
    subject: 'History',
    class: 'Grade 10',
    teacher: 'Mr. Brown',
    date: '2024-01-22',
    duration: '2 hours',
    totalMarks: 90,
    status: 'administered',
    studentsEnrolled: 26,
    studentsCompleted: 24
  }
];

const classes = ['All Classes', 'Grade 10', 'Grade 11', 'Grade 12'];
const teachers = ['All Teachers', 'Dr. Smith', 'Ms. Johnson', 'Prof. Davis', 'Dr. Wilson', 'Mr. Brown'];

export default function Exams() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedTeacher, setSelectedTeacher] = useState('All Teachers');

  // Filter exams based on search and filters
  const filteredExams = mockExams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'All Classes' || exam.class === selectedClass;
    const matchesTeacher = selectedTeacher === 'All Teachers' || exam.teacher === selectedTeacher;
    
    return matchesSearch && matchesClass && matchesTeacher;
  });

  // Calculate statistics
  const totalExams = filteredExams.length;
  const administeredExams = filteredExams.filter(exam => exam.status === 'administered').length;
  const gradedExams = filteredExams.filter(exam => exam.status === 'graded').length;
  const upcomingExams = filteredExams.filter(exam => exam.status === 'upcoming').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Upcoming</Badge>;
      case 'administered':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Administered</Badge>;
      case 'graded':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Graded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedClass('All Classes');
    setSelectedTeacher('All Teachers');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Management</h1>
          <p className="text-muted-foreground">Manage and monitor all examinations</p>
        </div>
        <Button className="w-fit">
          <FileText className="mr-2 h-4 w-4" />
          Create New Exam
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalExams}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Administered</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{administeredExams}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Graded Exams</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{gradedExams}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Upcoming</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{upcomingExams}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filter Exams</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={resetFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exams List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled/Completed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No exams found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>{exam.class}</TableCell>
                      <TableCell>{exam.teacher}</TableCell>
                      <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                      <TableCell>{exam.duration}</TableCell>
                      <TableCell>{exam.totalMarks}</TableCell>
                      <TableCell>{getStatusBadge(exam.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {exam.studentsCompleted}/{exam.studentsEnrolled}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}