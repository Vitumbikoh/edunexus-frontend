
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, BookOpen, FileText } from "lucide-react";
import { useNavigate } from 'react-router-dom';

// Mock data - filtered for teacher
const teacherSubjects = [
  { 
    id: "1", 
    name: "Mathematics", 
    classes: ["10A"],
    description: "Algebra, Geometry, Calculus, and more.",
    materials: 12,
    students: 25
  },
  { 
    id: "3", 
    name: "Physics", 
    classes: ["11B"],
    description: "Physics principles, mechanics, electricity and magnetism.",
    materials: 8,
    students: 18
  }
];

export default function TeacherSubjects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (!user || user.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Subjects</h1>
        <p className="text-muted-foreground">Manage your teaching subjects</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teacherSubjects.map((subject) => (
          <Card key={subject.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                {subject.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Classes</h4>
                  <div className="flex flex-wrap gap-2">
                    {subject.classes.map((className) => (
                      <Badge key={className} variant="secondary">Class {className}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm">{subject.description}</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="bg-muted rounded-md px-3 py-2 text-sm">
                    <span className="font-medium text-muted-foreground">Materials:</span> {subject.materials}
                  </div>
                  <div className="bg-muted rounded-md px-3 py-2 text-sm">
                    <span className="font-medium text-muted-foreground">Students:</span> {subject.students}
                  </div>
                </div>
                
                <div className="pt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/learning-materials')}>
                    <Upload className="h-4 w-4" />
                    Upload Materials
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/submit-grades')}>
                    <FileText className="h-4 w-4" />
                    Grade Students
                  </Button>
                  <Button variant="default" size="sm">View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
