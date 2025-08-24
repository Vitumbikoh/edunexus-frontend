import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

// Import services
import { classService, Class } from '@/services/classService';
import { academicYearService, AcademicYear } from '@/services/academicYearService';
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
  academicYears: AcademicYear[];
  
  // Loading states
  isLoading: boolean;
  isInitialLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Filter state
  searchTerm: string;
  selectedClass: string;
  selectedTeacher: string;
  selectedAcademicYear: string;
  
  // Actions
  setSearchTerm: (term: string) => void;
  setSelectedClass: (classId: string) => void;
  setSelectedTeacher: (teacher: string) => void;
  setSelectedAcademicYear: (yearId: string) => void;
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
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  
  // Loading and error state
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedTeacher, setSelectedTeacher] = useState('All Teachers');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('All Years');

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

  // Fetch all initial data (classes, academic years, teachers)
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

      // Fetch academic years and get ONLY the active one by default
      const yearResponse = await fetch('http://localhost:5000/api/v1/settings/academic-years', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let activeYear = null;
      let allYears = [];
      if (yearResponse.ok) {
        const yearData = await yearResponse.json();
        console.log('Raw academic years from API:', yearData);
        allYears = Array.isArray(yearData) ? yearData : (yearData.academicYears || []);
        
        // Find the active year
        activeYear = allYears.find(year => year.isActive || year.isCurrent || year.current);
        if (!activeYear && allYears.length > 0) {
          activeYear = allYears[0]; // Fallback to first year
        }
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

      // Set academic years - show active year by default, but allow selection of others
      if (activeYear) {
        setAcademicYears([activeYear, ...allYears.filter(y => y.id !== activeYear.id)]);
        setSelectedAcademicYear(activeYear.id);
        console.log('Active academic year set:', activeYear.name);
      } else {
        const allYearsOption = { id: 'all', name: 'All Years' };
        setAcademicYears([allYearsOption, ...allYears]);
        console.log('No active year found, showing all years');
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
      if (searchTerm.trim()) {
        filters.searchTerm = searchTerm.trim();
      }

      if (selectedClass !== 'All Classes' && selectedClass !== 'all') {
        filters.classId = selectedClass;
      }

      if (selectedTeacher !== 'All Teachers') {
        const teacher = teachers.find((t) => `${t.firstName} ${t.lastName}` === selectedTeacher);
        if (teacher && teacher.userId !== 'all') {
          filters.teacherId = teacher.userId;
        }
      }

      if (selectedAcademicYear !== 'All Years' && selectedAcademicYear !== 'all' && selectedAcademicYear) {
        filters.academicYearId = selectedAcademicYear;
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
  }, [token, searchTerm, selectedClass, selectedTeacher, selectedAcademicYear, teachers, toast, navigate]);

  // Reset filters
  const resetFilters = useCallback(() => {
    console.log('Resetting filters');
    setSearchTerm('');
    setSelectedClass('All Classes');
    setSelectedTeacher('All Teachers');
    // Reset to the first academic year (which should be active) instead of "All Years"
    if (academicYears.length > 0) {
      setSelectedAcademicYear(academicYears[0].id);
    }
  }, [academicYears]);

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
    academicYears,
    
    // Loading states
    isLoading,
    isInitialLoading,
    
    // Error state
    error,
    
    // Filter state
    searchTerm,
    selectedClass,
    selectedTeacher,
    selectedAcademicYear,
    
    // Actions
    setSearchTerm,
    setSelectedClass,
    setSelectedTeacher,
    setSelectedAcademicYear,
    resetFilters,
    refreshData,
  };
};
