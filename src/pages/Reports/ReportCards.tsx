import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity,
  Loader2, 
  FileSpreadsheet, 
  FileDown, 
  Users, 
  BookOpen, 
  DollarSign, 
  GraduationCap, 
  TrendingUp, 
  FileText,
  Download
} from "lucide-react";

interface ReportDataAPI {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalFeePayments: number;
  totalRevenue: number;
  studentsByGrade: Array<{ grade: string; count: number }>;
  enrollmentsByMonth: Array<{ month: string; count: number }>;
  paymentsByMonth: Array<{ month: string; amount: number }>;
  coursePopularity: Array<{ courseName: string; enrollments: number }>;
}

interface ReportCardsProps {
  reportData: ReportDataAPI;
  // Full filters object (typed loosely because parent maintains shape)
  filters: any;
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  classes: Array<{ id: string; name: string }>;
  students: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; name: string }>;
  teachers: Array<{ id: string; name: string }>;
  terms: Array<{ id: string; name: string }>;
  academicCalendars: Array<{ id: string; name?: string; term?: string }>; 
  isGenerating: boolean; // legacy
  onGenerateReport: (format: "excel" | "pdf", type: string) => void;
  generatingCategory?: { category: string; format: 'excel' | 'pdf' } | null;
  onViewLogs?: () => void;
}

export const ReportCards: React.FC<ReportCardsProps> = ({
  reportData,
  filters,
  setFilters,
  classes,
  students,
  courses,
  teachers,
  terms,
  academicCalendars,
  isGenerating,
  onGenerateReport,
  generatingCategory,
  onViewLogs,
}) => {
  const nonGraduatedClasses = classes.filter((c) => {
    const className = (c?.name || '').trim().toLowerCase();
    return className !== 'graduated' && !className.includes('graduated');
  });

  return (
    <>
      {/* Enrollment Report Card (Previously Missing) */}
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Enrollment Report</CardTitle>
              <p className="text-muted-foreground text-sm">Class & course enrollment records</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col h-full space-y-4">
          <p className="text-muted-foreground text-sm">
            Detailed enrollment information including student-class-course relationships and timelines.
          </p>
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Filter Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Class</Label>
                <Select value={filters.enrollmentClassId} onValueChange={(v) => setFilters((p:any) => ({ ...p, enrollmentClassId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All classes</SelectItem>
                    {nonGraduatedClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Course</Label>
                <Select value={filters.enrollmentCourseId} onValueChange={(v) => setFilters((p:any) => ({ ...p, enrollmentCourseId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All courses</SelectItem>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Teacher</Label>
                <Select value={filters.enrollmentTeacherId} onValueChange={(v) => setFilters((p:any) => ({ ...p, enrollmentTeacherId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All teachers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All teachers</SelectItem>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Academic Calendar</Label>
                <Select value={filters.enrollmentAcademicCalendarId} onValueChange={(v) => setFilters((p:any) => ({ ...p, enrollmentAcademicCalendarId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All calendars" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All calendars</SelectItem>
                    {academicCalendars.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name || a.term || a.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1" />

          {/* Action buttons positioned at bottom */}
          <div className="flex gap-2 pt-4 mt-auto">
            <Button
              onClick={() => onGenerateReport("excel", "enrollments")}
              disabled={!!generatingCategory}
              size="sm"
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'enrollments' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
            </Button>
            <Button
              onClick={() => onGenerateReport("pdf", "enrollments")}
              disabled={!!generatingCategory}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <FileDown className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'enrollments' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Students Report Card */}
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Students Report</CardTitle>
              <p className="text-muted-foreground text-sm">Student enrollment and academic records</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col h-full space-y-4">
          <p className="text-muted-foreground text-sm">
            Detailed student information including enrollment status, academic performance, and personal details.
          </p>
          
          {/* Students Filters */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Filter Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Gender</Label>
                <Select value={filters.studentGender} onValueChange={(v) => setFilters(prev => ({ ...prev, studentGender: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Class</Label>
                <Select value={filters.studentClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, studentClassId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All classes</SelectItem>
                    {nonGraduatedClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Joined Term</Label>
                <Select value={filters.studentJoinedTermId} onValueChange={(v) => setFilters(prev => ({ ...prev, studentJoinedTermId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All joined terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All joined terms</SelectItem>
                    {terms.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1" />

          {/* Action buttons positioned at bottom */}
          <div className="flex gap-2 pt-4 mt-auto">
            <Button
              onClick={() => onGenerateReport("excel", "students")}
              disabled={!!generatingCategory}
              size="sm"
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'students' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
            </Button>
            <Button
              onClick={() => onGenerateReport("pdf", "students")}
              disabled={!!generatingCategory}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <FileDown className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'students' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Report Card */}
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Teachers Report</CardTitle>
              <p className="text-muted-foreground text-sm">Faculty information and assignments</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col h-full space-y-4">
          <p className="text-muted-foreground text-sm">
            Comprehensive teacher profiles including course assignments, qualifications, and contact information.
          </p>
          
          {/* Teachers Filters */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Filter Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Teacher</Label>
                <Select value={filters.teacherId} onValueChange={(v) => setFilters(prev => ({ ...prev, teacherId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All teachers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All teachers</SelectItem>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Course</Label>
                <Select value={filters.courseId} onValueChange={(v) => setFilters(prev => ({ ...prev, courseId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All courses</SelectItem>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1" />

          {/* Action buttons positioned at bottom */}
          <div className="flex gap-2 pt-4 mt-auto">
            <Button
              onClick={() => onGenerateReport("excel", "teachers")}
              disabled={!!generatingCategory}
              size="sm"
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'teachers' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
            </Button>
            <Button
              onClick={() => onGenerateReport("pdf", "teachers")}
              disabled={!!generatingCategory}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <FileDown className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'teachers' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Courses Report Card */}
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Courses Report</CardTitle>
              <p className="text-muted-foreground text-sm">Course catalog and enrollment data</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col h-full space-y-4">
          <p className="text-muted-foreground text-sm">
            Complete course listings with enrollment statistics, teacher assignments, and curriculum details.
          </p>
          
          {/* Courses Filters */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Filter Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Course</Label>
                <Select value={filters.courseId} onValueChange={(v) => setFilters(prev => ({ ...prev, courseId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All courses</SelectItem>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Term</Label>
                <Select value={filters.termId} onValueChange={(v) => setFilters(prev => ({ ...prev, termId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All terms</SelectItem>
                    {terms.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1" />

          {/* Action buttons positioned at bottom */}
          <div className="flex gap-2 pt-4 mt-auto">
            <Button
              onClick={() => onGenerateReport("excel", "courses")}
              disabled={!!generatingCategory}
              size="sm"
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'courses' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
            </Button>
            <Button
              onClick={() => onGenerateReport("pdf", "courses")}
              disabled={!!generatingCategory}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <FileDown className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'courses' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Report Card */}
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Financial Report</CardTitle>
              <p className="text-muted-foreground text-sm">Fee payments and financial analytics</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col h-full space-y-4">
          <p className="text-muted-foreground text-sm">
            Detailed financial records including fee payments, outstanding balances, and revenue analytics.
          </p>
          
          {/* Financial Filters */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Filter Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Student</Label>
                <Select value={filters.paymentStudentId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentStudentId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All students</SelectItem>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Class</Label>
                <Select value={filters.paymentClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentClassId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All classes</SelectItem>
                    {nonGraduatedClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Term</Label>
                <Select value={filters.paymentTermId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentTermId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All terms</SelectItem>
                    {terms.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Academic Calendar</Label>
                <Select value={filters.paymentAcademicCalendarId} onValueChange={(v) => setFilters(prev => ({ ...prev, paymentAcademicCalendarId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All calendars" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All calendars</SelectItem>
                    {academicCalendars.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name || a.term || a.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1" />

          {/* Action buttons positioned at bottom */}
          <div className="flex gap-2 pt-4 mt-auto">
            <Button
              onClick={() => onGenerateReport("excel", "financial")}
              disabled={!!generatingCategory}
              size="sm"
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'financial' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
            </Button>
            <Button
              onClick={() => onGenerateReport("pdf", "financial")}
              disabled={!!generatingCategory}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <FileDown className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'financial' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Audit & Oversight</CardTitle>
              <p className="text-muted-foreground text-sm">Recent School Admin activity and key events</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col h-full space-y-4">
          <p className="text-muted-foreground text-sm">
            Export oversight logs for CREATE, UPDATE, and DELETE operations to support governance and audit tracking.
          </p>

          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Filter Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Action Type</Label>
                <Select value={filters.auditAction} onValueChange={(v) => setFilters((prev: any) => ({ ...prev, auditAction: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="CREATE">CREATE</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Date Range</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <input
                      type="date"
                      value={filters.auditDateFrom}
                      onChange={(e) => setFilters((prev: any) => ({ ...prev, auditDateFrom: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <input
                      type="date"
                      value={filters.auditDateTo}
                      onChange={(e) => setFilters((prev: any) => ({ ...prev, auditDateTo: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const yyyy = today.getFullYear();
                      const mm = String(today.getMonth() + 1).padStart(2, '0');
                      const dd = String(today.getDate()).padStart(2, '0');
                      const date = `${yyyy}-${mm}-${dd}`;
                      setFilters((prev: any) => ({ ...prev, auditDateFrom: date, auditDateTo: date }));
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setFilters((prev: any) => ({ ...prev, auditDateFrom: '', auditDateTo: '' }))}
                  >
                    Clear Dates
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex flex-col sm:flex-row gap-2 pt-4 mt-auto">
            <Button
              onClick={() => onViewLogs?.()}
              disabled={!!generatingCategory}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              View Logs
            </Button>
            <Button
              onClick={() => onGenerateReport('excel', 'audit-oversight')}
              disabled={!!generatingCategory}
              size="sm"
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'audit-oversight' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Download Excel'}
            </Button>
            <Button
              onClick={() => onGenerateReport('pdf', 'audit-oversight')}
              disabled={!!generatingCategory}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <FileDown className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'audit-oversight' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Download PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Report Card */}
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Expenses Report</CardTitle>
              <p className="text-muted-foreground text-sm">Expense approvals and spending analytics</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col h-full space-y-4">
          <p className="text-muted-foreground text-sm">
            Detailed expense records including categories, status, approved amounts, and spending trends.
          </p>

          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Filter Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Term</Label>
                <Select value={filters.expenseTermId} onValueChange={(v) => setFilters((prev:any) => ({ ...prev, expenseTermId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All terms</SelectItem>
                    {terms.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Academic Calendar</Label>
                <Select value={filters.expenseAcademicCalendarId} onValueChange={(v) => setFilters((prev:any) => ({ ...prev, expenseAcademicCalendarId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All calendars" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All calendars</SelectItem>
                    {academicCalendars.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name || a.term || a.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-foreground">Status</Label>
                <Select value={filters.expenseStatus} onValueChange={(v) => setFilters((prev:any) => ({ ...prev, expenseStatus: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex gap-2 pt-4 mt-auto">
            <Button
              onClick={() => onGenerateReport("excel", "expenses")}
              disabled={!!generatingCategory}
              size="sm"
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'expenses' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
            </Button>
            <Button
              onClick={() => onGenerateReport("pdf", "expenses")}
              disabled={!!generatingCategory}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <FileDown className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'expenses' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Exam Results Report</CardTitle>
              <p className="text-muted-foreground text-sm">Student exam outcomes and grading analytics</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col h-full space-y-4">
          <p className="text-muted-foreground text-sm">
            Exam performance report with per-student subject scores, grades, and pass/fail outcomes.
          </p>

          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Filter Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Class</Label>
                <Select value={filters.examClassId} onValueChange={(v) => setFilters((prev:any) => ({ ...prev, examClassId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All classes</SelectItem>
                    {nonGraduatedClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Term</Label>
                <Select value={filters.examTermId} onValueChange={(v) => setFilters((prev:any) => ({ ...prev, examTermId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All terms</SelectItem>
                    {terms.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-foreground">Academic Calendar</Label>
                <Select value={filters.examAcademicCalendarId} onValueChange={(v) => setFilters((prev:any) => ({ ...prev, examAcademicCalendarId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All calendars" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All calendars</SelectItem>
                    {academicCalendars.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name || a.term || a.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex gap-2 pt-4 mt-auto">
            <Button
              onClick={() => onGenerateReport("excel", "exam-results")}
              disabled={!!generatingCategory}
              size="sm"
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'exam-results' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
            </Button>
            <Button
              onClick={() => onGenerateReport("pdf", "exam-results")}
              disabled={!!generatingCategory}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <FileDown className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'exam-results' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Report Card */}
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Attendance Report</CardTitle>
              <p className="text-muted-foreground text-sm">Student attendance tracking</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col h-full space-y-4">
          <p className="text-muted-foreground text-sm">
            Comprehensive attendance records with daily tracking, absence summaries, and attendance analytics.
          </p>
          
          {/* Attendance Filters */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Filter Options
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Class</Label>
                <Select value={filters.attendanceClassId} onValueChange={(v) => setFilters(prev => ({ ...prev, attendanceClassId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All classes</SelectItem>
                    {nonGraduatedClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Student</Label>
                <Select value={filters.attendanceStudentId} onValueChange={(v) => setFilters(prev => ({ ...prev, attendanceStudentId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All students</SelectItem>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Term</Label>
                <Select value={filters.attendanceTermId} onValueChange={(v) => setFilters(prev => ({ ...prev, attendanceTermId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All terms</SelectItem>
                    {terms.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Date Range</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.attendanceDateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, attendanceDateFrom: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="From date"
                  />
                  <input
                    type="date"
                    value={filters.attendanceDateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, attendanceDateTo: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="To date"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1" />

          {/* Action buttons positioned at bottom */}
          <div className="flex gap-2 pt-4 mt-auto">
            <Button
              onClick={() => onGenerateReport("excel", "attendance")}
              disabled={!!generatingCategory}
              size="sm"
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'attendance' && generatingCategory.format === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excel"}
            </Button>
            <Button
              onClick={() => onGenerateReport("pdf", "attendance")}
              disabled={!!generatingCategory}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <FileDown className="h-4 w-4 mr-1" />
              {generatingCategory?.category === 'attendance' && generatingCategory.format === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>


    </>
  );
};