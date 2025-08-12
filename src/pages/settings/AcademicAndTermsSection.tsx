import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SchoolInfoSection from "./SchoolInfoSection";

export type AcademicCalendar = {
  id?: string;
  academicYear: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
};

const API_BASE = 'http://localhost:5000/api/v1';

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

type SchoolSettings = {
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  schoolAbout: string;
};

export default function SchoolAcademicSection() {
  const { toast } = useToast();
  const { token } = useAuth();
  
  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>([]);
  const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState<AcademicCalendar>({
    academicYear: "",
    startDate: "",
    endDate: "",
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
  
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    schoolName: "",
    schoolEmail: "",
    schoolPhone: "",
    schoolAddress: "",
    schoolAbout: "",
  });

  const [loading, setLoading] = useState({
    academic: false,
    term: false,
    school: false,
    fetching: false,
  });

  const [showNewCalendarForm, setShowNewCalendarForm] = useState(false);
  const [showNewTermForm, setShowNewTermForm] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchAcademicData();
    fetchAvailableTerms();
  }, []);

  // Fetch terms when academic calendar changes
  useEffect(() => {
    if (selectedAcademicCalendar.id) {
      fetchAcademicYearTerms(selectedAcademicCalendar.id);
    }
  }, [selectedAcademicCalendar.id]);

  const fetchAvailableTerms = async () => {
    // Using static options per latest API; backend will map name/order
    setAvailableTerms([
      { id: 'term-1', name: 'Term 1', order: 1 },
      { id: 'term-2', name: 'Term 2', order: 2 },
      { id: 'term-3', name: 'Term 3', order: 3 },
    ] as any);
  };

  const fetchAcademicYearTerms = async (academicCalendarId: string) => {
    try {
      const res = await fetch(`${API_BASE}/settings/terms?academicCalendarId=${academicCalendarId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const data = await res.json();
      setAcademicYearTerms(Array.isArray(data) ? data : []);
      
      // Set current term if available
      const current = data.find((t: AcademicYearTerm) => t.isCurrent) || {};
      setCurrentTerm({
        id: current.id,
        termId: current.termId || "",
        termName: current.termName || "",
        academicCalendarId: current.academicCalendarId || "",
        startDate: current.startDate || "",
        endDate: current.endDate || "",
        isCurrent: current.isCurrent || false,
      });
    } catch (error) {
      console.error('Failed to fetch academic year terms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch academic year terms",
        variant: "destructive",
      });
    }
  };

  const fetchSchoolData = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSchoolSettings({
        schoolName: data.schoolName || "",
        schoolEmail: data.schoolEmail || "",
        schoolPhone: data.schoolPhone || "",
        schoolAddress: data.schoolAddress || "",
        schoolAbout: data.schoolAbout || "",
      });
    } catch (error) {
      console.error('Failed to fetch school settings:', error);
    }
  };

  const fetchAcademicData = async () => {
    setLoading(prev => ({ ...prev, fetching: true }));
    try {
      const res = await fetch(`${API_BASE}/settings/academic-calendar`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const data = await res.json();
      const calendars = Array.isArray(data) ? data : [];
      
      setAcademicCalendars(calendars);
      
      // Find and set the active calendar
      const activeCalendar = calendars.find(c => c.isActive) || calendars[0] || {
        academicYear: "",
        startDate: "",
        endDate: "",
        isActive: false,
      };
      
      setSelectedAcademicCalendar(activeCalendar);
      
    } catch (error) {
      console.error('Failed to fetch academic calendars:', error);
      toast({
        title: "Error",
        description: "Failed to fetch academic calendars",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }
  };

  const handleSchoolChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSchoolSettings(prev => ({ ...prev, [id]: value }));
  };

  const onSaveSchool = async () => {
    setLoading(prev => ({ ...prev, school: true }));
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(schoolSettings),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({
        title: "Success",
        description: "School information updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update school information",
        variant: "destructive",
      });
      console.error('Error updating school settings:', error);
    } finally {
      setLoading(prev => ({ ...prev, school: false }));
    }
  };

  const onSaveAcademic = async () => {
    setLoading(prev => ({ ...prev, academic: true }));
    try {
      const res = await fetch(`${API_BASE}/settings/academic-calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      
      // Refresh the list
      await fetchAcademicData();
      setShowNewCalendarForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save academic calendar",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, academic: false }));
    }
  };


  const onSaveTerm = async () => {
    setLoading(prev => ({ ...prev, term: true }));
    try {
      let url = `${API_BASE}/settings/terms`;
      let method = 'POST';
      
      if (currentTerm.id) {
        url = `${url}/${currentTerm.id}`;
        method = 'PATCH';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: currentTerm.termName,
          order: (availableTerms.find(t => t.name === currentTerm.termName)?.order) || 1,
          startDate: currentTerm.startDate,
          endDate: currentTerm.endDate,
          academicCalendarId: selectedAcademicCalendar.id,
        }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      toast({
        title: "Success",
        description: "Term settings updated successfully",
      });
      
      // Refresh the terms list
      if (selectedAcademicCalendar.id) {
        await fetchAcademicYearTerms(selectedAcademicCalendar.id);
      }
      setShowNewTermForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update term settings",
        variant: "destructive",
      });
      console.error('Error updating term settings:', error);
    } finally {
      setLoading(prev => ({ ...prev, term: false }));
    }
  };


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Settings</CardTitle>
        <CardDescription>Configure school-wide settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                    startDate: "",
                    endDate: "",
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
                    onChange={(e) => setSelectedAcademicCalendar({ 
                      ...selectedAcademicCalendar, 
                      academicYear: e.target.value 
                    })}
                    placeholder="Enter in YYYY-YYYY format (e.g., 2025-2026)"
                    pattern="\d{4}-\d{4}"
                  />
                  <p className="text-xs text-muted-foreground">Format: YYYY-YYYY (e.g., 2025-2026)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date (Optional)</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={selectedAcademicCalendar.startDate || ""}
                    onChange={(e) => setSelectedAcademicCalendar({ 
                      ...selectedAcademicCalendar, 
                      startDate: e.target.value 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={selectedAcademicCalendar.endDate || ""}
                    onChange={(e) => setSelectedAcademicCalendar({ 
                      ...selectedAcademicCalendar, 
                      endDate: e.target.value 
                    })}
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
                <Button onClick={onSaveAcademic} disabled={loading.academic}>
                  {loading.academic ? "Saving..." : "Save Academic Calendar"}
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
                        const selected = academicCalendars.find(c => c.id === value);
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
                            {calendar.academicYear} {calendar.isActive ? "(Active)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        type="date"
                        value={selectedAcademicCalendar.startDate || ""}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={selectedAcademicCalendar.endDate || ""}
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
                          startDate: "",
                          endDate: "",
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
                  <p className="text-muted-foreground">No academic calendars found</p>
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

        {/* Term Settings Section */}
        <div className="space-y-4 border p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Term Management</h3>
            <p className="text-sm text-muted-foreground">
              Academic Year: {selectedAcademicCalendar.academicYear || "Not selected"}
            </p>
          </div>

          {selectedAcademicCalendar.id ? (
            <>
              {/* Terms List */}
              <div className="space-y-2">
                <Label>Terms in {selectedAcademicCalendar.academicYear}</Label>
                {academicYearTerms.length > 0 ? (
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
                      {academicYearTerms.map(term => (
                        <TableRow key={term.id}>
                          <TableCell>{term.termName}</TableCell>
                          <TableCell>{formatDate(term.startDate)}</TableCell>
                          <TableCell>{formatDate(term.endDate)}</TableCell>
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
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No terms found for this academic year</p>
                  </div>
                )}
              </div>

              {/* Term Form */}
              {(showNewTermForm || academicYearTerms.length === 0) && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <h4 className="font-medium">
                    {currentTerm.id ? `Editing ${currentTerm.termName}` : 'Create New Term'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Term</Label>
                      <Select
                        value={currentTerm.termId}
                        onValueChange={(value) => {
                          const term = availableTerms.find(t => t.id === value);
                          setCurrentTerm({ 
                            ...currentTerm, 
                            termId: value,
                            termName: term?.name || ""
                          });
                        }}
                        disabled={!!currentTerm.id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTerms.map(term => (
                            <SelectItem 
                              key={term.id} 
                              value={term.id}
                              disabled={academicYearTerms.some(t => t.termId === term.id && t.id !== currentTerm.id)}
                            >
                              {term.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="termStartDate">Start Date</Label>
                      <Input
                        id="termStartDate"
                        type="date"
                        value={currentTerm.startDate || ""}
                        onChange={(e) => setCurrentTerm({ 
                          ...currentTerm, 
                          startDate: e.target.value 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="termEndDate">End Date</Label>
                      <Input
                        id="termEndDate"
                        type="date"
                        value={currentTerm.endDate || ""}
                        onChange={(e) => setCurrentTerm({ 
                          ...currentTerm, 
                          endDate: e.target.value 
                        })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowNewTermForm(false);
                          setCurrentTerm({
                            termId: "",
                            termName: "",
                            academicCalendarId: "",
                            startDate: "",
                            endDate: "",
                            isCurrent: false,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={onSaveTerm} disabled={loading.term}>
                        {loading.term ? "Saving..." : "Save Term"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!showNewTermForm && academicYearTerms.length > 0 && (
                <div className="flex justify-end">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setCurrentTerm({
                        termId: "",
                        termName: "",
                        academicCalendarId: selectedAcademicCalendar.id || "",
                        startDate: "",
                        endDate: "",
                        isCurrent: false,
                      });
                      setShowNewTermForm(true);
                    }}
                    disabled={academicYearTerms.length >= availableTerms.length}
                  >
                    Create New Term
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                Please select an academic calendar to manage terms
              </p>
            </div>
          )}
        </div>

        {/* School Information Section */}
        {/* Moved into its own component to keep code modular while preserving the same layout */}
        {/* It will be rendered in-place below to keep visuals identical */}
        {/* @ts-ignore - component exists */}
        <SchoolInfoSection />
      </CardContent>
    </Card>
  );
}