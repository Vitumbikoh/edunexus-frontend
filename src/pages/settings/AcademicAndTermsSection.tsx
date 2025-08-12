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

const API_BASE = "http://localhost:5000/api/v1";

// Type definitions
export type AcademicCalendar = {
  id?: string;
  academicYear: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
};

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

export default function SchoolAcademicSection() {
  const { toast } = useToast();
  const { token } = useAuth();

  // State
  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>([]);
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
      const res = await fetch(`${API_BASE}/settings/academic-calendars`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const calendars = Array.isArray(data) ? data : [];

      setAcademicCalendars(calendars);

      const activeCalendar = calendars.find((c) => c.isActive) || calendars[0] || {
        academicYear: "",
        startDate: null,
        endDate: null,
        isActive: false,
      };

      setSelectedAcademicCalendar(activeCalendar);
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
      const res = await fetch(`${API_BASE}/settings/academic-calendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          academicYear: selectedAcademicCalendar.academicYear,
          startDate: selectedAcademicCalendar.startDate || undefined,
          endDate: selectedAcademicCalendar.endDate || undefined,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      toast({
        title: "Success",
        description: "Academic calendar saved successfully",
      });

      await fetchAcademicData();
      setShowNewCalendarForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save academic calendar",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, academic: false }));
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
                          {calendar.isActive ? "(Active)" : ""}
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
          <p className="text-sm text-muted-foreground">
            Academic Year:{" "}
            {selectedAcademicCalendar.academicYear || "Not selected"}
          </p>
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