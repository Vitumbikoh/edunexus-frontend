import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Save, AlertCircle, GraduationCap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/services/apiClient";

interface GradeFormat {
  id: string;
  grade: string;
  description: string;
  minPercentage: number;
  maxPercentage: number;
  gpa: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GradeFormData {
  grade: string;
  description: string;
  minPercentage: number;
  maxPercentage: number;
  gpa: number;
}

const defaultGradeFormats: Omit<GradeFormat, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { grade: "A+", description: "Distinction", minPercentage: 90, maxPercentage: 100, gpa: 4.0, isActive: true },
  { grade: "A", description: "Excellent", minPercentage: 80, maxPercentage: 89, gpa: 3.7, isActive: true },
  { grade: "B+", description: "Very Good", minPercentage: 75, maxPercentage: 79, gpa: 3.3, isActive: true },
  { grade: "B", description: "Good", minPercentage: 70, maxPercentage: 74, gpa: 3.0, isActive: true },
  { grade: "C+", description: "Credit", minPercentage: 65, maxPercentage: 69, gpa: 2.7, isActive: true },
  { grade: "C", description: "Pass", minPercentage: 60, maxPercentage: 64, gpa: 2.3, isActive: true },
  { grade: "D+", description: "Marginal Pass", minPercentage: 55, maxPercentage: 59, gpa: 2.0, isActive: true },
  { grade: "D", description: "Poor Pass", minPercentage: 50, maxPercentage: 54, gpa: 1.7, isActive: true },
  { grade: "F", description: "Fail", minPercentage: 0, maxPercentage: 49, gpa: 0.0, isActive: true },
];

