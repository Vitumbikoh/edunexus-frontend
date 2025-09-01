import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

import { API_CONFIG } from '@/config/api';
import { academicCalendarService, AcademicCalendar as ServiceAcademicCalendar } from '@/services/academicCalendarService';

const API_BASE = API_CONFIG.BASE_URL;

// Type definitions
export type AcademicCalendar = ServiceAcademicCalendar;

export type Period = {
  id: string;
  name: string;
  order: number;
};

export type TermPeriod = {
  id?: string;
  periodId: string;
  periodName: string;
  academicCalendarId: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isCompleted?: boolean;
};

export default function AcademicAndPeriodsSection() {
  const { toast } = useToast();
  const { token } = useAuth();

  // State
  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>([]);
  const [activeAcademicCalendar, setActiveAcademicCalendar] = useState<AcademicCalendar | null>(null);
  const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState<AcademicCalendar>({
    term: "",
    startDate: null,
    endDate: null,
    isActive: false,
  isCompleted: false,
  });

  const [availablePeriods, setAvailablePeriods] = useState<Period[]>([]);
  const [termPeriods, setTermPeriods] = useState<TermPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<TermPeriod>({
    periodId: "",
    periodName: "",
    academicCalendarId: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    isCompleted: false,
  });

  const [loading, setLoading] = useState({
    academic: false,
    period: false,
    fetching: false,
    activating: false,
    closing: false,
    activatingPeriod: false,
    completingTerm: false,
  });

  const [showNewCalendarForm, setShowNewCalendarForm] = useState(false);
  const [showNewPeriodForm, setShowNewPeriodForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<TermPeriod | null>(null);

  // Helper functions
  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateString?: string | null) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // API calls
  const fetchAvailablePeriods = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/periods/available`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setAvailablePeriods(data);
    } catch (error) {
      console.error("Failed to fetch available periods:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available periods",
        variant: "destructive",
      });
    }
  };

  const fetchTermPeriods = async (academicCalendarId: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/settings/periods/term?academicCalendarId=${academicCalendarId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setTermPeriods(Array.isArray(data) ? data : []);

      const current = data.find((t: TermPeriod) => t.isCurrent) || {};
      setCurrentPeriod({
        id: current.id || "",
        periodId: current.periodId || "",
        periodName: current.periodName || "",
        academicCalendarId: current.academicCalendarId || "",
        startDate: current.startDate || "",
        endDate: current.endDate || "",
        isCurrent: current.isCurrent || false,
        isCompleted: current.isCompleted || false,
      });
    } catch (error) {
      console.error("Failed to fetch term periods:", error);
      toast({
        title: "Error",
        description: "Failed to fetch term periods",
        variant: "destructive",
      });
    }
  };

  const fetchAcademicData = async () => {
    setLoading((prev) => ({ ...prev, fetching: true }));
    try {
      // Fetch all academic calendars
      const calendars = await academicCalendarService.getAcademicCalendars(token!);
      setAcademicCalendars(calendars);

      // Fetch active academic calendar (handle potential errors gracefully)
      let activeCalendar: AcademicCalendar | null = null;
      try {
        activeCalendar = await academicCalendarService.getActiveAcademicCalendar(token!);
      } catch (error) {
        console.warn("Failed to fetch active academic calendar:", error);
        // Continue without active calendar
      }
      setActiveAcademicCalendar(activeCalendar);

      // Set selected calendar to active one or first available
      const defaultCalendar = activeCalendar || calendars[0] || {
        term: "",
        startDate: null,
        endDate: null,
        isActive: false,
  isCompleted: false,
      };

      setSelectedAcademicCalendar(defaultCalendar);
    } catch (error) {
      console.error("Failed to fetch academic calendars:", error);
      toast({
        title: "Error",
        description: "Failed to fetch academic calendars",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, fetching: false }));
    }
  };

  const onSaveAcademic = async () => {
    setLoading((prev) => ({ ...prev, academic: true }));
    try {
      await academicCalendarService.createAcademicCalendar(selectedAcademicCalendar, token!);

      toast({
        title: "Success",
        description: "Academic calendar saved successfully",
      });

      await fetchAcademicData();
      setShowNewCalendarForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save academic calendar",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, academic: false }));
    }
  };

  const onActivateAcademicCalendar = async (calendarId: string) => {
    setLoading((prev) => ({ ...prev, activating: true }));
    try {
      await academicCalendarService.setActiveAcademicCalendar(calendarId, token!);

      toast({
        title: "Success",
        description: "Academic calendar activated successfully",
      });

      await fetchAcademicData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate academic calendar",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, activating: false }));
    }
  };

  const onCloseAcademicCalendar = async (calendarId: string) => {
    setLoading((prev) => ({ ...prev, closing: true }));
    try {
      await academicCalendarService.closeAcademicCalendar(calendarId, token!);

      toast({
        title: "Success",
        description: "Academic calendar closed successfully",
      });

      await fetchAcademicData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to close academic calendar",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, closing: false }));
    }
  };

  const onSavePeriod = async () => {
    setLoading((prev) => ({ ...prev, period: true }));
    try {
      if (!currentPeriod.periodId) {
        throw new Error("Please select a period");
      }

      if (!selectedAcademicCalendar.id) {
        throw new Error("Please select an academic calendar");
      }

      const payload = {
        periodId: currentPeriod.periodId,
        academicCalendarId: selectedAcademicCalendar.id,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
        isCurrent: currentPeriod.isCurrent || false,
      };

      let res;
      if (editingPeriod && editingPeriod.id) {
        // Update existing period
        res = await fetch(`${API_BASE}/settings/periods/term/${editingPeriod.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new period
        res = await fetch(`${API_BASE}/settings/periods/term`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${editingPeriod ? 'update' : 'create'} period`);
      }

      toast({
        title: "Success",
        description: `Period ${editingPeriod ? 'updated' : 'created'} successfully`,
      });

      if (selectedAcademicCalendar.id) {
        await fetchTermPeriods(selectedAcademicCalendar.id);
      }
      setShowNewPeriodForm(false);
      setEditingPeriod(null);
      resetCurrentPeriod();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save period",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, period: false }));
    }
  };

  const onActivatePeriod = async (periodId: string) => {
    setLoading((prev) => ({ ...prev, activatingPeriod: true }));
    try {
      const res = await fetch(`${API_BASE}/settings/periods/term/${periodId}/activate`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to activate period");
      }

      toast({
        title: "Success",
        description: "Period activated successfully",
      });

      if (selectedAcademicCalendar.id) {
        await fetchTermPeriods(selectedAcademicCalendar.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate period",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, activatingPeriod: false }));
    }
  };

  const onCompleteTerm = async (termId: string) => {
    setLoading((prev) => ({ ...prev, completingTerm: true }));
    try {
      const res = await fetch(`${API_BASE}/settings/periods/term/${termId}/complete`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to complete term");
      }

      toast({
        title: "Success",
        description: "Term completed successfully",
      });

      // Refresh periods
      if (selectedAcademicCalendar.id) {
        await fetchTermPeriods(selectedAcademicCalendar.id);
      }

      // After refresh, auto-activate the next available term (first non-completed, non-current)
      setTermPeriods((prev) => {
        const updated = [...prev];
        const hasCurrent = updated.some(p => p.isCurrent && !p.isCompleted);
        if (hasCurrent) return updated; // another term already active after refresh
        // pick next term by order in list that is not completed
        const next = updated.find(p => !p.isCompleted);
        if (next && next.id) {
          // fire and forget activation
          onActivatePeriod(next.id);
        }
        return updated;
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete term",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, completingTerm: false }));
    }
  };

  const resetCurrentPeriod = () => {
    setCurrentPeriod({
      periodId: "",
      periodName: "",
      academicCalendarId: selectedAcademicCalendar.id || "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      isCompleted: false,
    });
  };

  const handleEditPeriod = (period: TermPeriod) => {
    setEditingPeriod(period);
    setCurrentPeriod({
      ...period,
      startDate: formatDateForInput(period.startDate),
      endDate: formatDateForInput(period.endDate),
    });
    setShowNewPeriodForm(true);
  };

  const handleCreateNewPeriod = () => {
    setEditingPeriod(null);
    setCurrentPeriod({
      periodId: availablePeriods[0]?.id || "",
      periodName: availablePeriods[0]?.name || "",
      academicCalendarId: selectedAcademicCalendar.id || "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      isCompleted: false,
    });
    setShowNewPeriodForm(true);
  };

  const handleCancelPeriodForm = () => {
    setShowNewPeriodForm(false);
    setEditingPeriod(null);
    resetCurrentPeriod();
  };

  // Effects
  useEffect(() => {
    fetchAcademicData();
    fetchAvailablePeriods();
  }, []);

  useEffect(() => {
    if (selectedAcademicCalendar.id) {
      fetchTermPeriods(selectedAcademicCalendar.id);
    }
  }, [selectedAcademicCalendar.id]);

  return (
    <div className="space-y-6">
      {/* Active Academic Calendar Section */}
      <div className="space-y-4 border p-4 rounded-lg bg-gradient-to-r from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Active Academic Calendar
          </h3>
        </div>
        {activeAcademicCalendar ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Academic Year</Label>
              <Input
                value={activeAcademicCalendar.term}
                readOnly
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</Label>
              <Input
                value={formatDateForDisplay(activeAcademicCalendar.startDate)}
                readOnly
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</Label>
              <Input
                value={formatDateForDisplay(activeAcademicCalendar.endDate)}
                readOnly
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              No active academic calendar set
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Please activate one from the list below.
            </p>
          </div>
        )}
      </div>

      {/* Academic Calendar Section */}
      <div className="space-y-4 border p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Academic Calendar</h3>
          {!showNewCalendarForm && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAcademicCalendar({
                  term: "",
                  startDate: null,
                  endDate: null,
                  isActive: false,
                  isCompleted: false,
                });
                setShowNewCalendarForm(true);
              }}
            >
              New Academic Calendar
            </Button>
          )}
        </div>

        {showNewCalendarForm ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="term">Academic Year</Label>
                <Input
                  id="term"
                  value={selectedAcademicCalendar.term}
                  onChange={(e) =>
                    setSelectedAcademicCalendar({
                      ...selectedAcademicCalendar,
                      term: e.target.value,
                    })
                  }
                  placeholder="YYYY-YYYY (e.g., 2025-2026)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formatDateForInput(selectedAcademicCalendar.startDate)}
                  onChange={(e) =>
                    setSelectedAcademicCalendar({
                      ...selectedAcademicCalendar,
                      startDate: e.target.value || null,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formatDateForInput(selectedAcademicCalendar.endDate)}
                  onChange={(e) =>
                    setSelectedAcademicCalendar({
                      ...selectedAcademicCalendar,
                      endDate: e.target.value || null,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewCalendarForm(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={onSaveAcademic} 
                disabled={loading.academic || !selectedAcademicCalendar.term}
              >
                {loading.academic ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {academicCalendars.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Academic Calendar</Label>
                  <Select
                    value={selectedAcademicCalendar.id || ""}
                    onValueChange={(value) => {
                      const selected = academicCalendars.find(
                        (c) => c.id === value
                      );
                      if (selected) {
                        setSelectedAcademicCalendar(selected);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicCalendars.map((calendar) => (
                        <SelectItem key={calendar.id} value={calendar.id || ""}>
                          {calendar.term}{" "}
                          {calendar.id === activeAcademicCalendar?.id ? "(Active)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Input
                      value={selectedAcademicCalendar.term}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      value={formatDateForDisplay(selectedAcademicCalendar.startDate)}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      value={formatDateForDisplay(selectedAcademicCalendar.endDate)}
                      readOnly
                    />
                  </div>
                </div>

                {/* Academic Calendar List with Activation */}
                <div className="space-y-2 mt-6">
                  <Label>All Academic Calendars</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academicCalendars.map((calendar) => (
                        <TableRow key={calendar.id}>
                          <TableCell className="font-medium">
                            {calendar.term}
                          </TableCell>
                          <TableCell>{formatDateForDisplay(calendar.startDate)}</TableCell>
                          <TableCell>{formatDateForDisplay(calendar.endDate)}</TableCell>
                          <TableCell>
                            {calendar.id === activeAcademicCalendar?.id ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Active
                              </span>
                            ) : calendar.isCompleted ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Completed
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                Inactive
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {calendar.id === activeAcademicCalendar?.id && !calendar.isCompleted ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={loading.closing || !calendar.id}
                                    >
                                      {loading.closing ? "Closing..." : "Close"}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Close Academic Calendar</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to close the academic calendar "{calendar.term}"? 
                                        This action cannot be undone and will mark the calendar as completed.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => calendar.id && onCloseAcademicCalendar(calendar.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Close Calendar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : calendar.id !== activeAcademicCalendar?.id && !calendar.isCompleted && !activeAcademicCalendar ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => calendar.id && onActivateAcademicCalendar(calendar.id)}
                                  disabled={loading.activating || !calendar.id}
                                >
                                  {loading.activating ? "Activating..." : "Activate"}
                                </Button>
                              ) : calendar.isCompleted ? (
                                <span className="text-sm text-muted-foreground italic">
                                  This academic calendar was completed
                                </span>
                              ) : calendar.id !== activeAcademicCalendar?.id && activeAcademicCalendar && !calendar.isCompleted ? (
                                <span className="text-sm text-muted-foreground">
                                  Cannot activate while another calendar is active
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewCalendarForm(true);
                      setSelectedAcademicCalendar({
                        term: "",
                        startDate: null,
                        endDate: null,
                        isActive: false,
                        isCompleted: false,
                      });
                    }}
                  >
                    New Academic Calendar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  No academic calendars found
                </p>
                <Button
                  className="mt-2"
                  onClick={() => setShowNewCalendarForm(true)}
                >
                  Create First Academic Calendar
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Term Management Section */}
      <div className="space-y-4 border p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Term Management</h3>
          <div className="text-sm text-muted-foreground">
            <span>Academic Calendar: </span>
            <span className="font-medium">
              {selectedAcademicCalendar.term || "Not selected"}
            </span>
            {selectedAcademicCalendar.id === activeAcademicCalendar?.id && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Active
              </span>
            )}
          </div>
        </div>

        {selectedAcademicCalendar.id ? (
          <>
            {termPeriods.length > 0 && (
              <div className="space-y-2">
                <Label>Select Period</Label>
                <Select
                  value={currentPeriod.id || ""}
                  onValueChange={(value) => {
                    const period = termPeriods.find((t) => t.id === value);
                    if (period) {
                      setCurrentPeriod(period);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a period to view/edit" />
                  </SelectTrigger>
                  <SelectContent>
                    {termPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id || ""}>
                        {period.periodName} ({formatDateForDisplay(period.startDate)} -{" "}
                        {formatDateForDisplay(period.endDate)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="mt-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">
                  {editingPeriod ? "Edit Term" : "Create New Term"}
                </h3>
                {!showNewPeriodForm && (
                  <Button
                    variant="outline"
                    onClick={handleCreateNewPeriod}
                    disabled={!editingPeriod && termPeriods.length >= availablePeriods.length}
                  >
                    Create Term
                  </Button>
                )}
              </div>

              {showNewPeriodForm && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Select Period</Label>
                      <Select
                        value={currentPeriod.periodId}
                        onValueChange={(value) => {
                          const period = availablePeriods.find(
                            (t) => t.id === value
                          );
                          setCurrentPeriod({
                            ...currentPeriod,
                            periodId: value,
                            periodName: period?.name || "",
                          });
                        }}
                        disabled={!!editingPeriod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePeriods.map((period) => (
                            <SelectItem
                              key={period.id}
                              value={period.id}
                              disabled={!editingPeriod && termPeriods.some(
                                (t) => t.periodId === period.id
                              )}
                            >
                              {period.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={currentPeriod.startDate}
                        onChange={(e) =>
                          setCurrentPeriod({
                            ...currentPeriod,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={currentPeriod.endDate}
                        onChange={(e) =>
                          setCurrentPeriod({
                            ...currentPeriod,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  {!editingPeriod && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isCurrent"
                        checked={currentPeriod.isCurrent}
                        onCheckedChange={(checked) =>
                          setCurrentPeriod({
                            ...currentPeriod,
                            isCurrent: Boolean(checked),
                          })
                        }
                      />
                      <Label htmlFor="isCurrent">Set as current term</Label>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelPeriodForm}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={onSavePeriod} 
                      disabled={loading.period || !currentPeriod.periodId || !currentPeriod.startDate || !currentPeriod.endDate}
                    >
                      {loading.period ? "Saving..." : editingPeriod ? "Update Term" : "Save Term"}
                    </Button>
                  </div>
                </div>
              )}

              {termPeriods.length > 0 && (
                <div className="space-y-2 mt-6">
                  <Label>
                    Terms in {selectedAcademicCalendar.term}
                  </Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Term</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {termPeriods.map((period) => (
                        <TableRow key={period.id}>
                          <TableCell>{period.periodName}</TableCell>
                          <TableCell>{formatDateForDisplay(period.startDate)}</TableCell>
                          <TableCell>{formatDateForDisplay(period.endDate)}</TableCell>
                          <TableCell>
                            {period.isCompleted ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Completed
                              </span>
                            ) : period.isCurrent ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Current
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                Inactive
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {!period.isCompleted && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPeriod(period)}
                                >
                                  Edit
                                </Button>
                              )}
                              {/* Show Activate only if no other current term exists */}
                              {!period.isCurrent && !period.isCompleted && !termPeriods.some(p => p.isCurrent && !p.isCompleted) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => period.id && onActivatePeriod(period.id)}
                                  disabled={loading.activatingPeriod || !period.id}
                                >
                                  {loading.activatingPeriod ? "Activating..." : "Activate"}
                                </Button>
                              )}
                              {!period.isCurrent && !period.isCompleted && termPeriods.some(p => p.isCurrent && !p.isCompleted) && (
                                <span className="text-xs text-muted-foreground px-2 py-1">Another term is active</span>
                              )}
                              {period.isCurrent && !period.isCompleted && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={loading.completingTerm || !period.id}
                                    >
                                      {loading.completingTerm ? "Completing..." : "Complete Term"}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Complete Term</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to complete the term "{period.periodName}"? 
                                        This action cannot be undone and will mark the term as completed.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => period.id && onCompleteTerm(period.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Complete Term
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              {period.isCompleted && (
                                <span className="text-sm text-muted-foreground">
                                  No actions available
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">
            Please select an academic calendar to manage periods
          </p>
        )}
      </div>
    </div>
  );
}