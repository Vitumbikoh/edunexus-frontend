import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Briefcase,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { PagePreloader } from "@/components/ui/preloader";
import { API_CONFIG } from "@/config/api";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  user?: { email?: string; username?: string };
  phoneNumber?: string;
  subjectSpecialization?: string;
  qualification?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  yearsOfExperience: number;
  status: string;
  hireDate: string;
}

export default function TeacherDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      if (!id || !token) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${API_CONFIG.BASE_URL}/teacher/teachers/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch teacher details"
          );
        }

        const result = await response.json();
        // API returns a teacher entity directly
        setTeacher(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch teacher details";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacher();
  }, [id, token, navigate, toast]);

  if (isLoading) {
    return <PagePreloader text="Loading teacher details..." />;
  }

  if (error || !teacher) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate("/teachers/view")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teachers
          </Button>
        </div>
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error || "Teacher not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate("/teachers/view")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teachers
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Main Teacher Info */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  {teacher.firstName} {teacher.lastName}
                </CardTitle>
                <div className="mt-2">
                  <Badge
                    variant={
                      teacher.status === "active"
                        ? "default"
                        : teacher.status === "on-leave"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {teacher.status.charAt(0).toUpperCase() +
                      teacher.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Contact Information</h3>
                <div className="space-y-3">
                  {teacher.user?.username && (
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{teacher.user.username}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{teacher.user?.email || "-"}</span>
                  </div>
                  {teacher.phoneNumber && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{teacher.phoneNumber}</span>
                    </div>
                  )}
                  {teacher.address && (
                    <div className="flex items-center space-x-3">
                      <span className="text-muted-foreground">Address:</span>
                      <span>{teacher.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Professional Information
                </h3>
                <div className="space-y-3">
                  {teacher.subjectSpecialization && (
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{teacher.subjectSpecialization}</span>
                    </div>
                  )}
                  {teacher.qualification && (
                    <div className="flex items-center space-x-3">
                      <span className="text-muted-foreground">Qualification:</span>
                      <span>{teacher.qualification}</span>
                    </div>
                  )}
                  {teacher.gender && (
                    <div className="flex items-center space-x-3">
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="capitalize">{teacher.gender}</span>
                    </div>
                  )}
                  {teacher.dateOfBirth && (
                    <div className="flex items-center space-x-3">
                      <span className="text-muted-foreground">Date of Birth:</span>
                      <span>{new Date(teacher.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{teacher.yearsOfExperience} years of experience</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Hired: {new Date(teacher.hireDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
