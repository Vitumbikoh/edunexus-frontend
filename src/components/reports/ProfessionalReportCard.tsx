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
  'A+': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'A': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'A-': 'bg-green-100 text-green-700 border-green-200',
  'B+': 'bg-blue-100 text-blue-700 border-blue-200',
  'B': 'bg-blue-100 text-blue-600 border-blue-200',
  'B-': 'bg-indigo-100 text-indigo-600 border-indigo-200',
  'C+': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'C': 'bg-yellow-100 text-yellow-600 border-yellow-200',
  'C-': 'bg-orange-100 text-orange-600 border-orange-200',
  'D+': 'bg-red-100 text-red-600 border-red-200',
  'D': 'bg-red-100 text-red-700 border-red-200',
  'F': 'bg-red-100 text-red-800 border-red-200',
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
    <div className={cn("max-w-6xl mx-auto space-y-8 print:space-y-6", className)}>
      {/* School Header - More Professional */}
      <Card className="border-4 border-primary/30 shadow-2xl bg-gradient-to-br from-white via-primary/5 to-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-white border-b-4 border-primary/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {school.logoUrl ? (
                <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-white/50">
                  <img
                    src={school.logoUrl}
                    alt={`${school.name} Logo`}
                    className="h-20 w-20 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="text-primary text-2xl font-bold">🎓</div>';
                    }}
                  />
                </div>
              ) : (
                <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/50">
                  <School className="h-12 w-12 text-white" />
                </div>
              )}

              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-wide">{school.name}</h1>
                {school.motto && (
                  <p className="text-lg italic text-white/90 font-medium">"{school.motto}"</p>
                )}
                <div className="flex flex-wrap gap-6 text-sm text-white/80">
                  {school.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{school.address}</span>
                    </div>
                  )}
                  {school.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">{school.phone}</span>
                    </div>
                  )}
                  {school.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">{school.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {onPrint && (
              <Button onClick={onPrint} variant="secondary" size="lg" className="gap-3 shadow-lg hover:shadow-xl transition-all duration-300">
                <PrinterIcon className="h-5 w-5" />
                Print Report Card
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Report Title */}
        <CardContent className="bg-gradient-to-r from-primary/10 to-primary/5 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary mb-2">Academic Performance Report</h2>
            <p className="text-lg text-muted-foreground">Official Student Report Card</p>
            <div className="mt-4 h-1 w-32 bg-primary mx-auto rounded-full"></div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Period & Student Info - Enhanced Professional Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Academic Period Card */}
        <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/20 border-b-2 border-primary/30">
            <h2 className="text-xl font-bold flex items-center gap-3 text-primary">
              <Calendar className="h-6 w-6" />
              Academic Period
            </h2>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Academic Year</label>
              <p className="text-lg font-bold text-foreground bg-white/50 px-3 py-2 rounded-lg border">{student.academicYear}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Academic Term</label>
              <p className="text-lg font-bold text-foreground bg-white/50 px-3 py-2 rounded-lg border">{student.term}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Class</label>
              <p className="text-lg font-bold text-foreground bg-white/50 px-3 py-2 rounded-lg border">{student.className}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Report Date</label>
              <p className="text-base font-medium text-foreground bg-white/50 px-3 py-2 rounded-lg border">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </CardContent>
        </Card>

        {/* Student Information Card */}
        <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10 lg:col-span-2">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/20 border-b-2 border-primary/30">
            <h2 className="text-xl font-bold flex items-center gap-3 text-primary">
              <User className="h-6 w-6" />
              Student Information
            </h2>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Full Name</label>
                  <p className="text-xl font-bold text-foreground bg-white/50 px-4 py-3 rounded-lg border">{student.firstName} {student.lastName}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Student ID</label>
                  <p className="text-lg font-semibold text-foreground bg-white/50 px-4 py-3 rounded-lg border">{student.studentId}</p>
                </div>
              </div>
              <div className="space-y-4">
                {summary.position && summary.totalStudents && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Class Position</label>
                    <p className="text-lg font-semibold text-foreground bg-white/50 px-4 py-3 rounded-lg border">{summary.position} of {summary.totalStudents}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Performance Level</label>
                  <div className="flex items-center gap-2">
                    {getPerformanceIcon(summary.overallGPA)}
                    <p className="text-lg font-semibold text-foreground bg-white/50 px-4 py-3 rounded-lg border flex-1">{summary.performance}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary - Enhanced Professional Design */}
      <Card className="border border-border/50">
        <CardHeader className="bg-muted/30 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {getPerformanceIcon(summary.overallGPA)}
            Academic Performance Summary
          </h2>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {/* GPA Card */}
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                {getPerformanceIcon(summary.overallGPA)}
              </div>
              <div className="text-3xl font-bold text-emerald-700 mb-2">
                {summary.overallGPA.toFixed(2)}
              </div>
              <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
                Overall GPA
              </div>
            </div>

            {/* Average Score Card */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-700 mb-2">
                {Math.round(summary.averageScore)}%
              </div>
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                Average Score
              </div>
            </div>

            {/* Total Courses Card */}
            <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
              <div className="text-3xl font-bold text-amber-700 mb-2">
                {summary.totalCourses}
              </div>
              <div className="text-sm font-semibold text-amber-600 uppercase tracking-wide">
                Total Courses
              </div>
            </div>

            {/* Total Marks Card */}
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-700 mb-2 text-lg">
                {summary.totalMarks}/{summary.totalPossible}
              </div>
              <div className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
                Total Marks
              </div>
            </div>

            {/* Performance Level Card */}
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-700 mb-2">
                {summary.performance}
              </div>
              <div className="text-sm font-semibold text-orange-600 uppercase tracking-wide">
                Performance Level
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Results - Enhanced Professional Table */}
      <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/20 border-b-2 border-primary/30">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-primary text-center justify-center">
            <BookOpen className="h-7 w-7" />
            Detailed Course Performance
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          {courses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-primary/30 bg-gradient-to-r from-primary/10 to-primary/20">
                    <th className="text-left p-6 font-bold text-primary uppercase tracking-wide text-sm">Course Code</th>
                    <th className="text-left p-6 font-bold text-primary uppercase tracking-wide text-sm">Course Name</th>
                    <th className="text-center p-6 font-bold text-primary uppercase tracking-wide text-sm">Percentage</th>
                    <th className="text-center p-6 font-bold text-primary uppercase tracking-wide text-sm">Grade</th>
                    <th className="text-center p-6 font-bold text-primary uppercase tracking-wide text-sm">Points</th>
                    <th className="text-center p-6 font-bold text-primary uppercase tracking-wide text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => (
                    <tr key={course.courseCode} className={cn(
                      "border-b border-primary/10 hover:bg-primary/5 transition-colors duration-200",
                      index % 2 === 0 ? "bg-white/50" : "bg-primary/5/30"
                    )}>
                      <td className="p-6 font-mono text-sm font-bold text-primary bg-primary/5 rounded-l-lg">
                        {course.courseCode}
                      </td>
                      <td className="p-6 font-semibold text-foreground">
                        {course.courseName}
                      </td>
                      <td className="p-6 text-center">
                        <span className="font-bold text-xl text-primary bg-primary/10 px-3 py-1 rounded-lg">
                          {Math.round(course.finalPercentage)}%
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <Badge className={cn(
                          "font-bold text-sm px-4 py-2 text-lg shadow-md",
                          GradeColorMap[course.grade] || "bg-gray-100 text-gray-800"
                        )}>
                          {course.grade}
                        </Badge>
                      </td>
                      <td className="p-6 text-center">
                        <span className="font-bold text-lg text-primary bg-primary/10 px-3 py-1 rounded-lg">
                          {course.points.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <Badge className={cn(
                          "font-bold text-sm px-4 py-2",
                          course.status === 'Pass'
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-red-100 text-red-800 border-red-300"
                        )}>
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
              <p className="text-muted-foreground text-lg">No course results available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* School About Section (for print) */}
      {school.about && (
        <Card className="border border-border/50 print:block hidden">
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