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

export type Term = {
  id: string;
  name: string;
  order: number;
};

export type AcademicYearTerm = {
  id?: string;
  termId: string;
  termName: string;
  academicCalendarId: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

export default function AcademicAndTermsSection() {
  const { toast } = useToast();
  const { token } = useAuth();

  // State
  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>([]);
  const [activeAcademicCalendar, setActiveAcademicCalendar] = useState<AcademicCalendar | null>(null);
  const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState<AcademicCalendar>({
    academicYear: "",
    startDate: null,
    endDate: null,
    isActive: false,
  });

  const [availableTerms, setAvailableTerms] = useState<Term[]>([]);
  const [academicYearTerms, setAcademicYearTerms] = useState<AcademicYearTerm[]>([]);
  const [currentTerm, setCurrentTerm] = useState<AcademicYearTerm>({
    termId: "",
    termName: "",
    academicCalendarId: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });

  const [loading, setLoading] = useState({
    academic: false,
    term: false,
    fetching: false,
    activating: false,
  });

  const [showNewCalendarForm, setShowNewCalendarForm] = useState(false);
  const [showNewTermForm, setShowNewTermForm] = useState(false);

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
  const fetchAvailableTerms = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/terms/available`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setAvailableTerms(data);
    } catch (error) {
      console.error("Failed to fetch available terms:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available terms",
        variant: "destructive",
      });
    }
  };

  const fetchAcademicYearTerms = async (academicCalendarId: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/settings/terms?academicCalendarId=${academicCalendarId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setAcademicYearTerms(Array.isArray(data) ? data : []);

      const current = data.find((t: AcademicYearTerm) => t.isCurrent) || {};
      setCurrentTerm({
        id: current.id || "",
        termId: current.termId || "",
        termName: current.termName || "",
        academicCalendarId: current.academicCalendarId || "",
        startDate: current.startDate || "",
        endDate: current.endDate || "",
        isCurrent: current.isCurrent || false,
      });
    } catch (error) {
      console.error("Failed to fetch academic year terms:", error);
      toast({
        title: "Error",
        description: "Failed to fetch academic year terms",
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
        academicYear: "",
        startDate: null,
        endDate: null,
        isActive: false,
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

  const onSaveTerm = async () => {
    setLoading((prev) => ({ ...prev, term: true }));
    try {
      if (!currentTerm.termId) {
        throw new Error("Please select a term");
      }

      const payload = {
        termId: currentTerm.termId,
        startDate: currentTerm.startDate,
        endDate: currentTerm.endDate,
        isCurrent: currentTerm.isCurrent || false,
      };

      const res = await fetch(`${API_BASE}/settings/terms/academic-year`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create term");
      }

      toast({
        title: "Success",
        description: "Term created successfully",
      });

      if (selectedAcademicCalendar.id) {
        await fetchAcademicYearTerms(selectedAcademicCalendar.id);
      }
      setShowNewTermForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create term",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, term: false }));
    }
  };

  // Effects
  useEffect(() => {
    fetchAcademicData();
    fetchAvailableTerms();
  }, []);

  useEffect(() => {
    if (selectedAcademicCalendar.id) {
      fetchAcademicYearTerms(selectedAcademicCalendar.id);
    }
  }, [selectedAcademicCalendar.id]);

  return (
    <div className="space-y-6">
      {/* Active Academic Calendar Section */}
      <div className="space-y-4 border p-4 rounded-lg bg-green-50">
        <h3 className="font-medium text-green-800">Active Academic Calendar</h3>
        {activeAcademicCalendar ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-green-700">Academic Year</Label>
              <Input
                value={activeAcademicCalendar.academicYear}
                readOnly
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-green-700">Start Date</Label>
              <Input
                value={formatDateForDisplay(activeAcademicCalendar.startDate)}
                readOnly
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-green-700">End Date</Label>
              <Input
                value={formatDateForDisplay(activeAcademicCalendar.endDate)}
                readOnly
                className="bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              No active academic calendar set. Please activate one from the list below.
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
                  academicYear: "",
                  startDate: null,
                  endDate: null,
                  isActive: false,
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
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  value={selectedAcademicCalendar.academicYear}
                  onChange={(e) =>
                    setSelectedAcademicCalendar({
                      ...selectedAcademicCalendar,
                      academicYear: e.target.value,
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
                disabled={loading.academic || !selectedAcademicCalendar.academicYear}
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
                          {calendar.academicYear}{" "}
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
                      value={selectedAcademicCalendar.academicYear}
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
                            {calendar.academicYear}
                          </TableCell>
                          <TableCell>{formatDateForDisplay(calendar.startDate)}</TableCell>
                          <TableCell>{formatDateForDisplay(calendar.endDate)}</TableCell>
                          <TableCell>
                            {calendar.id === activeAcademicCalendar?.id ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                Inactive
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {calendar.id !== activeAcademicCalendar?.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => calendar.id && onActivateAcademicCalendar(calendar.id)}
                                  disabled={loading.activating || !calendar.id}
                                >
                                  {loading.activating ? "Activating..." : "Activate"}
                                </Button>
                              )}
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
                        academicYear: "",
                        startDate: null,
                        endDate: null,
                        isActive: false,
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
            <span>Academic Year: </span>
            <span className="font-medium">
              {selectedAcademicCalendar.academicYear || "Not selected"}
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
            {academicYearTerms.length > 0 && (
              <div className="space-y-2">
                <Label>Select Term</Label>
                <Select
                  value={currentTerm.id || ""}
                  onValueChange={(value) => {
                    const term = academicYearTerms.find((t) => t.id === value);
                    if (term) {
                      setCurrentTerm(term);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a term to view/edit" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearTerms.map((term) => (
                      <SelectItem key={term.id} value={term.id || ""}>
                        {term.termName} ({formatDateForDisplay(term.startDate)} -{" "}
                        {formatDateForDisplay(term.endDate)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="mt-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Create New Term</h3>
                {!showNewTermForm && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentTerm({
                        termId: availableTerms[0]?.id || "",
                        termName: availableTerms[0]?.name || "",
                        academicCalendarId: selectedAcademicCalendar.id || "",
                        startDate: "",
                        endDate: "",
                        isCurrent: false,
                      });
                      setShowNewTermForm(true);
                    }}
                    disabled={academicYearTerms.length >= availableTerms.length}
                  >
                    Create Term
                  </Button>
                )}
              </div>

              {showNewTermForm && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Term</Label>
                      <Select
                        value={currentTerm.termId}
                        onValueChange={(value) => {
                          const term = availableTerms.find(
                            (t) => t.id === value
                          );
                          setCurrentTerm({
                            ...currentTerm,
                            termId: value,
                            termName: term?.name || "",
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTerms.map((term) => (
                            <SelectItem
                              key={term.id}
                              value={term.id}
                              disabled={academicYearTerms.some(
                                (t) => t.termId === term.id
                              )}
                            >
                              {term.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={currentTerm.startDate}
                        onChange={(e) =>
                          setCurrentTerm({
                            ...currentTerm,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={currentTerm.endDate}
                        onChange={(e) =>
                          setCurrentTerm({
                            ...currentTerm,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isCurrent"
                      checked={currentTerm.isCurrent}
                      onCheckedChange={(checked) =>
                        setCurrentTerm({
                          ...currentTerm,
                          isCurrent: Boolean(checked),
                        })
                      }
                    />
                    <Label htmlFor="isCurrent">Set as current term</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewTermForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={onSaveTerm} 
                      disabled={loading.term || !currentTerm.termId || !currentTerm.startDate || !currentTerm.endDate}
                    >
                      {loading.term ? "Saving..." : "Save Term"}
                    </Button>
                  </div>
                </div>
              )}

              {academicYearTerms.length > 0 && (
                <div className="space-y-2 mt-6">
                  <Label>
                    Terms in {selectedAcademicCalendar.academicYear}
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
                      {academicYearTerms.map((term) => (
                        <TableRow key={term.id}>
                          <TableCell>{term.termName}</TableCell>
                          <TableCell>{formatDateForDisplay(term.startDate)}</TableCell>
                          <TableCell>{formatDateForDisplay(term.endDate)}</TableCell>
                          <TableCell>
                            {term.isCurrent ? (
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCurrentTerm(term);
                                  setShowNewTermForm(true);
                                }}
                              >
                                Edit
                              </Button>
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
            Please select an academic calendar to manage terms
          </p>
        )}
      </div>
    </div>
  );
}