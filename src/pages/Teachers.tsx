
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
const teachers = [
  { id: "1", name: "Dr. Amanda Lewis", department: "Mathematics", classes: "4", experience: "12 years" },
  { id: "2", name: "Prof. Richard Thomas", department: "Science", classes: "5", experience: "8 years" },
  { id: "3", name: "Mrs. Elizabeth Chen", department: "English", classes: "6", experience: "15 years" },
  { id: "4", name: "Mr. James Wilson", department: "History", classes: "3", experience: "5 years" },
  { id: "5", name: "Dr. Maria Rodriguez", department: "Computer Science", classes: "4", experience: "10 years" },
  { id: "6", name: "Mr. Robert Johnson", department: "Physical Education", classes: "8", experience: "7 years" },
  { id: "7", name: "Mrs. Sarah Davis", department: "Arts", classes: "5", experience: "9 years" },
];

export default function Teachers() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Teachers</h1>
          <p className="text-muted-foreground">Manage all teachers</p>
        </div>
        <Button>Add New Teacher</Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Teachers List</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search teachers..."
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
                <TableHead>Department</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.department}</TableCell>
                  <TableCell>{teacher.classes}</TableCell>
                  <TableCell>{teacher.experience}</TableCell>
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
