
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";

// Mock teachers for assignment
const teachers = [
  { id: "1", name: "Dr. Amanda Lewis" },
  { id: "2", name: "Prof. Richard Thomas" },
  { id: "3", name: "Mrs. Elizabeth Chen" },
  { id: "4", name: "Mr. James Wilson" },
  { id: "5", name: "Dr. Maria Rodriguez" },
  { id: "6", name: "Mr. Robert Johnson" },
  { id: "7", name: "Mrs. Sarah Davis" },
];

export default function SubjectForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Check permissions
  const canAddSubject = user?.role === "admin";
  
  if (!canAddSubject) {
    navigate('/subjects');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      
      toast({
        title: "Subject Added",
        description: "New subject has been successfully added.",
      });
      
      // Navigate back to subjects list
      navigate('/subjects');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/subjects')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Subjects
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Subject</h1>
          <p className="text-muted-foreground">Create a new subject for the curriculum</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Subject Information</CardTitle>
            <CardDescription>
              Enter the details for the new subject.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input id="subjectName" placeholder="e.g., Advanced Mathematics" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectCode">Subject Code</Label>
              <Input id="subjectCode" placeholder="e.g., MATH101" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select required>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Physical Education">Physical Education</SelectItem>
                    <SelectItem value="Arts">Arts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditHours">Credit Hours</Label>
                <Input id="creditHours" type="number" min="1" max="6" placeholder="e.g., 3" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="assignedTeacher">Assigned Teacher</Label>
                <Select required>
                  <SelectTrigger id="assignedTeacher">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="classLevel">Class Level</Label>
                <Select required>
                  <SelectTrigger id="classLevel">
                    <SelectValue placeholder="Select class level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Brief description of the subject contents and learning objectives..." 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prerequisites">Prerequisites (Optional)</Label>
              <Input id="prerequisites" placeholder="e.g., Basic Mathematics, Algebra" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Subject"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
