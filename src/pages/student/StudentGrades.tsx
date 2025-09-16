import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Award, Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { exportReportToPdf } from "@/components/reports/reportExport";
import ReportCard from "@/components/reports/ReportCard";
import { API_CONFIG } from '@/config/api';
import { termService, Term } from '@/services/termService';
export default function StudentGrades() {
  const { user, token } = useAuth();
const [terms, setTerms] = useState<Term[]>([]);
const [selectedTerm, setSelectedTerm] = useState<string>("all");
const [grades, setGrades] = useState<any[]>([]);
const [courses, setCourses] = useState<string[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [activeTerm, setActiveTerm] = useState<Term | null>(null);
const [previousTerm, setPreviousTerm] = useState<Term | null>(null);
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
    // Get active and previous term first
    let act: Term | null = null;
    let prev: Term | null = null;
    let allTerms: Term[] = [];
    try {
      const [active, termsList] = await Promise.all([
        termService.getActiveTerm(token!),
        termService.getTerms(token!)
      ]);
      act = active;
      allTerms = termsList || [];
      if (active && Array.isArray(termsList) && termsList.length > 0) {
        // Try to find previous by termNumber if available
        const withNumbers = termsList.filter(t => typeof t.termNumber === 'number');
        if (withNumbers.length === termsList.length) {
          const current = termsList.find(t => t.id === active.id);
          if (current && typeof current.termNumber === 'number') {
            const candidate = termsList
              .filter(t => (t.termNumber as number) < (current.termNumber as number))
              .sort((a, b) => (b.termNumber! - a.termNumber!))[0];
            prev = candidate || null;
          }
        }
        // Fallback: try by startDate
        if (!prev) {
          const sortable = termsList
            .filter(t => !!t.startDate)
            .sort((a, b) => new Date(a.startDate as string).getTime() - new Date(b.startDate as string).getTime());
          const idx = sortable.findIndex(t => t.id === active.id);
          prev = idx > 0 ? sortable[idx - 1] : null;
        }
        // Final fallback: use order as given
        if (!prev) {
          const idx = termsList.findIndex(t => t.id === active.id);
          prev = idx > 0 ? termsList[idx - 1] : null;
        }
      }
    } catch (e) {
      // Non-fatal: proceed without term scoping if terms endpoints fail
    }

    setActiveTerm(act || null);
    setPreviousTerm(prev || null);
    setTerms(allTerms);
    setSelectedTerm(act?.id || "all");

    console.log('Terms loaded:', allTerms);
    console.log('Active term:', act);

    const response = await fetch(`${API_CONFIG.BASE_URL}/grades/students`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch grades');
    }

    const data = await response.json();
    
    console.log('Grades response:', data);

    // Filter to active or previous term if possible
    const allowedTermIds = new Set<string>();
    if (act?.id) allowedTermIds.add(act.id);
    if (prev?.id) allowedTermIds.add(prev.id);

    const scopedResults = allowedTermIds.size
      ? data.results.filter((r: any) => !r.termId || allowedTermIds.has(r.termId))
      : data.results;

    console.log('Scoped results:', scopedResults);

    // Transform backend data to match the expected structure
    const transformedGrades = scopedResults.map((grade: any) => ({
      course: grade.subject || grade.examTitle, // Use subject or examTitle
      grade: grade.grade,
      term: grade.examType === 'midterm' ? 'Midterm' : 
            grade.examType === 'endterm' ? 'Final' : 
            (grade.examType ? grade.examType.charAt(0).toUpperCase() + grade.examType.slice(1) : '—'),
      termId: grade.termId,
      finalPercentage: grade.percentage || grade.marksObtained,
      termName: grade.term?.name || `Term ${grade.term?.termNumber || 'Unknown'}`,
    }));
    
const uniqueCourses: string[] = Array.from(new Set(transformedGrades.map((g: any) => String(g.course))));
setGrades(transformedGrades);
setCourses(uniqueCourses);
setActiveTerm(act || null);
setPreviousTerm(prev || null);
console.log('Transformed grades:', transformedGrades);
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

const filteredGrades = selectedTerm === "all" 
  ? grades 
  : grades.filter((grade: any) => grade.termId === selectedTerm);

const getRemark = (grade: string) => {
  if (grade.startsWith('A')) return "Excellent";
  if (grade.startsWith('B')) return "Good";
  if (grade.startsWith('C')) return "Satisfactory";
  if (grade.startsWith('D')) return "Needs Improvement";
  return "Poor";
};

const getGradeClass = (grade: string) => {
  if (grade.startsWith('A')) return "text-primary";
  if (grade.startsWith('B')) return "text-foreground";
  if (grade.startsWith('C')) return "text-muted-foreground";
  return "text-destructive";
};

// Computed insights for a professional summary
const normalizeGrade = (g: string) => (g || '').toUpperCase().trim();
const gradeOrder = [
  'A+', 'A', 'A-',
  'B+', 'B', 'B-',
  'C+', 'C', 'C-',
  'D+', 'D', 'D-',
  'E', 'F'
];
const bestGrade = (() => {
  const gradesOnly = (filteredGrades || []).map((g: any) => normalizeGrade(String(g.grade)));
  const sorted = gradesOnly.sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b));
  return sorted[0] || '-';
})();
const resultsCount = filteredGrades.length;
const coursesWithResults = new Set((filteredGrades || []).map((g: any) => g.course)).size;
const dist = (filteredGrades || []).reduce((acc: any, g: any) => {
  const gg = normalizeGrade(String(g.grade));
  if (gg.startsWith('A')) acc.A++;
  else if (gg.startsWith('B')) acc.B++;
  else if (gg.startsWith('C')) acc.C++;
  else acc.Other++;
  return acc;
}, { A: 0, B: 0, C: 0, Other: 0 });

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
      <td>${g.finalPercentage || "-"}</td>
      <td><span class="grade-badge grade-${String(g.grade).charAt(0).toLowerCase()}">${g.grade}</span></td>
      <td>${getRemark(g.grade)}</td>
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
                            <thead><tr><th>Course</th><th>Final %</th><th>Grade</th><th>Remark</th></tr></thead>
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
          <h1 className="text-2xl font-bold text-foreground">Exam Results</h1>
          <p className="text-muted-foreground">View your results for the active or previous term</p>
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
      <h1 className="text-2xl font-bold text-foreground">Exam Results</h1>
      <p className="text-muted-foreground">
        Showing results for {activeTerm?.name || 'current'}
        {previousTerm?.name ? ` (and previous: ${previousTerm.name})` : ''}
      </p>
    </div>

    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Results Summary</CardTitle>
            <p className="text-sm text-muted-foreground">A snapshot of your performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.name || `Term ${term.termNumber || term.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handlePrint} disabled={isLoading || !grades.length}>
              <Printer className="mr-2 h-4 w-4" />
              Print Results
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border p-4 bg-secondary/30">
            <div className="text-sm text-muted-foreground">Courses with results</div>
            <div className="text-2xl font-bold mt-1">{coursesWithResults}</div>
          </div>
          <div className="rounded-lg border p-4 bg-secondary/30">
            <div className="text-sm text-muted-foreground">Results count</div>
            <div className="text-2xl font-bold mt-1">{resultsCount}</div>
          </div>
          <div className="rounded-lg border p-4 bg-secondary/30">
            <div className="text-sm text-muted-foreground">Best grade</div>
            <div className={`text-2xl font-bold mt-1 ${getGradeClass(bestGrade)}`}>{bestGrade}</div>
          </div>
          <div className="rounded-lg border p-4 bg-secondary/30">
            <div className="text-sm text-muted-foreground">Terms shown</div>
            <div className="text-sm mt-1">
              <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 mr-2">{activeTerm?.name || 'Current'}</span>
              {previousTerm?.name && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">{previousTerm.name}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-md border p-3 text-center">
            <div className="text-xs text-muted-foreground">A range</div>
            <div className="text-lg font-semibold text-primary">{dist.A}</div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-xs text-muted-foreground">B range</div>
            <div className="text-lg font-semibold">{dist.B}</div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-xs text-muted-foreground">C range</div>
            <div className="text-lg font-semibold text-muted-foreground">{dist.C}</div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-xs text-muted-foreground">Others</div>
            <div className="text-lg font-semibold text-destructive">{dist.Other}</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Detailed Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="p-3">Course</th>
                <th className="p-3">Final %</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Remark</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">No exam results found for the selected term.</td>
                </tr>
              ) : (
                filteredGrades.map((g: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3 font-medium">{g.course}</td>
                    <td className="p-3">{g.finalPercentage || "-"}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${getGradeClass(g.grade)}`}>
                        {g.grade}
                      </span>
                    </td>
                    <td className="p-3">{getRemark(g.grade)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {/* Additional insights can be added here when backend provides average and rank */}
  </div>
);
}