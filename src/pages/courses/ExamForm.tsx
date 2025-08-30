import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

export default function ExamForm() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { toast } = useToast();
  const { token, user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    examType: "",
    totalMarks: "",
    date: "",
    duration: "",
    instructions: "",
    subject: state?.course?.name || "",
    classId: state?.course?.class?.id || "",
    teacherId: user?.id || "",
    className: state?.course?.class?.name || "",
    teacherName: user?.name || state?.course?.teacher?.name || "Unknown Teacher",
    status: "upcoming" as "upcoming" | "administered" | "graded",
    studentsEnrolled: 0,
    studentsCompleted: 0,
    term: "2024-2025",
    courseId: courseId || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(!state?.course);
  const [courseError, setCourseError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Initial state.course:", state?.course);
    console.log("User from useAuth:", { id: user?.id, name: user?.name });
    if (!state?.course && courseId) {
      const fetchCourseDetails = async () => {
        try {
          setIsLoadingCourse(true);
          setCourseError(null);
          interface CourseResponse {
            success: boolean;
            course: {
              id: string;
              name?: string;
              class?: { id: string; name?: string };
            };
          }
          const response = await axios.get<CourseResponse>(
            `http://localhost:5000/api/v1/teacher/my-courses/${courseId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("Course API response:", response.data);
          if (response.data.success) {
            const course = response.data.course;
            if (!course.class?.id) {
              throw new Error("Missing classId in course response");
            }
            setFormData((prev) => ({
              ...prev,
              classId: course.class?.id || "",
              className: course.class?.name || "",
              subject: course.name || "",
            }));
          } else {
            throw new Error("Failed to fetch course details");
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || "Failed to load course details. Please try again.";
          setCourseError(errorMessage);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          console.error("Fetch course error:", error.response?.data || error);
        } finally {
          setIsLoadingCourse(false);
        }
      };
      fetchCourseDetails();
    }
  }, [courseId, token, state, toast, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "examType"
        ? { subject: value.charAt(0).toUpperCase() + value.slice(1) }
        : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      "title",
      "examType",
      "totalMarks",
      "date",
      "duration",
      "subject",
      "classId",
      "teacherId",
      "courseId",
    ];

    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      toast({
        title: "Error",
        description: `Please fill in all required fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    if (!/^\d+$/.test(formData.totalMarks)) {
      toast({
        title: "Error",
        description: "Total marks must be a valid number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        examType: formData.examType,
        totalMarks: parseInt(formData.totalMarks),
        date: formData.date,
        duration: formData.duration,
        instructions: formData.instructions,
        subject: formData.subject,
        classId: formData.classId,
        teacherId: formData.teacherId,
        status: formData.status,
        studentsEnrolled: formData.studentsEnrolled,
        studentsCompleted: formData.studentsCompleted,
        term: formData.term,
        courseId: formData.courseId,
      };

      console.log("Submitting payload:", payload);

      const response = await axios.post("http://localhost:5000/api/v1/exams", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Success",
        description: "Exam created successfully!",
      });

      navigate("/my-courses");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to create exam. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Failed to create exam:", error.response?.data || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCourse) {
    return <div>Loading course details...</div>;
  }

  if (courseError) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          {courseError}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/my-courses")}
          className="gap-2"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Exam</h1>
          <p className="text-muted-foreground">
            Create a new exam for {formData.subject || "your course"}
          </p>
        </div>
      </div>

      {(!formData.classId || !formData.teacherId) && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700">
          Warning: Missing {formData.classId ? "" : "class ID"}{" "}
          {formData.teacherId ? "" : "teacher ID"}. Submission will fail without these IDs.
        </div>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Mathematics Mid-period Exam"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="examType">Exam Type *</Label>
              <Select
                value={formData.examType}
                onValueChange={(value) => handleInputChange("examType", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="midperiod">Mid-period Exam</SelectItem>
                  <SelectItem value="endperiod">End-period Exam</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="practical">Practical Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Input
                id="class"
                value={formData.className || "No class assigned"}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher *</Label>
              <Input
                id="teacher"
                value={formData.teacherName || "No teacher assigned"}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks *</Label>
              <Input
                id="totalMarks"
                type="number"
                placeholder="e.g., 100"
                min="1"
                value={formData.totalMarks}
                onChange={(e) => handleInputChange("totalMarks", e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Exam Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => handleInputChange("duration", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30 minutes">30 minutes</SelectItem>
                    <SelectItem value="1 hour">1 hour</SelectItem>
                    <SelectItem value="1.5 hours">1.5 hours</SelectItem>
                    <SelectItem value="2 hours">2 hours</SelectItem>
                    <SelectItem value="2.5 hours">2.5 hours</SelectItem>
                    <SelectItem value="3 hours">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the exam content..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Exam Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Instructions for students taking the exam..."
                value={formData.instructions}
                onChange={(e) => handleInputChange("instructions", e.target.value)}
                rows={4}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/my-courses")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.classId || !formData.teacherId}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Creating..." : "Create Exam"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}