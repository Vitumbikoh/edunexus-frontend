import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  Calendar, 
  User, 
  Award, 
  TrendingUp, 
  BookOpen,
  School,
  MapPin,
  Phone,
  Mail,
  Globe,
  PrinterIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SchoolInfo {
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  motto?: string;
  about?: string;
}

export interface StudentInfo {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  className?: string;
  academicYear?: string;
  term?: string;
}

export interface PerformanceSummary {
  overallGPA: number;
  averageScore: number;
  totalCourses: number;
  totalMarks: number;
  totalPossible: number;
  performance: string;
  position?: number;
  totalStudents?: number;
}

export interface CourseResult {
  courseCode: string;
  courseName: string;
  finalPercentage: number;
  grade: string;
  points: number;
  status: 'Pass' | 'Fail';
  computedAt: Date;
  breakdown?: Array<{
    componentType: string;
    weight: number;
    earnedPercentage: number | null;
    status: string;
  }>;
}

interface ProfessionalReportCardProps {
  school: SchoolInfo;
  student: StudentInfo;
  summary: PerformanceSummary;
  courses: CourseResult[];
  onPrint?: () => void;
  className?: string;
}

const GradeColorMap: Record<string, string> = {
  'A+': 'bg-transparent text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-500/40',
  'A': 'bg-transparent text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-500/40',
  'A-': 'bg-transparent text-green-700 border-green-300 dark:text-green-300 dark:border-green-500/40',
  'B+': 'bg-transparent text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-500/40',
  'B': 'bg-transparent text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-500/40',
  'B-': 'bg-transparent text-indigo-700 border-indigo-300 dark:text-indigo-300 dark:border-indigo-500/40',
  'C+': 'bg-transparent text-yellow-700 border-yellow-300 dark:text-yellow-300 dark:border-yellow-500/40',
  'C': 'bg-transparent text-yellow-700 border-yellow-300 dark:text-yellow-300 dark:border-yellow-500/40',
  'C-': 'bg-transparent text-orange-700 border-orange-300 dark:text-orange-300 dark:border-orange-500/40',
  'D+': 'bg-transparent text-red-700 border-red-300 dark:text-red-300 dark:border-red-500/40',
  'D': 'bg-transparent text-red-700 border-red-300 dark:text-red-300 dark:border-red-500/40',
  'F': 'bg-transparent text-red-700 border-red-300 dark:text-red-300 dark:border-red-500/40',
};

const getPerformanceColor = (gpa: number) => {
  if (gpa >= 3.5) return "text-emerald-600";
  if (gpa >= 3.0) return "text-blue-600";
  if (gpa >= 2.5) return "text-yellow-600";
  if (gpa >= 2.0) return "text-orange-600";
  return "text-red-600";
};

const getPerformanceIcon = (gpa: number) => {
  if (gpa >= 3.5) return <Award className="h-5 w-5 text-emerald-600" />;
  if (gpa >= 2.5) return <TrendingUp className="h-5 w-5 text-blue-600" />;
  return <BookOpen className="h-5 w-5 text-orange-600" />;
};

const ProfessionalReportCard: React.FC<ProfessionalReportCardProps> = ({
  school,
  student,
  summary,
  courses,
  onPrint,
  className
}) => {
  return (
    <div className={cn("max-w-4xl mx-auto space-y-6 print:space-y-4", className)}>
      {/* School Header - Clean and Professional */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {school.logoUrl ? (
                <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                  <img
                    src={school.logoUrl}
                    alt={`${school.name} Logo`}
                    className="h-12 w-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="text-primary text-xl font-bold">🎓</div>';
                    }}
                  />
                </div>
              ) : (
                <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                  <School className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">{school.name}</h1>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {school.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{school.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    {school.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{school.phone}</span>
                      </div>
                    )}
                    {school.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{school.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {onPrint && (
              <Button onClick={onPrint} variant="outline" size="sm" className="gap-2">
                <PrinterIcon className="h-4 w-4" />
                Print Report Card
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 border-t">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1">Academic Performance Report</h2>
            <p className="text-sm text-muted-foreground">Official Student Report Card</p>
          </div>
        </CardContent>
      </Card>

      {/* Academic Period & Student Info - Clean Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Academic Period Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Academic Period
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Academic Year</label>
              <p className="text-base font-semibold">{student.academicYear}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Academic Term</label>
              <p className="text-base font-semibold">{student.term}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Class</label>
              <p className="text-base font-semibold">{student.className}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Report Date</label>
              <p className="text-sm">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </CardContent>
        </Card>

        {/* Student Information Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="text-lg font-semibold">{student.firstName} {student.lastName}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Student ID</label>
              <p className="text-base font-semibold">{student.studentId}</p>
            </div>
            {summary.position && summary.totalStudents && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Class Position</label>
                <p className="text-base font-semibold">{summary.position} of {summary.totalStudents}</p>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Performance Level</label>
              <div className="flex items-center gap-2">
                {getPerformanceIcon(summary.overallGPA)}
                <p className="text-base font-semibold">{summary.performance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {getPerformanceIcon(summary.overallGPA)}
            Academic Performance Summary
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* GPA Card */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getPerformanceIcon(summary.overallGPA)}
              </div>
              <div className="text-2xl font-bold mb-1">
                {summary.overallGPA.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                Overall GPA
              </div>
            </div>

            {/* Average Score Card */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold mb-1">
                {Math.round(summary.averageScore)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Average Score
              </div>
            </div>

            {/* Total Courses Card */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold mb-1">
                {summary.totalCourses}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Courses
              </div>
            </div>

            {/* Total Marks Card */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-lg font-bold mb-1">
                {summary.totalMarks}/{summary.totalPossible}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Marks
              </div>
            </div>

            {/* Performance Level Card */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-lg font-bold mb-1">
                {summary.performance}
              </div>
              <div className="text-xs text-muted-foreground">
                Performance Level
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Results Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Detailed Course Performance
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          {courses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-sm">Course Code</th>
                    <th className="text-left p-4 font-medium text-sm">Course Name</th>
                    <th className="text-center p-4 font-medium text-sm">Percentage</th>
                    <th className="text-center p-4 font-medium text-sm">Grade</th>
                    <th className="text-center p-4 font-medium text-sm">Points</th>
                    <th className="text-center p-4 font-medium text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => (
                    <tr key={course.courseCode} className={cn(
                      "border-b hover:bg-muted/30 transition-colors",
                      index % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}>
                      <td className="p-4 font-mono text-sm font-medium">
                        {course.courseCode}
                      </td>
                      <td className="p-4 font-medium">
                        {course.courseName}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold">
                          {Math.round(course.finalPercentage)}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Badge className={cn(
                          "font-medium",
                          GradeColorMap[course.grade] || "bg-transparent text-gray-700 border-gray-300 dark:text-gray-300"
                        )}>
                          {course.grade}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold">
                          {course.points.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          variant="outline"
                          className={course.status === 'Pass'
                            ? 'bg-transparent border-green-300 text-green-700 dark:text-green-300 dark:border-green-500/40'
                            : 'bg-transparent border-red-300 text-red-700 dark:text-red-300 dark:border-red-500/40'}
                        >
                          {course.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No course results available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* School About Section (for print) */}
      {school.about && (
        <Card className="print:block hidden">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-2">About {school.name}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {school.about}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfessionalReportCard;