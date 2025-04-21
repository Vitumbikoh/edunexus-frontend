
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

// Mock students data
const mockStudents = [
  { id: "1", name: "John Doe", grade: "10A", attendance: [] },
  { id: "3", name: "Michael Johnson", grade: "11B", attendance: [] },
  { id: "4", name: "Emily Davis", grade: "10A", attendance: [] },
  { id: "7", name: "David Miller", grade: "11B", attendance: [] },
];

export default function TeacherAttendance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});
  
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

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: isPresent,
    }));
  };

  const handleSubmitAttendance = () => {
    if (!selectedClass || !selectedSubject) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select both class and subject before submitting attendance.",
      });
      return;
    }

    if (Object.keys(attendanceStatus).length === 0) {
      toast({
        variant: "destructive",
        title: "No attendance marked",
        description: "Please mark attendance for at least one student.",
      });
      return;
    }

    console.log("Submitting attendance:", { 
      class: selectedClass, 
      subject: selectedSubject, 
      date: new Date().toISOString(),
      attendanceStatus 
    });

    toast({
      title: "Attendance submitted successfully",
      description: `Attendance for ${selectedClass} - ${selectedSubject} has been recorded.`,
    });

    // Reset form
    setSelectedClass("");
    setSelectedSubject("");
    setStudents([]);
    setAttendanceStatus({});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Take Attendance</h1>
          <p className="text-muted-foreground">Record student attendance for your classes</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <Calendar className="h-4 w-4" />
          Back to Schedule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Sheet</CardTitle>
          <CardDescription>Select class and subject to take attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={handleClassSelect}>
                <SelectTrigger>
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
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {user.teacherData?.subjects?.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          id={`present-${student.id}`}
                          checked={attendanceStatus[student.id] === true}
                          onCheckedChange={() => handleAttendanceChange(student.id, true)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          id={`absent-${student.id}`}
                          checked={attendanceStatus[student.id] === false}
                          onCheckedChange={() => handleAttendanceChange(student.id, false)}
                        />
                      </div>
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
            onClick={handleSubmitAttendance} 
            disabled={!selectedClass || !selectedSubject || students.length === 0}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Submit Attendance
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