export default function GradingFormat() {
  const [gradeFormats, setGradeFormats] = useState<GradeFormat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeFormat | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<GradeFormData>({
    grade: "",
    description: "",
    minPercentage: 0,
    maxPercentage: 0,
    gpa: 0,
  });

  const fetchGradeFormats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/api/admin/grading-formats');
      
      if (response.data && Array.isArray(response.data)) {
        setGradeFormats(response.data);
      } else {
        // If no formats exist, use default formats
        setGradeFormats([]);
      }
    } catch (err: any) {
      console.error('Error fetching grade formats:', err);
      setError('Failed to load grading formats');
      // Use default formats as fallback
      setGradeFormats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultFormats = async () => {
    try {
      setIsSubmitting(true);
      const response = await apiClient.post('/api/admin/grading-formats/initialize', {
        formats: defaultGradeFormats
      });
      
      toast({
        title: "Success",
        description: "Default grading formats have been initialized",
      });
      
      await fetchGradeFormats();
    } catch (err: any) {
      console.error('Error initializing default formats:', err);
      toast({
        title: "Error",
        description: "Failed to initialize default grading formats",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchGradeFormats();
  }, []);

  const resetForm = () => {
    setFormData({
      grade: "",
      description: "",
      minPercentage: 0,
      maxPercentage: 0,
      gpa: 0,
    });
    setEditingGrade(null);
  };

  const handleEdit = (gradeFormat: GradeFormat) => {
    setEditingGrade(gradeFormat);
    setFormData({
      grade: gradeFormat.grade,
      description: gradeFormat.description,
      minPercentage: gradeFormat.minPercentage,
      maxPercentage: gradeFormat.maxPercentage,
      gpa: gradeFormat.gpa,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.grade || !formData.description) {
      toast({
        title: "Error",
        description: "Grade and description are required",
        variant: "destructive",
      });
      return;
    }

    if (formData.minPercentage < 0 || formData.maxPercentage > 100 || formData.minPercentage > formData.maxPercentage) {
      toast({
        title: "Error",
        description: "Invalid percentage range",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingGrade) {
        // Update existing grade format
        await apiClient.put(`/api/admin/grading-formats/${editingGrade.id}`, formData);
        toast({
          title: "Success",
          description: "Grading format updated successfully",
        });
      } else {
        // Create new grade format
        await apiClient.post('/api/admin/grading-formats', formData);
        toast({
          title: "Success",
          description: "Grading format created successfully",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      await fetchGradeFormats();
    } catch (err: any) {
      console.error('Error saving grade format:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to save grading format",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this grading format?")) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/grading-formats/${id}`);
      toast({
        title: "Success",
        description: "Grading format deleted successfully",
      });
      await fetchGradeFormats();
    } catch (err: any) {
      console.error('Error deleting grade format:', err);
      toast({
        title: "Error",
        description: "Failed to delete grading format",
        variant: "destructive",
      });
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    if (grade.includes('A')) return 'bg-green-100 text-green-800';
    if (grade.includes('B')) return 'bg-blue-100 text-blue-800';
    if (grade.includes('C')) return 'bg-yellow-100 text-yellow-800';
    if (grade.includes('D')) return 'bg-orange-100 text-orange-800';
    if (grade.includes('F')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Grading Format</h1>
          <p className="text-muted-foreground">Configure grading scales and grade descriptions</p>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-32 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Grading Format</h1>
          <p className="text-muted-foreground">Configure grading scales and grade descriptions</p>
        </div>
        <div className="flex gap-2">
          {gradeFormats.length === 0 && (
            <Button 
              onClick={initializeDefaultFormats}
              disabled={isSubmitting}
              variant="outline"
              className="gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              Initialize Default Formats
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Grade Format
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGrade ? "Edit Grade Format" : "Add Grade Format"}
                </DialogTitle>
                <DialogDescription>
                  {editingGrade 
                    ? "Update the grade format details" 
                    : "Create a new grade format for exam evaluation"
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade *</Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      placeholder="e.g., A+, A, B+"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gpa">GPA *</Label>
                    <Input
                      id="gpa"
                      type="number"
                      step="0.1"
                      min="0"
                      max="4"
                      value={formData.gpa}
                      onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 4.0"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Distinction, Excellent, Pass"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPercentage">Min Percentage *</Label>
                    <Input
                      id="minPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.minPercentage}
                      onChange={(e) => setFormData({ ...formData, minPercentage: parseInt(e.target.value) || 0 })}
                      placeholder="e.g., 80"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPercentage">Max Percentage *</Label>
                    <Input
                      id="maxPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.maxPercentage}
                      onChange={(e) => setFormData({ ...formData, maxPercentage: parseInt(e.target.value) || 0 })}
                      placeholder="e.g., 100"
                      required
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    <Save className="h-4 w-4" />
                    {editingGrade ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Grade Scale Configuration</CardTitle>
          <CardDescription>
            Define the grading scale used for student assessments. This determines how marks are converted to grades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gradeFormats.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Grading Formats Configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up your grading scale to define how marks are converted to grades.
              </p>
              <Button onClick={initializeDefaultFormats} disabled={isSubmitting} className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Initialize Default Formats
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gradeFormats
                  .sort((a, b) => b.minPercentage - a.minPercentage)
                  .map((format) => (
                    <Card key={format.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <Badge className={getGradeBadgeColor(format.grade)}>
                            {format.grade}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(format)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(format.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-medium">{format.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format.minPercentage}% - {format.maxPercentage}%
                          </p>
                          <p className="text-sm font-medium">
                            GPA: {format.gpa.toFixed(1)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Grade Scale Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Percentage Range</TableHead>
                        <TableHead>GPA</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradeFormats
                        .sort((a, b) => b.minPercentage - a.minPercentage)
                        .map((format) => (
                          <TableRow key={format.id}>
                            <TableCell>
                              <Badge className={getGradeBadgeColor(format.grade)}>
                                {format.grade}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{format.description}</TableCell>
                            <TableCell>
                              {format.minPercentage}% - {format.maxPercentage}%
                            </TableCell>
                            <TableCell>{format.gpa.toFixed(1)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(format)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(format.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
