import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Award, Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { exportReportToPdf } from "@/components/reports/reportExport";
import ReportCard from "@/components/reports/ReportCard";
import { API_CONFIG } from '@/config/api';
export default function StudentGrades() {
  const { user, token } = useAuth();
const [selectedTerm, setSelectedTerm] = useState<string>("all");
const [grades, setGrades] = useState<any[]>([]);
const [courses, setCourses] = useState<string[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
  if (!user || user.role !== 'student') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchGrades = async () => {
  try {
    setIsLoading(true);
    setError(null);
    const response = await fetch(`${API_CONFIG.BASE_URL}/grades/students`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch grades');
    }

    const data = await response.json();
    
    // Check for results instead of grades
    if (!data.results) {
      throw new Error('No grades data available');
    }

    // Transform backend data to match the expected structure
    const transformedGrades = data.results.map(grade => ({
      course: grade.subject || grade.examTitle, // Use subject or examTitle
      grade: grade.grade,
      term: grade.examType === 'midterm' ? 'Midterm' : 
            grade.examType === 'endterm' ? 'Final' : 
            grade.examType.charAt(0).toUpperCase() + grade.examType.slice(1),
    }));
    
const uniqueCourses: string[] = Array.from(new Set(transformedGrades.map((g: any) => String(g.course))));
setGrades(transformedGrades);
setCourses(uniqueCourses);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load grades';
    setError(errorMessage);
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  } finally {
    setIsLoading(false);
  }
};

    fetchGrades();
  }, [token]);

const terms = ["Midterm", "Final"];
const filteredGrades = selectedTerm === "all" 
  ? grades 
  : grades.filter((grade: any) => grade.term === selectedTerm);

const getGradeClass = (grade: string) => {
  if (grade.startsWith('A')) return "text-primary";
  if (grade.startsWith('B')) return "text-foreground";
  if (grade.startsWith('C')) return "text-muted-foreground";
  return "text-destructive";
};

