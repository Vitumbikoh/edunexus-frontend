
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users } from "lucide-react";

// Mock students with performance data
const allStudents = [
  { id: "1", name: "John Doe", grade: "10A", attendance: "95%", performance: "A" },
  { id: "2", name: "Jane Smith", grade: "9B", attendance: "98%", performance: "A+" },
  { id: "3", name: "Michael Johnson", grade: "11B", attendance: "90%", performance: "B+" },
  { id: "4", name: "Emily Davis", grade: "10A", attendance: "92%", performance: "A-" },
  { id: "5", name: "Robert Wilson", grade: "9B", attendance: "85%", performance: "B" },
  { id: "6", name: "Sarah Brown", grade: "11C", attendance: "93%", performance: "A" },
  { id: "7", name: "David Miller", grade: "11B", attendance: "88%", performance: "B+" },
  { id: "8", name: "Jessica Anderson", grade: "9B", attendance: "97%", performance: "A+" },
];

export default function TeacherStudents() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  
  if (!user || user.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  // Filter students based on teacher data
  const teacherStudentIds = user.teacherData?.students || [];
  const teacherClasses = user.teacherData?.classes || [];
  
  let filteredStudents = allStudents.filter(student => 
    teacherStudentIds.includes(student.id) &&
    (!selectedClass || student.grade === selectedClass)
  );
  
  if (searchQuery) {
    filteredStudents = filteredStudents.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Students</h1>
        <p className="text-muted-foreground">View and manage your students</p>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Student List
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8 w-full md:w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_classes">All Classes</SelectItem>
                  {teacherClasses.map(className => (
                    <SelectItem key={className} value={className}>{className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.attendance}</TableCell>
                    <TableCell>{student.performance}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No students found matching your search." : "You don't have any students assigned."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
