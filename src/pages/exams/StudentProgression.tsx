import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  GraduationCap, 
  Settings, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  ArrowUp,
  Eye,
  Play,
  BookOpen,
  Calendar,
  Undo
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { API_CONFIG } from '@/config/api';
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from '@tanstack/react-query';

interface ProgressionStatistics {
  total: number;
  promote: number;
  graduate: number;
  retain: number;
  issues: number;
  percentages: {
    promote: number;
    graduate: number;
    retain: number;
    issues: number;
  };
}

interface ClassBreakdown {
  className: string;
  total: number;
  promote: number;
  retain: number;
  graduate: number;
}

interface ProgressionApiResponse {
  success: boolean;
  message: string;
  isProgressionPeriod: boolean;
  progressionPeriod?: string;
  term?: string;
  currentTerm?: string;
  progressionMode?: string;
  passThreshold?: number;
  executed?: boolean;
  statistics?: ProgressionStatistics;
  breakdown?: {
    byClass: ClassBreakdown[];
  };
}

interface ProgressionSettings {
  automaticPromotion: boolean;
  promotionCriteria: {
    requirePassingGrades: boolean;
    minimumGPA: number;
    requiredSubjects: string[];
    allowPartialPromotion: boolean;
  };
  graduationCriteria: {
    requireAllSubjects: boolean;
    minimumOverallGPA: number;
    requiredCredits: number;
  };
}

interface SchoolSettings {
  passThreshold: number;
  progressionMode: 'automatic' | 'exam_based';
}