const handlePrint = () => {
  if (!filteredGrades.length) {
    toast({
      title: 'No grades to print',
      description: 'Please select a term with grades.',
      variant: 'destructive',
    });
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const studentName = user?.name || user?.email?.split('@')[0] || 'Student';
  const termLabel = selectedTerm === 'all' ? 'All Terms' : selectedTerm;
  const today = new Date().toLocaleDateString();

  const rowsHtml = filteredGrades
    .map((g: any) => `
    <tr>
      <td>${g.course}</td>
      <td>${g.term}</td>
      <td><span class="grade-badge grade-${String(g.grade).charAt(0).toLowerCase()}">${g.grade}</span></td>
    </tr>
  `)
    .join('');

  const reportHTML = `
    <!doctype html>
    <html>
      <head>
        <title>Report Card</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          *{box-sizing:border-box}
          body{font-family: 'Times New Roman', serif; background:#f8f9fa; padding:20px}
          .card{max-width:800px;margin:0 auto;background:#fff;border:3px solid #2c3e50;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1)}
          .hdr{background:linear-gradient(135deg,#2c3e50,#34495e);color:#fff;padding:28px;text-align:center;position:relative}
          .hdr::before{content:'';position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,#e74c3c,#f39c12,#f1c40f,#27ae60,#3498db,#9b59b6)}
          .school{font-size:26px;font-weight:700;margin-bottom:6px;text-shadow:2px 2px 4px rgba(0,0,0,.3)}
          .subtitle{opacity:.9}
          .info{background:#ecf0f1;padding:22px;border-bottom:2px solid #bdc3c7}
          .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
          .label{font-weight:700;color:#2c3e50;min-width:120px}
          .row{display:flex;align-items:center}
          .section{padding:22px}
          .section-title{font-size:18px;font-weight:700;color:#2c3e50;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #3498db}
          table{width:100%;border-collapse:collapse;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
          th{background:#3498db;color:#fff;padding:12px;text-align:left}
          td{padding:12px;border-bottom:1px solid #ecf0f1}
          tr:hover{background:#f8f9fa}
          .badge{display:inline-block;padding:8px 14px;border-radius:10px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.08);border-left:4px solid #3498db}
          .badges{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
          .grade-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-weight:700;font-size:12px}
          .grade-a{background:#27ae60;color:#fff}
          .grade-b{background:#3498db;color:#fff}
          .grade-c{background:#f39c12;color:#fff}
          .grade-d{background:#e67e22;color:#fff}
          .grade-f{background:#e74c3c;color:#fff}
          .ftr{padding:16px;text-align:center;background:#ecf0f1;color:#7f8c8d;font-size:12px;border-top:1px solid #bdc3c7}
          @media print{body{background:#fff;padding:0}.card{box-shadow:none;border:2px solid #2c3e50}}
        </style>
      </head>
      <body>
        <div class="card">
          <div class="hdr">
            <div class="school">Schomas Academy</div>
            <div class="subtitle">Report Card</div>
          </div>
          <div class="info">
            <div class="grid">
              <div class="row"><span class="label">Student Name:</span><span>${studentName}</span></div>
              <div class="row"><span class="label">Generated:</span><span>${today}</span></div>
              <div class="row"><span class="label">Term:</span><span>${termLabel}</span></div>
              <div class="row"><span class="label">Total Courses:</span><span>${new Set(grades.map((g: any)=>g.course)).size}</span></div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Grades</div>
            <table>
              <thead><tr><th>Course</th><th>Term</th><th>Grade</th></tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
            <div class="badges">
              <div class="badge">Selected Term: ${termLabel}</div>
              <div class="badge">Report Date: ${today}</div>
              <div class="badge">Courses: ${new Set(grades.map((g: any)=>g.course)).size}</div>
            </div>
          </div>
          <div class="ftr">This is a system generated report card.</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(reportHTML);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Grades</h1>
          <p className="text-muted-foreground">View your academic performance</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="h-6 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-20 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
          {error}
        </div>
      </div>
    );
  }

return (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">My Grades</h1>
      <p className="text-muted-foreground">View your academic performance</p>
    </div>

    <ReportCard
      title="Grade Report"
      action={
        <div className="flex items-center gap-2">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {terms.map((term) => (
                <SelectItem key={term} value={term}>
                  {term}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handlePrint} disabled={isLoading || !grades.length}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report Card
          </Button>
        </div>
      }
      summary={[
        { label: "Total Courses", value: new Set(grades.map((g: any) => g.course)).size },
        { label: "Selected Term", value: selectedTerm === "all" ? "All Terms" : selectedTerm },
        { label: "Report Date", value: new Date().toLocaleDateString() },
      ]}
      columns={["Course", "Term", "Grade"]}
      rows={filteredGrades.map((g: any, idx: number) => ({
        key: idx,
        cells: [
          g.course,
          g.term,
          <span className={`text-right font-bold ${getGradeClass(g.grade)}`}>{g.grade}</span>
        ],
      }))}
      emptyMessage="No grades found for the selected term."
    />

    <Card>
      <CardHeader>
        <CardTitle>Performance Summary</CardTitle>
        <CardDescription>Overview of your academic performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary rounded-lg p-6 text-center border border-border">
            <h3 className="text-lg font-medium text-foreground">Total Courses</h3>
            <p className="text-3xl font-bold text-primary mt-2">{new Set(grades.map((g: any) => g.course)).size}</p>
          </div>
          <div className="bg-secondary rounded-lg p-6 text-center border border-border">
            <h3 className="text-lg font-medium text-foreground">Class Average</h3>
            <p className="text-3xl font-bold text-primary mt-2">A-</p>
          </div>
          <div className="bg-secondary rounded-lg p-6 text-center border border-border">
            <h3 className="text-lg font-medium text-foreground">Rank</h3>
            <p className="text-3xl font-bold text-primary mt-2">3 / 35</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
}