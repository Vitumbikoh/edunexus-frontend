
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data
const subjects = [
  { 
    id: "1", 
    name: "Mathematics", 
    teachers: ["Dr. Amanda Lewis", "Mr. John Smith"],
    grades: ["9", "10", "11"],
    description: "Algebra, Geometry, Calculus, and more."
  },
  { 
    id: "2", 
    name: "Science", 
    teachers: ["Prof. Richard Thomas", "Dr. Emily Chen"],
    grades: ["9", "10", "11", "12"],
    description: "Physics, Chemistry, Biology, and Environmental Science."
  },
  { 
    id: "3", 
    name: "English Literature", 
    teachers: ["Mrs. Elizabeth Chen", "Dr. Robert Johnson"],
    grades: ["9", "10", "11", "12"],
    description: "Classic literature, writing skills, and analysis."
  },
  { 
    id: "4", 
    name: "History", 
    teachers: ["Mr. James Wilson"],
    grades: ["10", "11"],
    description: "World history, local history, and social studies."
  },
  { 
    id: "5", 
    name: "Computer Science", 
    teachers: ["Dr. Maria Rodriguez"],
    grades: ["11", "12"],
    description: "Programming, algorithms, and computer systems."
  },
  { 
    id: "6", 
    name: "Physical Education", 
    teachers: ["Mr. Robert Johnson"],
    grades: ["9", "10", "11", "12"],
    description: "Team sports, fitness, and health education."
  },
];

export default function Subjects() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-muted-foreground">Manage all subjects and courses</p>
        </div>
        <Button>Add New Subject</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Card key={subject.id}>
            <CardHeader>
              <CardTitle>{subject.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Teachers</h4>
                  <div className="flex flex-wrap gap-2">
                    {subject.teachers.map((teacher, idx) => (
                      <Badge key={idx} variant="outline">{teacher}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Grades</h4>
                  <div className="flex flex-wrap gap-2">
                    {subject.grades.map((grade) => (
                      <Badge key={grade} variant="secondary">Grade {grade}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm">{subject.description}</p>
                </div>
                
                <div className="pt-2 flex justify-end">
                  <Button variant="outline" size="sm" className="mr-2">Edit</Button>
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
