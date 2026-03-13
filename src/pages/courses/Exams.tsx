import React from 'react';
import { Search, FileText, CheckCircle, Clock, BookOpen, Filter, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { termService } from '@/services/termService';
import { COLORS } from '@/lib/colors';

// Import the custom hook
import { useExamManagement } from '@/hooks/useExamManagement';
import { SearchBar } from "@/components/ui/search-bar";

interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
}

export default function Exams() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  
  // Use the custom hook for all exam management logic
  const {
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
  } = useExamManagement();

  // Local state for term-level actions
  const [enterExamLoading, setEnterExamLoading] = React.useState(false);
  const [enteredExam, setEnteredExam] = React.useState(false);
  // Local immediate input state to debounce into `searchPeriod`
  const [searchInput, setSearchInput] = React.useState('');

  const handleEnterExamPeriod = async () => {
    if (!selectedTerm) return;
    try {
      setEnterExamLoading(true);
      await termService.enterExamPeriod(selectedTerm, token!);
      setEnteredExam(true);
    } catch (e:any) {
      console.error(e);
    } finally {
      setEnterExamLoading(false);
    }
  };

  // Calculate statistics
  const totalExams = exams.length;
  const administeredExams = exams.filter(exam => exam.status === 'administered').length;
  const gradedExams = exams.filter(exam => exam.status === 'graded').length;
  const upcomingExams = exams.filter(exam => exam.status === 'upcoming').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-transparent dark:border dark:border-border dark:text-foreground">Upcoming</Badge>;
      case 'administered':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-transparent dark:border dark:border-border dark:text-foreground">Administered</Badge>;
      case 'graded':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-transparent dark:border dark:border-border dark:text-green-300">Graded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Navigate to exam details
  const handleViewDetails = (examId: string) => {
    navigate(`/exams/${examId}`);
  };

  // Show loading state for initial load
  if (isInitialLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading exam management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: isDarkMode ? COLORS.white : COLORS.black }}>Exam Management</h1>
          <p style={{ color: isDarkMode ? COLORS.neutral : COLORS.grey }}>Manage and monitor all examinations</p>
        </div>
        <Button
          variant="outline"
          onClick={refreshData}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="text-destructive font-medium">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card style={{ backgroundColor: isDarkMode ? COLORS.black : COLORS.white, borderColor: COLORS.neutral }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: COLORS.grey }}>Total Exams</CardTitle>
            <FileText className="h-4 w-4" style={{ color: COLORS.primary }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: isDarkMode ? COLORS.white : COLORS.black }}>{totalExams}</div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: isDarkMode ? COLORS.black : COLORS.white, borderColor: COLORS.neutral }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: COLORS.grey }}>Administered</CardTitle>
            <Clock className="h-4 w-4" style={{ color: COLORS.accent }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: isDarkMode ? COLORS.white : COLORS.black }}>{administeredExams}</div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: isDarkMode ? COLORS.black : COLORS.white, borderColor: COLORS.neutral }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: COLORS.grey }}>Graded Exams</CardTitle>
            <CheckCircle className="h-4 w-4" style={{ color: COLORS.secondary }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: isDarkMode ? COLORS.white : COLORS.black }}>{gradedExams}</div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: isDarkMode ? COLORS.black : COLORS.white, borderColor: COLORS.neutral }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: COLORS.grey }}>Upcoming</CardTitle>
            <BookOpen className="h-4 w-4" style={{ color: COLORS.primary }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: isDarkMode ? COLORS.white : COLORS.black }}>{upcomingExams}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filter Exams</CardTitle>
            {isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {selectedTerm && (
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnterExamPeriod}
                  disabled={enterExamLoading || enteredExam}
                >
                  {enterExamLoading ? 'Processing...' : enteredExam ? 'Exam Period Active' : 'Enter Exam Period'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                onDebouncedChange={setSearchPeriod}
                delay={300}
                placeholder="Search exams..."
                inputClassName="pl-8"
                className="w-full"
              />
            </div>
            
            <Select 
              value={selectedClass} 
              onValueChange={setSelectedClass} 
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id === 'all' ? 'All Classes' : cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedTeacher} 
              onValueChange={setSelectedTeacher} 
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.userId} value={`${teacher.firstName} ${teacher.lastName}`}>
                    {teacher.firstName} {teacher.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedTerm} 
              onValueChange={setSelectedTerm} 
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((t, index) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} {index === 0 ? '(Current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={resetFilters} 
              className="w-full" 
              disabled={isLoading}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exams List</CardTitle>
            <div className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${exams.length} exam${exams.length !== 1 ? 's' : ''} found`}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Loading exams...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : exams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">No exams found</span>
                        <span className="text-sm text-muted-foreground">
                          {searchPeriod || selectedClass !== 'All Classes' || selectedTeacher !== 'All Teachers' || !selectedTerm
                            ? 'Try adjusting your filters or search criteria'
                            : 'No exams have been created yet'
                          }
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  exams.map((exam) => (
                    <TableRow key={exam.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {exam.class?.name || 'Unknown Class'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {(() => {
                            const t: any = (exam as any).term || (exam as any).Term;
                            const id = (exam as any).termId || (exam as any).TermId;
                            const raw = (t && t.name) || '';
                            const numFromName = typeof raw === 'string' ? raw.match(/\d+/)?.[0] : undefined;
                            const num = (t && (t.termNumber || t.period?.order)) || (numFromName ? parseInt(numFromName) : undefined);
                            return num ? `Term ${num}` : (raw || 'Term');
                          })()}
                        </Badge>
                      </TableCell>
                      <TableCell>{`${exam.teacher.firstName} ${exam.teacher.lastName}`}</TableCell>
                      <TableCell>
                        {exam.date ? new Date(exam.date).toLocaleDateString() : 'Not scheduled'}
                      </TableCell>
                      <TableCell>{exam.duration || 'N/A'}</TableCell>
                      <TableCell>{exam.totalMarks}</TableCell>
                      <TableCell>{getStatusBadge(exam.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(exam.id)}
                          className="text-primary hover:text-primary/80"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}