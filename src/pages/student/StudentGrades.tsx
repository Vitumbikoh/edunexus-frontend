import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ProfessionalReportCard, { 
  SchoolInfo, 
  StudentInfo, 
  PerformanceSummary, 
  CourseResult 
} from "@/components/reports/ProfessionalReportCard";
import { API_CONFIG } from '@/config/api';
import { termService, Term } from '@/services/termService';
import { ExamResultService } from '@/services/examResultService';
import { schoolSettingsService, SchoolSettings } from "@/services/schoolSettingsService";
import ErrorBoundary from "@/components/common/ErrorBoundary";
export default function StudentGrades() {
  const { user, token } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [examResults, setExamResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [fetchingTerm, setFetchingTerm] = useState<string | null>(null); // Track which term is being fetched
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [activeAcademicYear, setActiveAcademicYear] = useState<string | null>(null); // Store the active academic year from backend

  // Add debugging to state changes
  const setExamResultsWithDebug = (results: any[]) => {
    console.log('🔥 setExamResults called with:', results.length, 'results');
    console.log('🔥 Results details:', results);
    setExamResults(results);
  };

  const setSelectedTermWithDebug = (termId: string) => {
    console.log('🔥 setSelectedTerm called with:', termId);
    setSelectedTerm(termId);
  };

  // Debug state changes
  useEffect(() => {
    console.log('📊 STATE UPDATE - examResults:', examResults.length, 'results');
    console.log('📊 STATE UPDATE - selectedTerm:', selectedTerm);
  }, [examResults, selectedTerm]);

  // Helper functions for print functionality
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const getLogoUrl = (logoPath: string | null): string | null => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    
    // If the logoPath already contains the full path from the backend
    if (logoPath.startsWith('/uploads/logos/')) {
      return `${API_CONFIG.BASE_URL}${logoPath}`;
    }
    
    // Otherwise, construct the full path
    return `${API_CONFIG.BASE_URL}/uploads/logos/${logoPath}`;
  };

  // Early return for permission check - after all hooks
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
    const fetchInitialData = async () => {
      console.log('Starting fetchInitialData - token exists:', !!token, 'user role:', user?.role);
      
      if (!token || !user || user.role !== 'student') {
        console.log('Skipping data fetch - invalid token or user');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('Starting to fetch terms and profile data...');
        
        let termsToUse: Term[] = [];
        let fetchedAcademicYear: string | null = null; // No default fallback

        // First, try to get the active academic calendar to determine the correct year
        try {
          const activeCalendarResponse = await fetch(`${API_CONFIG.BASE_URL}/settings/active-academic-calendar`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (activeCalendarResponse.ok) {
            const activeCalendar = await activeCalendarResponse.json();
            if (activeCalendar?.term) {
              fetchedAcademicYear = activeCalendar.term;
              setActiveAcademicYear(fetchedAcademicYear); // Store in state
              console.log('Got active academic calendar:', fetchedAcademicYear);
            } else {
              console.log('No active academic calendar found for your school');
              setError('No active academic calendar found. Please contact your school administrator.');
              setIsLoading(false);
              return;
            }
          } else {
            console.log('Failed to fetch active academic calendar - response not ok');
            setError('Unable to load academic calendar. Please try again later.');
            setIsLoading(false);
            return;
          }
        } catch (calendarErr) {
          console.log('Could not fetch active academic calendar:', calendarErr);
          setError('Unable to connect to server. Please check your internet connection and try again.');
          setIsLoading(false);
          return;
        }

        // Try to get real terms from backend
        try {
          const termsResponse = await fetch(`${API_CONFIG.BASE_URL}/settings/terms`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (termsResponse.ok) {
            const termsData = await termsResponse.json();
            if (Array.isArray(termsData) && termsData.length > 0) {
              // Transform backend terms to our Term interface - always use "Term X" format
              termsToUse = termsData.map((term: any, index: number) => ({
                id: term.id,
                name: `Term ${term.termNumber || (index + 1)}`,
                termNumber: term.termNumber || (index + 1),
                startDate: term.startDate,
                endDate: term.endDate,
                isActive: term.isCurrent,
                academicCalendarId: term.academicCalendarId,
                periodId: term.periodId,
              }));
              console.log('Got real terms from backend:', termsToUse);
            }
          }
        } catch (termsErr) {
          console.log('Could not fetch real terms from backend:', termsErr);
        }

        // If no real terms, try to get terms from active academic calendar
        if (termsToUse.length === 0) {
          try {
            const calendarTermsResponse = await fetch(`${API_CONFIG.BASE_URL}/settings/active-academic-calendar`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (calendarTermsResponse.ok) {
              const calendarData = await calendarTermsResponse.json();
              if (calendarData?.terms && Array.isArray(calendarData.terms)) {
                termsToUse = calendarData.terms.map((term: any, index: number) => ({
                  id: term.id,
                  name: `Term ${term.termNumber || (index + 1)}`,
                  termNumber: term.termNumber || (index + 1),
                  startDate: term.startDate,
                  endDate: term.endDate,
                  isActive: term.isCurrent,
                  academicCalendarId: term.academicCalendarId,
                  periodId: term.periodId,
                }));
                console.log('Got terms from active academic calendar:', termsToUse);
              }
            }
          } catch (calendarTermsErr) {
            console.log('Could not fetch terms from active academic calendar:', calendarTermsErr);
          }
        }

        // If still no real terms, but we have a valid academic year, generate standard academic terms
        if (termsToUse.length === 0 && fetchedAcademicYear) {
          termsToUse = generateStandardTerms(fetchedAcademicYear);
          console.log('Generated standard terms for academic year:', fetchedAcademicYear, termsToUse);
        }

        // If we still have no terms, show an error
        if (termsToUse.length === 0) {
          console.log('No terms available - no active academic calendar or terms found');
          setError('No academic terms found. Please contact your school administrator.');
          setIsLoading(false);
          return;
        }

        // Remove any potential duplicates before setting terms
        const uniqueTerms = termsToUse.filter((term, index, self) => 
          index === self.findIndex(t => t.id === term.id)
        );

        setTerms(uniqueTerms);
        
        // Find the current/active term, or default to the first term
        const currentTerm = uniqueTerms.find(t => t.isActive) || uniqueTerms[0];
        setActiveTerm(currentTerm);
        setSelectedTermWithDebug(currentTerm.id);

        console.log('Final terms set:', uniqueTerms);
        console.log('Terms with details:', uniqueTerms.map(t => ({ id: t.id, name: t.name, termNumber: t.termNumber, isActive: t.isActive })));
        console.log('Current/Active term:', currentTerm);
        console.log('Selected term ID:', currentTerm.id);

        // Set school info (mock data)
        setSchoolInfo({
          name: "Rumphi Secondary School",
          address: "P.O. Box, 133, Rumphi",
          phone: "0980517768",
          email: "rusesco@edu.ac.mw",
          logoUrl: undefined,
          about: "Committed to excellence in education and character development.",
        });

        // Fetch school settings for print functionality
        try {
          console.log('Attempting to fetch school settings...');
          const settings = await schoolSettingsService.getSettings(token);
          console.log('Fetched school settings:', JSON.stringify(settings, null, 2));
          setSchoolSettings(settings);
          
          // Update school info with real data if available
          if (settings) {
            const logoUrl = settings.schoolLogo ? getLogoUrl(settings.schoolLogo) : undefined;
            console.log('School logo processing:', {
              originalLogo: settings.schoolLogo,
              processedLogoUrl: logoUrl,
              settingsHasLogo: !!settings.schoolLogo
            });
            
            setSchoolInfo({
              name: settings.schoolName || "Rumphi Secondary School",
              address: settings.schoolAddress || "P.O. Box, 133, Rumphi",
              phone: settings.schoolPhone || "0980517768",
              email: settings.schoolEmail || "rusesco@edu.ac.mw",
              logoUrl: logoUrl,
              about: settings.schoolAbout || "Committed to excellence in education and character development.",
            });
          } else {
            console.log('No settings returned from API');
          }
        } catch (settingsErr) {
          console.error('School settings fetch failed:', settingsErr);
        }

        // Try to fetch profile (optional)
        try {
          const profileResponse = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileResponse?.ok) {
            const profileData = await profileResponse.json();
            setStudentProfile(profileData);
          }
        } catch (profileErr) {
          console.log('Profile fetch failed, using defaults:', profileErr);
        }

        // Fetch exam results for the current/active term
        console.log('Fetching exam results for current term with ID:', currentTerm.id);
        await fetchExamResults(currentTerm.id);
        
        console.log('Initial data loading completed');
      } catch (err) {
        console.error('Error in fetchInitialData:', err);
        setError('Failed to load student data: ' + (err as Error).message);
      } finally {
        setIsLoading(false);
        console.log('Setting isLoading to false');
      }
    };

    fetchInitialData();
  }, [token, user?.id, user?.role]); // Add user.role to prevent re-runs when role changes

  const fetchExamResults = async (termId: string) => {
    if (!termId) {
      console.log('No termId provided for fetchExamResults');
      return;
    }

    // Prevent duplicate fetches for the same term
    if (fetchingTerm === termId) {
      console.log('Already fetching results for term:', termId);
      return;
    }

    console.log('=== FETCH EXAM RESULTS DEBUG ===');
    console.log('Fetching exam results for term:', termId);
    console.log('Token exists:', !!token);
    console.log('User role:', user?.role);

    setFetchingTerm(termId);

    try {
      // Try to fetch real exam results for the authenticated student using 'me' alias
      if (token) {
        try {
          console.log('Calling ExamResultService.getStudentResults with params:', {
            studentId: 'me',
            termId: termId,
            hasToken: !!token
          });
          
          const data = await ExamResultService.getStudentResults('me', token, undefined, termId);
          console.log('Exam results from backend:', data);
          console.log('Raw results array:', data.results);
          if (data.results && data.results.length > 0) {
            console.log('First result sample:', data.results[0]);
            console.log('Result fields check:', {
              finalPercentage: data.results[0].finalPercentage,
              finalGradeCode: data.results[0].finalGradeCode, 
              courseName: data.results[0].courseName,
              courseCode: data.results[0].courseCode
            });
            
            // If we got real results, ensure the term is in our terms list
            const realTermId = data.results[0].termId;
            const realTermName = data.results[0].termName || 'Term 1';
            if (realTermId) {
              // Check if this term already exists in our current terms list
              const existingTerm = terms.find(t => t.id === realTermId);
              
              if (!existingTerm) {
                console.log('Adding real term from backend results:', realTermId, realTermName);
                
                // Extract term number from term name or default based on position
                const termNumber = parseInt(realTermName.match(/Term (\d+)/)?.[1] || '1');
                
                const realTerm = {
                  id: realTermId,
                  name: `Term ${termNumber}`,
                  termNumber: termNumber,
                  startDate: '2022-09-01', 
                  endDate: '2022-12-15',
                  isActive: true, // Mark as active since it has current results
                };
                
                setTerms(prev => {
                  // Only add if not already present (double-check to prevent race conditions)
                  if (prev.find(t => t.id === realTermId)) {
                    console.log('Term already exists, skipping addition');
                    return prev;
                  }
                  
                  // Insert the term in the correct position based on term number
                  const newTerms = [...prev];
                  const insertIndex = newTerms.findIndex(t => t.termNumber > termNumber);
                  if (insertIndex >= 0) {
                    newTerms.splice(insertIndex, 0, realTerm);
                  } else {
                    newTerms.push(realTerm);
                  }
                  
                  // Remove any potential duplicates in the final array
                  const uniqueNewTerms = newTerms.filter((term, index, self) => 
                    index === self.findIndex(t => t.id === term.id)
                  );
                  
                  return uniqueNewTerms;
                });
                setSelectedTermWithDebug(realTermId);
                setActiveTerm(realTerm);
              } else {
                console.log('Term already exists in list:', existingTerm);
                // Just make sure it's selected if it wasn't already
                if (selectedTerm !== realTermId) {
                  setSelectedTermWithDebug(realTermId);
                  setActiveTerm(existingTerm);
                }
              }
            }
          } else {
            console.log('WARNING: Backend returned empty results array');
          }
          console.log('About to setExamResults with:', data.results || []);
          setExamResultsWithDebug(data.results || []);
          console.log('✅ setExamResults called with', (data.results || []).length, 'results');
          // update student profile info if returned
          if (data.student) {
            console.log('Updating student profile with backend data:', data.student);
            setStudentProfile(prev => ({
              ...(prev || {}),
              firstName: data.student.firstName || prev?.firstName,
              lastName: data.student.lastName || prev?.lastName,
              studentId: data.student.studentId || prev?.studentId,
              className: data.student.class?.name || prev?.className,
            }));
          }
          setError(null);
          console.log('=== BACKEND FETCH SUCCESS ===');
          return;
        } catch (backendErr) {
          console.error('Failed to fetch exam results from backend:', backendErr);
          console.log('Error details:', backendErr);
          
          // If it's a 404 (no results for this term), that's okay - just set empty results
          if (backendErr instanceof Error && backendErr.message.includes('404')) {
            console.log('No exam results found for this term - setting empty results');
            setExamResultsWithDebug([]);
            setError(null);
            return;
          }
        }
      }

      // Fallback: generate mock exam results for demo
      const mockResults = generateMockExamResults();
      console.log('Generated mock exam results:', mockResults);
      setExamResultsWithDebug(mockResults);
      setError(null);
    } catch (err) {
      console.error('Error in fetchExamResults:', err);
      setError('Failed to generate exam results');
    } finally {
      setFetchingTerm(null); // Reset fetching state
    }
  };

  // Helper functions - MOVED ABOVE useMemo to avoid hoisting issues
  const calculateGradePoints = (grade: string): number => {
    const gradeMap: Record<string, number> = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0
    };
    return gradeMap[grade.toUpperCase()] || 0.0;
  };

  const getPerformanceLevel = (averageScore: number): string => {
    if (averageScore >= 80) return "Very Good";
    if (averageScore >= 70) return "Good";
    if (averageScore >= 60) return "Satisfactory";
    if (averageScore >= 50) return "Needs Improvement";
    return "Needs Improvement";
  };

  // Handle term selection change
  const handleTermChange = (termId: string) => {
    // Only proceed if it's actually a different term
    if (termId !== selectedTerm) {
      setSelectedTermWithDebug(termId);
      if (termId) {
        fetchExamResults(termId);
      }
    }
  };

  // Transform exam results for the professional report card
  const transformedResults = React.useMemo(() => {
    try {
      console.log('=== TRANSFORMATION DEBUG ===');
      console.log('examResults:', examResults);
      console.log('examResults.length:', examResults.length);
      console.log('selectedTerm:', selectedTerm);
      console.log('selectedTerm exists:', !!selectedTerm);
      
      if (!examResults.length || !selectedTerm) {
        console.log('❌ TRANSFORMATION BLOCKED - examResults empty:', !examResults.length, 'or no selected term:', !selectedTerm);
        return null;
      }
      
      console.log('✅ TRANSFORMATION PROCEEDING - examResults.length:', examResults.length, 'selectedTerm:', selectedTerm);

      // Get current term info
      const currentTerm = terms.find(t => t.id === selectedTerm);
      console.log('Current term found:', currentTerm);
      
      // Calculate course results
      const courseResults: CourseResult[] = examResults.map((result, index) => {
        console.log(`Processing result ${index}:`, result);
        
        // Backend returns finalPercentage, finalGradeCode, courseName, courseCode
        const percentage = Number.isFinite(result.finalPercentage) ? result.finalPercentage : 
                          (Number.isFinite(result.percentage) ? result.percentage : 
                          (Number.isFinite(result.marksObtained) ? result.marksObtained : 0));
        const grade = result.finalGradeCode || result.grade || 'F';
        const points = calculateGradePoints(grade);
        
        console.log(`Result ${index} processing:`, {
          originalPercentage: result.finalPercentage,
          fallbackPercentage: result.percentage,
          finalPercentage: percentage,
          originalGrade: result.finalGradeCode,
          fallbackGrade: result.grade,
          finalGrade: grade,
          points: points
        });
        
        const courseResult: CourseResult = {
          courseCode: String(result.courseCode || `COURSE${index + 1}`),
          courseName: String(result.courseName || result.subject || result.examTitle || `Course ${index + 1}`),
          finalPercentage: Math.max(0, Math.min(100, Number(percentage) || 0)),
          grade: grade,
          points: Number(points) || 0,
          status: (Number(points) || 0) > 0 ? 'Pass' as const : 'Fail' as const,
          computedAt: new Date(),
        };
        
        console.log(`Final course result ${index}:`, courseResult);
        return courseResult;
      });

      console.log('Transformed course results:', courseResults);

      // Calculate performance summary
      const totalMarks = courseResults.reduce((sum, course) => sum + (Number(course.finalPercentage) || 0), 0);
      const totalPossible = courseResults.length * 100;
      const averageScore = courseResults.length > 0 ? totalMarks / courseResults.length : 0;
      const totalPoints = courseResults.reduce((sum, course) => sum + (Number(course.points) || 0), 0);
      const overallGPA = courseResults.length > 0 ? totalPoints / courseResults.length : 0;
      
      console.log('📊 SUMMARY CALCULATION DEBUG:', {
        courseResultsCount: courseResults.length,
        totalMarks: totalMarks,
        totalPossible: totalPossible,
        averageScore: averageScore,
        totalPoints: totalPoints,
        overallGPA: overallGPA,
        courseResults: courseResults.map(c => ({
          courseCode: c.courseCode,
          finalPercentage: c.finalPercentage,
          points: c.points
        }))
      });
      
      const performanceLevel = getPerformanceLevel(averageScore);
      
      const summary: PerformanceSummary = {
        overallGPA: Number.isFinite(overallGPA) ? overallGPA : 0,
        averageScore: Number.isFinite(averageScore) ? averageScore : 0,
        totalCourses: courseResults.length,
        totalMarks: Math.round(totalMarks),
        totalPossible,
        performance: performanceLevel,
      };

      console.log('📊 FINAL SUMMARY:', summary);

      // Student information
      const studentInfo: StudentInfo = {
        id: user?.id || 'unknown',
        studentId: String(studentProfile?.studentId || user?.username || 'N/A'),
        firstName: String(studentProfile?.firstName || user?.firstName || 'Student'),
        lastName: String(studentProfile?.lastName || user?.lastName || ''),
        className: String(studentProfile?.className || 'Form One'),
        academicYear: activeAcademicYear || currentTerm?.name?.includes('(') ? currentTerm.name.match(/\(([^)]+)\)/)?.[1] || 'Unknown' : 'Unknown',
        term: currentTerm?.name || `Term ${currentTerm?.termNumber || 1}`,
      };

      return {
        student: studentInfo,
        summary,
        courses: courseResults,
      };
    } catch (e) {
      console.error('Failed to transform results:', e);
      return null;
    }
  }, [examResults, selectedTerm, terms, user, studentProfile, activeAcademicYear]);

  const generateStandardTerms = (academicYear?: string): Term[] => {
    // Use the provided academic year from the active calendar
    if (!academicYear) {
      console.error('No academic year provided to generateStandardTerms');
      return [];
    }
    
    const yearToUse = academicYear;
    const [startYear] = yearToUse.split('-').map(y => parseInt(y));
    
    return [
      {
        id: `term-1-${startYear}`,
        name: `Term 1`,
        termNumber: 1,
        startDate: `${startYear}-09-01`,
        endDate: `${startYear}-12-15`,
        isActive: true, // Mark Term 1 as current/active by default
      },
      {
        id: `term-2-${startYear}`, 
        name: `Term 2`,
        termNumber: 2,
        startDate: `${startYear + 1}-01-15`,
        endDate: `${startYear + 1}-04-30`,
        isActive: false,
      },
      {
        id: `term-3-${startYear}`,
        name: `Term 3`,
        termNumber: 3,
        startDate: `${startYear + 1}-05-15`,
        endDate: `${startYear + 1}-08-31`,
        isActive: false,
      },
    ];
  };

  const generateMockExamResults = () => {
    const subjects = [
      { code: 'PE101', name: 'Physical Education Form 1' },
      { code: 'MUSIC101', name: 'Music Form 1' },
      { code: 'MATH101', name: 'Mathematics Form 1' },
      { code: 'ENG101', name: 'English Language Form 1' },
      { code: 'SCI101', name: 'General Science Form 1' },
      { code: 'HIST101', name: 'History Form 1' }
    ];

    return subjects.slice(0, Math.floor(Math.random() * 4) + 2).map((subject, index) => {
      // Generate realistic but varied grades
      let percentage;
      let grade;
      
      if (index === 0) {
        // First subject - lower grade like the example
        percentage = 30 + Math.random() * 25; // 30-55%
        grade = percentage >= 50 ? 'D' : 'F';
      } else if (index === 1) {
        // Second subject - also lower
        percentage = 35 + Math.random() * 25; // 35-60%
        grade = percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';
      } else {
        // Other subjects - better grades
        percentage = 65 + Math.random() * 30; // 65-95%
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 80) grade = 'B';
        else if (percentage >= 70) grade = 'C';
        else if (percentage >= 60) grade = 'D';
        else grade = 'F';
      }

      return {
        courseCode: subject.code,
        subject: subject.name,
        examTitle: subject.name,
        percentage: Math.round(percentage),
        marksObtained: Math.round(percentage),
        grade: grade,
        examType: 'final',
        termId: selectedTerm
      };
    });
  };

  const handlePrint = async () => {
    if (!transformedResults || !transformedResults.courses.length) {
      toast({
        title: 'No results to print',
        description: 'Please select a term with exam results.',
        variant: 'destructive',
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Get school information
    const schoolName = schoolSettings?.schoolName || schoolInfo?.name || "School Name";
    let logoBase64 = '';
    
    console.log('Print debug - School settings:', {
      schoolLogo: schoolSettings?.schoolLogo,
      schoolName: schoolSettings?.schoolName,
      hasSchoolSettings: !!schoolSettings,
      schoolSettingsKeys: schoolSettings ? Object.keys(schoolSettings) : []
    });
    
    // Load logo as base64 if available
    if (schoolSettings?.schoolLogo) {
      const logoUrl = getLogoUrl(schoolSettings.schoolLogo);
      console.log('Print debug - Logo URL constructed:', logoUrl);
      if (logoUrl) {
        try {
          console.log('Print debug - Attempting to load logo from:', logoUrl);
          logoBase64 = await loadImageAsBase64(logoUrl);
          console.log('Print debug - Logo loaded successfully, base64 length:', logoBase64.length);
        } catch (error) {
          console.error('Error loading logo for print:', error);
          console.log('Print debug - Logo loading failed, will use default icon');
        }
      } else {
        console.log('Print debug - logoUrl is null or empty');
      }
    } else {
      console.log('Print debug - No school logo found in settings');
      if (schoolSettings) {
        console.log('Print debug - School settings exist but no logo field:', Object.keys(schoolSettings));
      }
      
      // Try fallback to schoolInfo logoUrl
      if (schoolInfo?.logoUrl) {
        console.log('Print debug - Trying fallback logo from schoolInfo:', schoolInfo.logoUrl);
        try {
          logoBase64 = await loadImageAsBase64(schoolInfo.logoUrl);
          console.log('Print debug - Fallback logo loaded successfully');
        } catch (error) {
          console.error('Print debug - Fallback logo loading failed:', error);
        }
      }
    }

    // Get current term information
    const currentTerm = terms.find(t => t.id === selectedTerm);
    const termName = currentTerm?.name || "Unknown Term";
    const academicYear = activeAcademicYear || transformedResults.student.academicYear || "Unknown"; // Use dynamic academic year

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Academic Report Card - ${transformedResults.student.firstName} ${transformedResults.student.lastName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Times New Roman', Georgia, serif; 
              background: white;
              padding: 20px;
              color: #111827;
              line-height: 1.5;
            }
            .report-card {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 2px solid #111827;
            }
            
            /* Header Section */
            .header {
              text-align: center;
              padding: 40px; /* increased padding to push divider lower */
              border-bottom: 2px solid #111827;
            }
            .school-header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 20px;
              margin-bottom: 20px;
            }
            .school-logo {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #B0B4B3;
            }
            .school-logo img {
              width: 70px;
              height: 70px;
              object-fit: contain;
              border-radius: 50%;
            }
            .school-info {
              text-align: left;
            }
            .school-name {
              font-size: 28px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 8px; /* more space under name */
            }
            .school-motto {
              font-size: 16px;
              font-style: italic;
              color: #6B7280;
              margin-bottom: 6px;
            }
            .report-title {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 20px;
            }
            
            /* Academic Period */
            .academic-period {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              background: #F4F6F8;
              padding: 20px;
              border: 1px solid #B0B4B3;
              margin-bottom: 20px;
            }
            .period-item {
              text-align: center;
            }
            .period-label {
              font-size: 12px;
              font-weight: bold;
              color: #6B7280;
              margin-bottom: 5px;
            }
            .period-value {
              font-size: 14px;
              font-weight: bold;
              color: #111827;
            }
            
            /* Student Details Section */
            .student-section {
              padding: 20px 30px;
              border-bottom: 1px solid #B0B4B3;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .student-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              background: #F4F6F8;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #B0B4B3;
            }
            .student-item {
              display: flex;
              gap: 10px;
            }
            .student-label {
              font-weight: bold;
              color: #6B7280;
              min-width: 100px;
            }
            .student-value {
              color: #111827;
              font-weight: 500;
            }
            
            /* Performance Summary */
            .performance-section {
              padding: 20px 30px;
              border-bottom: 1px solid #B0B4B3;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 15px;
            }
            .summary-card {
              text-align: center;
              padding: 15px;
              border-radius: 8px;
              border: 2px solid #B0B4B3;
            }
            .gpa-card { border-color: #1B88CE; background: #F4F6F8; }
            .score-card { border-color: #7AA45D; background: #F4F6F8; }
            .courses-card { border-color: #6B7280; background: #F4F6F8; }
            .marks-card { border-color: #F5A623; background: #F4F6F8; }
            .performance-card { border-color: #DC2626; background: #F4F6F8; }
            
            .summary-value {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .summary-label {
              font-size: 11px;
              color: #6B7280;
              font-weight: 600;
            }
            
            /* Course Results Table */
            .results-section {
              padding: 20px 30px;
            }
            .results-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              border: 1px solid #B0B4B3;
            }
            .results-table th {
              background: #F4F6F8;
              padding: 12px 8px;
              text-align: center;
              font-weight: bold;
              font-size: 12px;
              color: #111827;
              border: 1px solid #B0B4B3;
            }
            .results-table td {
              padding: 10px 8px;
              border: 1px solid #B0B4B3;
              text-align: center;
              font-size: 14px;
            }
            .results-table tr:nth-child(even) {
              background: #F4F6F8;
            }
            .course-name { text-align: left; font-weight: 500; }
            .course-code { font-family: monospace; color: #6B7280; }
            .percentage { font-weight: bold; }
            
            .grade-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 12px;
              color: white;
            }
            .grade-a { background: #7AA45D; }
            .grade-b { background: #1B88CE; }
            .grade-c { background: #F5A623; }
            .grade-d { background: #F5A623; }
            .grade-f { background: #DC2626; }
            
            .status-badge {
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              color: white;
            }
            .status-pass { background: #7AA45D; }
            .status-fail { background: #DC2626; }
            
            /* Footer */
            .footer {
              padding: 32px 30px; /* increased padding so divider appears lower */
              margin-top: 18px;   /* push footer (and its blue divider) further down */
              text-align: center;
              background: #F4F6F8;
              border-top: 2px solid #111827;
              font-size: 12px;
              color: #6B7280;
              line-height: 1.6;
            }
            .footer-content {
              margin-bottom: 15px;
            }
            .school-about {
              font-weight: bold;
              margin: 10px 0;
              color: #111827;
            }
            .school-contact {
              text-align: left;
              font-size: 11px;
              color: #6B7280;
              margin-top: 8px;
              line-height: 1.6; /* increase line spacing for contact lines */
            }
            .school-contact div { margin-bottom: 6px; }
            
            @media print {
              body { padding: 0; }
              .report-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="report-card">
            <!-- Professional Header -->
            <div class="header">
              <div class="school-header">
                <div class="school-logo">
                  ${logoBase64 ? `<img src="${logoBase64}" alt="${schoolName} Logo">` : '<div style="color: #6B7280; font-size: 24px;">🎓</div>'}
                </div>
                <div class="school-info">
                  <div class="school-name">${schoolName}</div>
                  <div class="school-motto">"${schoolSettings?.schoolAbout || schoolInfo?.about || 'Excellence in Education'}"</div>
                </div>
              </div>
              <div class="report-title">Academic Performance Report</div>
              
              <!-- Academic Period -->
              <div class="academic-period">
                <div class="period-item">
                  <div class="period-label">Academic Year</div>
                  <div class="period-value">${academicYear}</div>
                </div>
                <div class="period-item">
                  <div class="period-label">Academic Term</div>
                  <div class="period-value">${termName}</div>
                </div>
                <div class="period-item">
                  <div class="period-label">Class</div>
                  <div class="period-value">${transformedResults.student.className}</div>
                </div>
                <div class="period-item">
                  <div class="period-label">Report Date</div>
                  <div class="period-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>
            </div>

            <!-- Student Details Section -->
            <div class="student-section">
              <div class="section-title">👤 Student Details</div>
              <div class="student-grid">
                <div class="student-item">
                  <span class="student-label">Full Name:</span>
                  <span class="student-value">${transformedResults.student.firstName} ${transformedResults.student.lastName}</span>
                </div>
                <div class="student-item">
                  <span class="student-label">Student ID:</span>
                  <span class="student-value">${transformedResults.student.studentId}</span>
                </div>
              </div>
            </div>

            <!-- Academic Performance Summary -->
            <div class="performance-section">
              <div class="section-title">📊 Academic Performance Summary</div>
              <div class="summary-grid">
                <div class="summary-card gpa-card">
                  <div class="summary-value" style="color: #1B88CE;">${transformedResults.summary.overallGPA.toFixed(2)}</div>
                  <div class="summary-label">Overall GPA</div>
                </div>
                <div class="summary-card score-card">
                  <div class="summary-value" style="color: #7AA45D;">${Math.round(transformedResults.summary.averageScore)}%</div>
                  <div class="summary-label">Average Score</div>
                </div>
                <div class="summary-card courses-card">
                  <div class="summary-value" style="color: #6B7280;">${transformedResults.summary.totalCourses}</div>
                  <div class="summary-label">Total Courses</div>
                </div>
                <div class="summary-card marks-card">
                  <div class="summary-value" style="color: #F5A623;">${transformedResults.summary.totalMarks}/${transformedResults.summary.totalPossible}</div>
                  <div class="summary-label">Marks Obtained</div>
                </div>
                <div class="summary-card performance-card">
                  <div class="summary-value" style="color: #DC2626; font-size: 16px;">${transformedResults.summary.performance}</div>
                  <div class="summary-label">Performance Level</div>
                </div>
              </div>
            </div>

            <!-- Course Results Table -->
            <div class="results-section">
              <div class="section-title">📚 Detailed Course Results</div>
              <table class="results-table">
                <thead>
                  <tr>
                    <th style="width: 35%;">Course Name</th>
                    <th style="width: 15%;">Code</th>
                    <th style="width: 15%;">Percentage</th>
                    <th style="width: 10%;">Grade</th>
                    <th style="width: 10%;">Points</th>
                    <th style="width: 15%;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${transformedResults.courses.map(course => `
                    <tr>
                      <td class="course-name">${course.courseName}</td>
                      <td class="course-code">${course.courseCode}</td>
                      <td class="percentage">${Math.round(course.finalPercentage)}%</td>
                      <td><span class="grade-badge grade-${(course.grade || 'f').toLowerCase().replace('+', '')}">${course.grade || 'N/A'}</span></td>
                      <td style="font-weight: 600;">${course.points.toFixed(1)}</td>
                      <td><span class="status-badge status-${course.status === 'Pass' ? 'pass' : 'fail'}">${course.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Professional Footer -->
            <div class="footer">
              <div class="footer-content">
                <p><strong>This official academic report card has been generated electronically by the ${schoolName} Management System.</strong></p>
                <p>For verification or any academic inquiries, please contact the school administration office.</p>
                ${schoolSettings?.schoolAbout ? `<div class="school-about">About ${schoolName}: ${schoolSettings.schoolAbout}</div>` : ''}
              </div>
              ${(schoolSettings?.schoolAddress || schoolSettings?.schoolPhone || schoolSettings?.schoolEmail) ? `
              <div class="school-contact">
                ${schoolSettings.schoolAddress ? `<div>📍 ${schoolSettings.schoolAddress}</div>` : ''}
                ${schoolSettings.schoolPhone ? `<div>📞 ${schoolSettings.schoolPhone}</div>` : ''}
                ${schoolSettings.schoolEmail ? `<div>📧 ${schoolSettings.schoolEmail}</div>` : ''}
              </div>` : ''}
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 1000);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
  };

  const handleRefresh = () => {
    if (selectedTerm && !fetchingTerm) {
      fetchExamResults(selectedTerm);
    }
  };


  console.log('StudentGrades render - isLoading:', isLoading, 'error:', error, 'user:', user?.role, 'terms:', terms.length);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exam Results</h1>
          <p className="text-muted-foreground">Loading your academic report...</p>
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
          <p className="mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Term Selection */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exam Results</h1>
          <p className="text-muted-foreground">
            Official academic performance report • Academic Year: {activeAcademicYear || 'Loading...'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedTerm} onValueChange={handleTermChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term, index) => (
                <SelectItem key={`${term.id}-${index}`} value={term.id}>
                  {term.name || `Term ${term.termNumber || term.id}`}
                  {term.isActive && ' (Current)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading || !selectedTerm || !!fetchingTerm}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${fetchingTerm ? 'animate-spin' : ''}`} />
            {fetchingTerm ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Professional Report Card */}
      {transformedResults && schoolInfo ? (
        <ErrorBoundary
          fallback={
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Failed to render report card</h3>
                  <p className="text-sm text-muted-foreground">We hit an issue showing the formatted report. Below is a basic view you can use meanwhile.</p>
                </div>
                <div className="mt-6 space-y-2">
                  <div className="text-sm font-medium">Summary</div>
                  <div className="text-sm text-muted-foreground">
                    GPA: {Number(transformedResults.summary.overallGPA).toFixed(2)} • Avg: {Math.round(Number(transformedResults.summary.averageScore))}% • Courses: {transformedResults.summary.totalCourses}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Courses</div>
                  <ul className="text-sm list-disc pl-5">
                    {transformedResults.courses.map(c => (
                      <li key={c.courseCode}>{c.courseName}: {Math.round(c.finalPercentage)}% ({c.grade})</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          }
        >
          <ProfessionalReportCard
            school={schoolInfo}
            student={transformedResults.student}
            summary={transformedResults.summary}
            courses={transformedResults.courses}
            onPrint={handlePrint}
            className="print:shadow-none"
          />
        </ErrorBoundary>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mx-auto">
                <Printer className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No Results Available</h3>
                <p className="text-muted-foreground">
                  {selectedTerm 
                    ? 'Exam results for this term are not yet available. Please check back later or contact your teacher.' 
                    : 'Please select a term to view your exam results.'
                  }
                </p>
              </div>
              {selectedTerm && (
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Results
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}