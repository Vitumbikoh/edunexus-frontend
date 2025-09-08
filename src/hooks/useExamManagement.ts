import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '@/config/api';

// Import services
import { classService, Class } from '@/services/classService';
import { termService, Term } from '@/services/termService';
import { examService, Exam, ExamFilters } from '@/services/examService';

interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
}

interface UseExamManagementReturn {
  // Data
  exams: Exam[];
  classes: Class[];
  teachers: Teacher[];
  terms: Term[];
  
  // Loading states
  isLoading: boolean;
  isInitialLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Filter state
  searchPeriod: string;
  selectedClass: string;
  selectedTeacher: string;
  selectedTerm: string;
  
  // Actions
  setSearchPeriod: (period: string) => void;
  setSelectedClass: (classId: string) => void;
  setSelectedTeacher: (teacher: string) => void;
  setSelectedTerm: (yearId: string) => void;
  resetFilters: () => void;
  refreshData: () => void;
}

export const useExamManagement = (): UseExamManagementReturn => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Data state
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  
  // Loading and error state
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [searchPeriod, setSearchPeriod] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedTeacher, setSelectedTeacher] = useState('All Teachers');
  const [selectedTerm, setSelectedTerm] = useState('');

  // Helper to display consistent Term labels (Term 1, Term 2, Term 3)
  const normalizeTermLabel = (name?: string, order?: number) => {
    const raw = (name || '').trim();
    const num = raw.match(/\d+/)?.[0];
    if (num) return `Term ${num}`;
    if (/period|term/i.test(raw)) {
      return raw.replace(/period/gi, 'Term').replace(/term/gi, 'Term');
    }
    if (typeof order === 'number' && !Number.isNaN(order)) return `Term ${order}`;
    return raw || 'Term';
  };

  // Fetch teachers separately as it might use a different endpoint
  const fetchTeachers = async (authToken: string): Promise<Teacher[]> => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/teacher/teachers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch teachers: ${response.status}`);
      }

      const data = await response.json();
      return data.teachers?.map((teacher: any) => ({
        id: teacher.id,
        userId: teacher.userId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
      })) || [];
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  };

  // Fetch all initial data (classes, terms from active academic calendar, teachers)
  const fetchInitialData = useCallback(async () => {
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to access this page.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch classes directly like the Classes page does
      const classResponse = await fetch('http://localhost:5000/api/v1/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let fetchedClasses = [];
      if (classResponse.ok) {
        const classData = await classResponse.json();
        console.log('Raw classes from API:', classData);
        fetchedClasses = Array.isArray(classData) ? classData : [];
        console.log('Processed classes array:', fetchedClasses);
      } else {
        console.error('Class fetch failed:', classResponse.status, classResponse.statusText);
        const errorText = await classResponse.text().catch(() => 'No error details');
        console.error('Class fetch error details:', errorText);
      }

  // Fetch teachers
      const teachersData = await fetchTeachers(token);

      // Set the data
      const allClassesOption = { id: 'all', name: 'All Classes' };
      setClasses([allClassesOption, ...fetchedClasses]);
      console.log('Classes set - Total classes loaded:', fetchedClasses.length);
      console.log('Classes with "All" option:', [allClassesOption, ...fetchedClasses]);

      // If no classes loaded, show warning
      if (fetchedClasses.length === 0) {
        console.warn('No classes were loaded from the API');
        toast({
          title: 'Warning',
          description: 'No classes found. Please check if classes exist in the system.',
          variant: 'destructive',
        });
      }

      // Populate terms dropdown from real Terms endpoint to ensure IDs match backend filtering
      try {
        // Get current active term id (for default selection)
        let currentTermId: string | undefined;
        try {
          const currRes = await fetch(`${API_CONFIG.BASE_URL}/analytics/current-term`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (currRes.ok) {
            const curr = await currRes.json();
            currentTermId = curr?.id || curr?.termId || curr?.currentTerm?.id;
          }
        } catch {}

        // Fetch actual Term instances
        const realTerms = await termService.getTerms(token);
        let termOptions: Term[] = realTerms.map((t: any) => ({
          id: t.id,
          name: normalizeTermLabel(t.periodName, t.termNumber),
          isCurrent: Boolean(t.isCurrent || t.current || t.isActive),
        }));
        // Sort with current first, then by numeric order in name
        termOptions.sort((a: any, b: any) => {
          if (a.isCurrent && !b.isCurrent) return -1;
          if (!a.isCurrent && b.isCurrent) return 1;
          const an = Number(a.name.match(/\d+/)?.[0] || 0);
          const bn = Number(b.name.match(/\d+/)?.[0] || 0);
          return an - bn;
        });
        setTerms(termOptions);
        const defaultTermId = currentTermId || termOptions.find(t => (t as any).isCurrent)?.id || termOptions[0]?.id;
        setSelectedTerm(defaultTermId || '');
      } catch (e) {
        setTerms([]);
        setSelectedTerm('');
      }

      // Set teachers
      const allTeachersOption = { 
        id: 'all', 
        userId: 'all', 
        firstName: 'All', 
        lastName: 'Teachers' 
      };
      setTeachers([allTeachersOption, ...teachersData]);

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch initial data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      if (errorMessage.includes('Unauthorized')) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [token, navigate, toast]);

  // Fetch exams with filters
  const fetchExams = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

  const filters: ExamFilters = {};

      // Apply filters
      if (searchPeriod.trim()) {
        filters.searchPeriod = searchPeriod.trim();
      }

      if (selectedClass !== 'All Classes' && selectedClass !== 'all') {
        // Derive class name for backend filter (expects 'class' = class name)
        const cls = classes.find(c => c.id === selectedClass);
        if (cls?.name) {
          filters.className = cls.name;
        } else {
          // Fallback: still pass classId for potential future support
          filters.classId = selectedClass;
        }
      }

      if (selectedTeacher !== 'All Teachers') {
        const teacher = teachers.find((t) => `${t.firstName} ${t.lastName}` === selectedTeacher);
        if (teacher && teacher.userId !== 'all') {
          filters.teacherId = teacher.userId;
        }
      }

      if (selectedTerm && selectedTerm !== 'all') {
        filters.termId = selectedTerm;
      }

      console.log('Fetching exams with filters:', filters);
      
      const examsData = await examService.getExams(token, filters);
      console.log('Raw exams from API:', examsData.length);
      
      // Additional client-side filtering as fallback
      let filteredExams = examsData;
      
      // Client-side class filtering if server-side didn't work
      if (selectedClass !== 'All Classes' && selectedClass !== 'all' && selectedClass) {
        filteredExams = filteredExams.filter(exam => {
          return exam.classId === selectedClass || exam.class?.id === selectedClass;
        });
      }
      
      setExams(filteredExams);

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch exams';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      if (errorMessage.includes('Unauthorized')) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, searchPeriod, selectedClass, selectedTeacher, selectedTerm, teachers, toast, navigate]);

  // Reset filters
  const resetFilters = useCallback(() => {
    console.log('Resetting filters');
    setSearchPeriod('');
    setSelectedClass('All Classes');
    setSelectedTeacher('All Teachers');
  // Reset to the first term (which should be current)
    if (terms.length > 0) {
      setSelectedTerm(terms[0].id);
    }
  }, [terms]);

  // Refresh all data
  const refreshData = useCallback(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Initialize data on component mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch exams when filters change
  useEffect(() => {
    // Only fetch exams if we have the initial data loaded and token exists
    if (!isInitialLoading && token) {
      fetchExams();
    }
  }, [fetchExams, isInitialLoading, token]);

  return {
    // Data
    exams,
    classes,
    teachers,
    terms,
    
    // Loading states
    isLoading,
    isInitialLoading,
    
    // Error state
    error,
    
    // Filter state
    searchPeriod,
    selectedClass,
    selectedTeacher,
    selectedTerm,
    
    // Actions
    setSearchPeriod,
    setSelectedClass,
    setSelectedTeacher,
    setSelectedTerm,
    resetFilters,
    refreshData,
  };
};
