
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from 'lucide-react';

// Mock data
const students = [
  { id: "1", name: "John Doe", grade: "10A", attendance: "95%", performance: "A" },
  { id: "2", name: "Jane Smith", grade: "9B", attendance: "98%", performance: "A+" },
  { id: "3", name: "Michael Johnson", grade: "11C", attendance: "90%", performance: "B+" },
  { id: "4", name: "Emily Davis", grade: "10A", attendance: "92%", performance: "A-" },
  { id: "5", name: "Robert Wilson", grade: "9B", attendance: "85%", performance: "B" },
  { id: "6", name: "Sarah Brown", grade: "11C", attendance: "93%", performance: "A" },
  { id: "7", name: "David Miller", grade: "10A", attendance: "88%", performance: "B+" },
  { id: "8", name: "Jessica Anderson", grade: "9B", attendance: "97%", performance: "A+" },
];

export default function Students() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage all students</p>
        </div>
        <Button>Add New Student</Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Students List</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students..."
                className="pl-8 w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>{student.attendance}</TableCell>
                  <TableCell>{student.performance}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
