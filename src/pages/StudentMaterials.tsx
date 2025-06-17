
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, BookOpen, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Mock learning materials based on student Courses
const createLearningMaterials = (courses: string[]) => {
  const materials = [];
  
  for (const course of courses) {
    // Add 2-4 materials per course
    const numMaterials = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numMaterials; i++) {
      materials.push({
        id: `${course.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
        title: getMaterialTitle(course, i),
        course: course,
        type: i % 2 === 0 ? 'PDF' : i % 3 === 0 ? 'PPTX' : 'DOCX',
        uploadedOn: new Date(2025, 3, Math.floor(Math.random() * 15) + 1).toISOString(),
        size: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 9) + 1} MB`
      });
    }
  }
  
  return materials.sort((a, b) => new Date(b.uploadedOn).getTime() - new Date(a.uploadedOn).getTime());
};

// Helper function to generate material titles
const getMaterialTitle = (course: string, index: number) => {
  const titleMap: {[key: string]: string[]} = {
    'Mathematics': ['Algebra Notes', 'Calculus Formulas', 'Geometry Theorems', 'Statistics Handbook'],
    'Physics': ['Mechanics Lessons', 'Electricity and Magnetism', 'Optics Guide', 'Thermodynamics Review'],
    'English': ['Grammar Rules', 'Literature Analysis', 'Essay Writing Guide', 'Vocabulary List'],
    'History': ['World War II Overview', 'Ancient Civilizations', 'Industrial Revolution', 'Cold War Timeline'],
    'Computer Science': ['Programming Basics', 'Data Structures', 'Algorithms Guide', 'Web Development']
  };
  
  const titles = titleMap[course] || ['Chapter Notes', 'Study Guide', 'Practice Problems', 'Exam Review'];
  return titles[index % titles.length];
};

export default function StudentMaterials() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  
  if (!user || user.role !== 'student' || !user.studentData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  const allMaterials = createLearningMaterials(user.studentData.courses);
  
  const filteredMaterials = allMaterials.filter(material => {
    const matchesCourse = selectedCourse === "all" || material.course === selectedCourse;
    const matchesType = selectedType === "all" || material.type === selectedType;
    return matchesCourse && matchesType;
  });
  
  const handleDownload = (materialId: string, title: string) => {
    toast({
      title: "Material downloaded",
      description: `${title} has been downloaded to your device.`,
    });
  };
  
  const fileTypeIcons: {[key: string]: React.ReactNode} = {
    'PDF': <FileText className="h-4 w-4 text-red-500" />,
    'DOCX': <FileText className="h-4 w-4 text-blue-500" />,
    'PPTX': <FileText className="h-4 w-4 text-orange-500" />
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learning Materials</h1>
        <p className="text-muted-foreground">Access study materials for your courses</p>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Available Materials
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {user.studentData.courses.map(course => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="DOCX">DOCX</SelectItem>
                  <SelectItem value="PPTX">PPTX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {fileTypeIcons[material.type]}
                        {material.title}
                      </div>
                    </TableCell>
                    <TableCell>{material.course}</TableCell>
                    <TableCell>{material.type}</TableCell>
                    <TableCell>{formatDate(material.uploadedOn)}</TableCell>
                    <TableCell>{material.size}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownload(material.id, material.title)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No learning materials found for the selected filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
