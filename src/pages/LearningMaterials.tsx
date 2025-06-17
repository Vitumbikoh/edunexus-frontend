
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileType, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

export default function LearningMaterials() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  
  if (!user || user.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedClass || !selectedCourse || !title) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill all required fields marked with *",
      });
      return;
    }

    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a file to upload",
      });
      return;
    }

    console.log("Uploading material:", {
      class: selectedClass,
      course: selectedCourse,
      title,
      description,
      file: file.name,
    });

    toast({
      title: "Material uploaded successfully",
      description: `"${title}" has been uploaded for ${selectedClass} - ${selectedCourse}`,
    });

    // Reset form
    setSelectedClass("");
    setSelectedCourse("");
    setTitle("");
    setDescription("");
    setFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Upload Learning Materials</h1>
          <p className="text-muted-foreground">Share resources with your students</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <BookOpen className="h-4 w-4" />
          View Materials
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Learning Material</CardTitle>
          <CardDescription>Upload documents, presentations, or other resources</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class">
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
                <Label htmlFor="course">Course *</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger id="course">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {user.teacherData?.courses?.map((course) => (
                      <SelectItem key={course} value={course}>{course}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="e.g., Chapter 5 Notes" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe what this material contains..." 
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input 
                  id="file" 
                  type="file" 
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Label 
                  htmlFor="file" 
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-10 w-10 text-gray-400" />
                  <span className="text-sm font-medium">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, DOC, PPT, XLS, ZIP (max. 50MB)
                  </span>
                </Label>
                {file && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
                    <FileType className="h-4 w-4" />
                    <span>File selected: {file.name}</span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" className="mr-2" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Material
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