export default function StudentProgression() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(false);
  const [progressionData, setProgressionData] = useState<ProgressionApiResponse | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    passThreshold: 50,
    progressionMode: 'automatic'
  });
  const [settings, setSettings] = useState<ProgressionSettings>({
    automaticPromotion: true,
    promotionCriteria: {
      requirePassingGrades: false,
      minimumGPA: 2.0,
      requiredSubjects: [],
      allowPartialPromotion: true
    },
    graduationCriteria: {
      requireAllSubjects: true,
      minimumOverallGPA: 2.5,
      requiredCredits: 120
    }
  });
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);

  const fetchProgressionHistory = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/settings/student-promotion/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch progression history');
      }
      const result = await response.json();
      setExecutionHistory(Array.isArray(result?.history) ? result.history : []);
    } catch (error) {
      console.error('Error fetching progression history:', error);
      setExecutionHistory([]);
    }
  };

  // Check authentication
  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [token, user, navigate]);

  // Fetch school settings including pass threshold and progression mode
  const fetchSchoolSettings = async () => {
    try {
      // Fetch progression settings
      const progressionResponse = await fetch(`${API_CONFIG.BASE_URL}/settings/progression-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (progressionResponse.ok) {
        const progressionData = await progressionResponse.json();
        if (progressionData.success && progressionData.settings) {
          setSchoolSettings(prev => ({
            ...prev,
            progressionMode: progressionData.settings.progressionMode || 'automatic',
            passThreshold: progressionData.settings.passThreshold || 50
          }));
        }
      }

      // Fetch default schemes for additional settings if needed
      const schemesResponse = await fetch(`${API_CONFIG.BASE_URL}/aggregation/default-schemes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (schemesResponse.ok) {
        const schemesData = await schemesResponse.json();
        const schemes = Array.isArray(schemesData) ? schemesData : [];
        if (schemes.length > 0) {
          const scheme = schemes[0];
          setSchoolSettings(prev => ({
            ...prev,
            passThreshold: scheme.passThreshold || prev.passThreshold
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching school settings:', error);
    }
  };

  // Save progression settings
  const saveProgressionSettings = async (progressionMode: 'automatic' | 'exam_based') => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/settings/progression-settings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ progressionMode }),
      });

      if (response.ok) {
        setSchoolSettings(prev => ({
          ...prev,
          progressionMode
        }));
        toast({
          title: "Success",
          description: `Progression mode set to ${progressionMode === 'automatic' ? 'Automatic' : 'Exam-Based'}.`,
        });
        // Refresh preview data to reflect new settings
        fetchProgressionPreview();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving progression settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save progression settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch progression preview
  const fetchProgressionPreview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/settings/student-promotion/preview`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch progression preview');
      }

      const result = await response.json();
      setProgressionData(result);

      if (!result.success || !result.isProgressionPeriod) {
        toast({
          variant: "destructive",
          title: "Progression Not Available",
          description: result.message || "Student progression is only available during Term 3.",
        });
      }
    } catch (error) {
      console.error('Error fetching progression preview:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load progression preview. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Execute student progression
  const executeProgression = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/settings/student-promotion/execute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error('Failed to execute progression');
      }

      const result = await response.json();
      setExecutionResult(result);

      // If backend reports a non-success result (e.g., already executed), show an informative notification and ensure notifications center updates
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Progression Already Completed",
          description: `${result.message || 'Student progression was not executed'}${result.progressionPeriod ? ` — ${result.progressionPeriod}` : ''}${result.term ? ` (${result.term})` : ''}`,
        });
        // Refresh notifications (server will have created a notification)
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
        // Refresh preview
        await fetchProgressionPreview();
        await fetchProgressionHistory();
        return;
      }

      toast({
        title: "Success",
        description: `Student progression completed successfully for ${result.progressionPeriod} (${result.term}). ${result.promoted || 0} students promoted, ${result.graduated || 0} students graduated.`,
      });

      // Refresh notifications / counts so the bell icon reflects the new notification
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });

      // Refresh preview after execution
      await fetchProgressionPreview();
      await fetchProgressionHistory();
    } catch (error) {
      console.error('Error executing progression:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to execute progression. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Revert student progression
  const revertProgression = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to revert student progression? This will move all students back to their previous classes and cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/settings/student-promotion/revert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to revert progression');
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `Student progression reverted successfully. ${result.reverted || 0} students moved back to previous classes.`,
      });

      // Refresh preview after revert
      await fetchProgressionPreview();
      await fetchProgressionHistory();
    } catch (error) {
      console.error('Error reverting progression:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to revert progression. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchProgressionPreview();
    fetchSchoolSettings();
    fetchProgressionHistory();
  }, []);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Progression</h1>
          <p className="text-muted-foreground">
            Manage student promotions and academic progression settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchProgressionPreview} 
            variant="outline" 
            disabled={loading}
          >
            <Eye className="mr-2 h-4 w-4" />
            Refresh Statistics
          </Button>
          <Button 
            onClick={executeProgression} 
            disabled={loading || !progressionData?.isProgressionPeriod || progressionData?.executed}
          >
            <Play className="mr-2 h-4 w-4" />
            {progressionData?.executed ? 'Progression Already Executed' : 'Execute Progression'}
          </Button>
          {progressionData?.executed && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  disabled={loading}
                >
                  <Undo className="mr-2 h-4 w-4" />
                  Revert Progression
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to revert student progression?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will move all students back to their previous classes and undo all promotions and graduations that occurred during this progression execution. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={revertProgression} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Revert Progression
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="preview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preview">Progression Statistics</TabsTrigger>
          <TabsTrigger value="settings">Progression Settings</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Progression Statistics
                {progressionData?.currentTerm && (
                  <Badge variant="outline" className="ml-2">
                    {progressionData.currentTerm}
                  </Badge>
                )}
                {progressionData?.progressionPeriod && (
                  <Badge variant="secondary" className="ml-1">
                    {progressionData.progressionPeriod}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Overview of student progression statistics for the current academic year.
                {progressionData?.progressionMode === 'exam_based' && progressionData?.passThreshold && (
                  <span className="block mt-1 font-medium">
                    Pass Threshold: {progressionData.passThreshold}% (Students below this threshold will be retained)
                  </span>
                )}
                {progressionData?.progressionMode === 'automatic' && (
                  <span className="block mt-1 font-medium text-green-600">
                    All students will automatically advance regardless of exam results.
                  </span>
                )}
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !progressionData || !progressionData.isProgressionPeriod ? (
                <Alert>
                  {progressionData?.executed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Calendar className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {progressionData?.executed ? 'Progression Already Completed' : 'Progression Not Available'}
                  </AlertTitle>
                  <AlertDescription>
                    {progressionData?.executed ? (
                      <span>
                        Student progression has already been executed for this academic year.
                        {progressionData?.progressionPeriod && (
                          <span className="block mt-2">
                            Executed during: <strong>{progressionData.progressionPeriod}</strong>
                          </span>
                        )}
                        {progressionData?.term && (
                          <span className="block">
                            Term: <strong>{progressionData.term}</strong>
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>
                        {progressionData?.message || "Student progression is only available during Term 3 or Term 3 holiday."}
                        {progressionData?.progressionPeriod && (
                          <span className="block mt-2">
                            Period: <strong>{progressionData.progressionPeriod}</strong>
                          </span>
                        )}
                        {progressionData?.term && (
                          <span className="block">
                            Term: <strong>{progressionData.term}</strong>
                          </span>
                        )}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {/* Overall Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Total Students</p>
                            <p className="text-2xl font-bold">
                              {progressionData.statistics?.total || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">To Promote</p>
                            <p className="text-2xl font-bold">
                              {progressionData.statistics?.promote || 0}
                            </p>
                            <p className="text-xs text-green-600">
                              ({progressionData.statistics?.percentages.promote || 0}%)
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">To Graduate</p>
                            <p className="text-2xl font-bold">
                              {progressionData.statistics?.graduate || 0}
                            </p>
                            <p className="text-xs text-green-600">
                              ({progressionData.statistics?.percentages.graduate || 0}%)
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">To Retain</p>
                            <p className="text-2xl font-bold">
                              {progressionData.statistics?.retain || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ({progressionData.statistics?.percentages.retain || 0}%)
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Class Breakdown */}
                  {progressionData.breakdown?.byClass && progressionData.breakdown.byClass.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Breakdown by Class</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Distribution of promotions, graduations, and retentions by class level.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Class</TableHead>
                              <TableHead>Total Students</TableHead>
                              <TableHead>Promote</TableHead>
                              <TableHead>Graduate</TableHead>
                              <TableHead>Retain</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {progressionData.breakdown.byClass.map((classData) => (
                              <TableRow key={classData.className}>
                                <TableCell className="font-medium">
                                  {classData.className}
                                </TableCell>
                                <TableCell>{classData.total}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{classData.promote}</span>
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                                      {classData.total > 0 ? Math.round((classData.promote / classData.total) * 100) : 0}%
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{classData.graduate}</span>
                                    {classData.graduate > 0 && (
                                      <Badge variant="outline" className="text-xs border-green-200 text-green-800">
                                        {Math.round((classData.graduate / classData.total) * 100)}%
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{classData.retain}</span>
                                    {classData.retain > 0 && (
                                      <Badge variant="destructive" className="text-xs">
                                        {Math.round((classData.retain / classData.total) * 100)}%
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Progression Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure how student progression works in your school.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progression Mode Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Progression Mode</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Automatic Progression</Label>
                      <p className="text-sm text-muted-foreground">
                        All students automatically move to the next class regardless of exam results
                      </p>
                    </div>
                    <Switch
                      checked={schoolSettings.progressionMode === 'automatic'}
                      onCheckedChange={(checked) => {
                        const newMode = checked ? 'automatic' : 'exam_based';
                        saveProgressionSettings(newMode);
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Exam-Based Progression</Label>
                      <p className="text-sm text-muted-foreground">
                        Students must pass exams to advance (based on school pass threshold)
                      </p>
                    </div>
                    <Switch
                      checked={schoolSettings.progressionMode === 'exam_based'}
                      onCheckedChange={(checked) => {
                        const newMode = checked ? 'exam_based' : 'automatic';
                        saveProgressionSettings(newMode);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Pass Threshold Configuration */}
              {schoolSettings.progressionMode === 'exam_based' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Pass Threshold</h3>
                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center gap-4">
                      <Label htmlFor="pass-threshold" className="text-base font-medium">
                        School Pass Threshold (%):
                      </Label>
                      <Input
                        id="pass-threshold"
                        type="number"
                        value={schoolSettings.passThreshold}
                        min={0}
                        max={100}
                        onChange={(e) => {
                          setSchoolSettings(prev => ({
                            ...prev,
                            passThreshold: Number(e.target.value)
                          }));
                        }}
                        className="w-24"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Students need to score at least {schoolSettings.passThreshold}% to pass and advance to the next class.
                      This threshold is used across all courses in your school.
                    </p>
                  </div>
                </div>
              )}

              {/* Current Configuration Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Current Configuration Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Progression Mode</p>
                          <p className="text-sm text-muted-foreground">
                            {schoolSettings.progressionMode === 'automatic' 
                              ? 'Automatic promotion for all students'
                              : 'Exam-based promotion with pass requirements'
                            }
                          </p>
                        </div>
                        <Badge variant={schoolSettings.progressionMode === 'automatic' ? 'secondary' : 'default'}>
                          {schoolSettings.progressionMode === 'automatic' ? 'Automatic' : 'Exam-Based'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Pass Threshold</p>
                          <p className="text-sm text-muted-foreground">
                            {schoolSettings.progressionMode === 'exam_based' 
                              ? `Students need ${schoolSettings.passThreshold}% to advance`
                              : 'Not applicable (automatic mode)'
                            }
                          </p>
                        </div>
                        <Badge variant="outline">
                          {schoolSettings.passThreshold}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Execution History
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View the history of student progression executions.
              </p>
            </CardHeader>
            <CardContent>
              {executionHistory && executionHistory.length > 0 ? (
                <>
                  {/* Most recent execution summary */}
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Last Execution Result</AlertTitle>
                    <AlertDescription>
                      Promoted: {executionHistory[0].promoted || 0} students, 
                      Graduated: {executionHistory[0].graduated || 0} students,
                      Errors: {executionHistory[0].errors || 0}
                    </AlertDescription>
                  </Alert>

                  {/* Execution history list */}
                  <div className="mt-4 space-y-3">
                    {executionHistory.map((h: any) => (
                      <div key={h.id} className="flex justify-between items-center p-3 border rounded-md">
                        <div>
                          <div className="font-medium">{new Date(h.date).toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{h.progressionPeriod}{h.term ? ` — ${h.term}` : ''}</div>
                          {h.note && <div className="text-xs text-muted-foreground mt-1">{h.note}</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Promoted: <strong>{h.promoted || 0}</strong></div>
                          <div className="text-sm">Graduated: <strong>{h.graduated || 0}</strong></div>
                          <div className="text-sm">Errors: <strong>{h.errors || 0}</strong></div>
                          <div className="mt-2">
                            <Badge variant={h.status === 'Completed' ? 'secondary' : 'destructive'}>
                              {h.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Recent Executions</AlertTitle>
                  <AlertDescription>
                    Student progression has not been executed yet in this session.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
