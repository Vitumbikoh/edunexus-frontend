import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { exportReportToPdf } from "@/components/reports/reportExport";

export default function StudentGrades() {
  const { user, token } = useAuth();
const [grades, setGrades] = useState<any[]>([]);
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
    const response = await fetch('http://localhost:5000/api/v1/grades/students', {
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
    
setGrades(transformedGrades);
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

const handlePrint = () => {
  const columns = ["Course", "Term", "Grade"];
  const rows = grades.map((g: any) => [g.course, g.term, g.grade]);
  const summary = [
    { label: "Total Courses", value: new Set(grades.map((g: any) => g.course)).size },
    { label: "Report Date", value: new Date().toLocaleDateString() },
  ];
  exportReportToPdf({
    title: "My Report Card",
    summary,
    columns,
    rows,
    filename: "report-card.pdf",
  });
};

  if (isLoading) {
return (
  <div className="flex items-center justify-center h-96">
    <Button disabled>Loading...</Button>
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
  <div className="flex items-center justify-center h-96">
    <Button onClick={handlePrint} disabled={isLoading || !grades.length}>
      Print Report Card
    </Button>
  </div>
);
}