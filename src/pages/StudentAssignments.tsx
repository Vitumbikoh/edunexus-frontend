
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Upload } from "lucide-react";
import { format } from 'date-fns';
import { toast } from "@/hooks/use-toast";

export default function StudentAssignments() {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  
  if (!user || user.role !== 'student' || !user.studentData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  const { assignments } = user.studentData;
  
  const filteredAssignments = selectedSubject === "all" 
    ? assignments 
    : assignments.filter(assignment => assignment.subject === selectedSubject);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Submitted</Badge>;
      case 'graded':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Graded</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const handleDownload = (assignmentId: string, title: string) => {
    toast({
      title: "Assignment downloaded",
      description: `${title} has been downloaded to your device.`,
    });
  };
  
  const handleSubmit = (assignmentId: string, title: string) => {
    toast({
      title: "Assignment submitted",
      description: `${title} has been successfully submitted.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground">View and manage your assignments</p>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Assignment List
            </CardTitle>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {user.studentData.subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{assignment.subject}</TableCell>
                    <TableCell>{format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDownload(assignment.id, assignment.title)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        {assignment.status === 'pending' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleSubmit(assignment.id, assignment.title)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No assignments found for the selected subject.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
