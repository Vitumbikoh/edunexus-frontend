import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
}

interface Class {
  id: string;
  name: string;
  numericalName: number;
}

interface Schedule {
  days: string[];
  time: string;
  location: string;
}

export default function CourseForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [apiError, setApiError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    status: "upcoming",
    startDate: "",
    endDate: "",
    teacherId: "",
    classId: "",
    scheduleDays: [] as string[],
    scheduleTime: "",
    scheduleLocation: "",
  });

  // Check permissions
  const canAddCourse = user?.role === "admin";
  const canEditCourse = user?.role === "admin";

  if ((isEditMode && !canEditCourse) || (!isEditMode && !canAddCourse)) {
    navigate("/courses");
    return null;
  }

  // Fetch course data if in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/v1/course/courses/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch course data");
        }

        const data = await response.json();
        const course = data;

        // Handle schedule - ensure it's always an object
        const schedule = course.schedule || {};
        const scheduleDays = Array.isArray(schedule.days) ? schedule.days : [];
        const scheduleTime = schedule.time || "";
        const scheduleLocation = schedule.location || "";

        setFormData({
          code: course.code || "",
          name: course.name || "",
          description: course.description || "",
          status: course.status || "upcoming",
          startDate: course.startDate ? course.startDate.split("T")[0] : "",
          endDate: course.endDate ? course.endDate.split("T")[0] : "",
          teacherId: course.teacherId || "",
          classId: course.classId || "",
          scheduleDays,
          scheduleTime,
          scheduleLocation,
        });
      } catch (error) {
        setApiError(
          error instanceof Error ? error.message : "Failed to fetch course data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchCourse();
    }
  }, [id, isEditMode, token]);

  // Fetch teachers from backend
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoadingTeachers(true);
        const response = await fetch(
          "http://localhost:5000/api/v1/teacher/teachers",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch teachers");
        }

        const data = await response.json();
        setTeachers(data.teachers || []);
      } catch (error) {
        setApiError(
          error instanceof Error ? error.message : "Failed to fetch teachers"
        );
      } finally {
        setIsLoadingTeachers(false);
      }
    };

    if (token) {
      fetchTeachers();
    }
  }, [token]);

  // Fetch classes from backend
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoadingClasses(true);
        const response = await fetch(
          "http://localhost:5000/api/v1/classes",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch classes");
        }

        const data = await response.json();
        setClasses(data || []);
      } catch (error) {
        setApiError(
          error instanceof Error ? error.message : "Failed to fetch classes"
        );
      } finally {
        setIsLoadingClasses(false);
      }
    };

    if (token) {
      fetchClasses();
    }
  }, [token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleMultiSelectChange = (values: string[]) => {
    setFormData((prev) => ({
      ...prev,
      scheduleDays: values,
    }));
  };

  const handleAssignTeacher = async (courseId: string, teacherId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/course/courses/${courseId}/assign-teacher`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ teacherId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign teacher");
      }

      return await response.json();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to assign teacher";
      throw errorMessage;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    try {
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Prepare schedule object if any schedule fields are filled
      const schedule: Schedule | undefined =
        formData.scheduleDays.length > 0 ||
        formData.scheduleTime ||
        formData.scheduleLocation
          ? {
              days: formData.scheduleDays,
              time: formData.scheduleTime,
              location: formData.scheduleLocation,
            }
          : undefined;

      if (isEditMode && id) {
        // Update existing course
        const updateResponse = await fetch(
          `http://localhost:5000/api/v1/course/courses/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              code: formData.code,
              name: formData.name,
              description: formData.description,
              status: formData.status,
              startDate: formData.startDate
                ? new Date(formData.startDate).toISOString()
                : undefined,
              endDate: formData.endDate
                ? new Date(formData.endDate).toISOString()
                : undefined,
              classId: formData.classId,
              schedule: schedule ? JSON.stringify(schedule) : undefined,
            }),
          }
        );

        if (updateResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          throw new Error("Session expired. Please log in again.");
        }

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.message || "Failed to update course");
        }

        // Handle teacher assignment if changed
        if (formData.teacherId) {
          await handleAssignTeacher(id, formData.teacherId);
        }

        toast({
          title: "Course Updated",
          description: "Course has been successfully updated.",
          variant: "default",
        });
      } else {
        // Create new course
        const createCourseResponse = await fetch(
          "http://localhost:5000/api/v1/course/courses",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              code: formData.code,
              name: formData.name,
              description: formData.description,
              status: formData.status,
              startDate: formData.startDate
                ? new Date(formData.startDate).toISOString()
                : undefined,
              endDate: formData.endDate
                ? new Date(formData.endDate).toISOString()
                : undefined,
              classId: formData.classId,
              schedule: schedule ? JSON.stringify(schedule) : undefined,
            }),
          }
        );

        if (createCourseResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          throw new Error("Session expired. Please log in again.");
        }

        if (!createCourseResponse.ok) {
          const errorData = await createCourseResponse.json();
          throw new Error(errorData.message || "Failed to add course");
        }

        const courseResult = await createCourseResponse.json();
        const courseId = courseResult.id || courseResult.course?.id;

        if (!courseId) {
          throw new Error("Failed to get course ID from response");
        }

        if (formData.teacherId) {
          await handleAssignTeacher(courseId, formData.teacherId);
        }

        toast({
          title: "Course Added",
          description: "New course has been successfully added.",
          variant: "default",
        });
      }

      navigate("/courses");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : isEditMode
          ? "Failed to update course"
          : "Failed to add course";
      setApiError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={() => navigate("/courses")}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Edit Course" : "Add New Course"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update the course details"
              : "Create a new course for the curriculum"}
          </p>
        </div>
      </div>

      {apiError && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {apiError}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>
              {isEditMode
                ? "Update the course details below."
                : "Enter the details for the new course."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g., MATH101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Advanced Mathematics"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the course contents and learning objectives..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacherId">Assigned Teacher</Label>
                <Select
                  value={formData.teacherId}
                  onValueChange={(value) =>
                    handleSelectChange("teacherId", value)
                  }
                  disabled={isLoadingTeachers}
                >
                  <SelectTrigger id="teacherId">
                    <SelectValue
                      placeholder={
                        isLoadingTeachers
                          ? "Loading teachers..."
                          : "Select teacher"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) =>
                    handleSelectChange("classId", value)
                  }
                  disabled={isLoadingClasses}
                >
                  <SelectTrigger id="classId">
                    <SelectValue
                      placeholder={
                        isLoadingClasses
                          ? "Loading classes..."
                          : "Select class"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} (Grade {cls.numericalName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Schedule (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="scheduleDays">Days</Label>
                  <Select
                    value={formData.scheduleDays[0] || ""}
                    onValueChange={(value) => handleMultiSelectChange([value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduleTime">Time</Label>
                  <Input
                    id="scheduleTime"
                    type="time"
                    value={formData.scheduleTime}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduleLocation">Location</Label>
                  <Input
                    id="scheduleLocation"
                    value={formData.scheduleLocation}
                    onChange={handleChange}
                    placeholder="Room number"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting
                ? "Saving..."
                : isEditMode
                ? "Update Course"
                : "Save Course"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}