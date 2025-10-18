import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, BookOpen, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { API_CONFIG } from '@/config/api';
import { PagePreloader } from "@/components/ui/preloader";

export default function StudentMaterials() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  // Get courseId from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const courseIdFromUrl = urlParams.get('courseId');
  
  const [selectedCourse, setSelectedCourse] = useState(courseIdFromUrl || "all");
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);


  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }
        if (!user.id) {
          throw new Error("User ID not found. Please log in again.");
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/student/${user.id}/courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          throw new Error("Session expired. Please log in again.");
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch courses");
        }

        const result = await response.json();
        if (result.success) {
          const allCourses = [
            ...result.courses.active,
            ...result.courses.upcoming,
            ...result.courses.completed,
          ];
          setCourses(allCourses);
        } else {
          throw new Error("Failed to fetch courses");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch courses";
        setApiError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    const fetchMaterials = async () => {
      try {
        setLoading(true);
        setApiError(null);

        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }
        if (!user.id) {
          throw new Error("User ID not found. Please log in again.");
        }

        const url = selectedCourse === "all"
          ? `${API_CONFIG.BASE_URL}/student/${user.id}/materials`
          : `${API_CONFIG.BASE_URL}/student/${user.id}/materials?courseId=${selectedCourse}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          throw new Error("Session expired. Please log in again.");
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch materials");
        }

        const result = await response.json();
        if (result.success) {
          setMaterials(result.materials);
        } else {
          throw new Error("Failed to fetch materials");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch materials";
        setApiError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
    fetchMaterials();
  }, [user.id, token, selectedCourse, navigate, toast]);

  const filteredMaterials = materials.filter((material: any) =>
    selectedType === "all" || material.type === selectedType
  );

  const handleDownload = async (material: { id: string; title: string; filePath: string; type: string }) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api/v1', '')}${material.filePath}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${material.title}.${material.type.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Material downloaded",
        description: `${material.title} has been downloaded to your device.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download material",
        variant: "destructive",
      });
    }
  };

  const fileTypeIcons = {
    'PDF': <FileText className="h-4 w-4 text-red-500" />,
    'DOCX': <FileText className="h-4 w-4 text-blue-500" />,
    'PPTX': <FileText className="h-4 w-4 text-orange-500" />,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <PagePreloader text="Loading materials..." />;
  }

  if (apiError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {apiError}
        </div>
      </div>
    );
  }

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
                  {courses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
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
                {filteredMaterials.map((material: any) => (
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
                        onClick={() => handleDownload(material)}
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