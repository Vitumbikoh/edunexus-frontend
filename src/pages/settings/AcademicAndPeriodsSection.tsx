import React, { useState, useEffect } from "react";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { API_CONFIG } from '@/config/api';
import { academicCalendarService, AcademicCalendar as ServiceAcademicCalendar } from '@/services/academicCalendarService';

const API_BASE = API_CONFIG.BASE_URL;

// Types
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
  order?: number; // Added for sequential ordering
};

export type TermHoliday = {
  id?: string;
  name: string;
  termId: string; // equals TermPeriod.id
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isCompleted?: boolean;
};

export default function AcademicAndPeriodsSection() {
  const { toast } = useToast();
  const { token } = useAuth();

  // Academic calendar state
  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>([]);
  const [activeAcademicCalendar, setActiveAcademicCalendar] = useState<AcademicCalendar | null>(null);
  const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState<AcademicCalendar>({
    term: "",
    startDate: null,
    endDate: null,
    isActive: false,
    isCompleted: false,
  });

  // Period state
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
  const [showNewCalendarForm, setShowNewCalendarForm] = useState(false);
  const [showNewPeriodForm, setShowNewPeriodForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<TermPeriod | null>(null);

  // Holiday state
  const [termHolidays, setTermHolidays] = useState<TermHoliday[]>([]);
  const [allAcademicHolidays, setAllAcademicHolidays] = useState<(TermHoliday & { termName: string; termOrder?: number })[]>([]);
  const [currentHoliday, setCurrentHoliday] = useState<TermHoliday>({
    name: "",
    termId: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    isCompleted: false,
  });
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<TermHoliday | null>(null);

  // Loading
  const [loading, setLoading] = useState({
    academic: false,
    period: false,
    fetching: false,
    activating: false,
    closing: false,
    activatingPeriod: false,
    completingTerm: false,
    holidaysFetching: false,
    holidaySaving: false,
    holidayActivating: false,
    holidayCompleting: false,
  });

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

  // Derive a default holiday name from the selected term
  const generateHolidayName = (period?: TermPeriod) => {
    if (!period) return "End Term Holiday";
    const name = (period.periodName || '').trim();
    // Prefer numeric extraction to build "End Term X Holiday"
    const num = name.match(/\d+/)?.[0];
    if (num) {
      return `End Term ${num} Holiday`;
    }
    // If label contains Period or Term, normalize to Term
    if (/period/i.test(name) || /term/i.test(name)) {
      const normalized = name.replace(/period/gi, 'Term');
      return `End ${normalized} Holiday`;
    }
    // Fallback to explicit order if provided
    if (typeof period.order === 'number' && !Number.isNaN(period.order)) {
      return `End Term ${period.order} Holiday`;
    }
    return "End Term Holiday";
  };

  const canActivateTerm = (period: TermPeriod): boolean => {
    if (period.isCurrent || period.isCompleted) return false;
    if (termPeriods.some(p => p.isCurrent && !p.isCompleted)) return false;
    
    // Check if this is the next sequential term
    const sortedPeriods = [...termPeriods].sort((a, b) => (a.order || 0) - (b.order || 0));
    const completedTerms = sortedPeriods.filter(p => p.isCompleted);
    const nextTerm = sortedPeriods[completedTerms.length];
    
    return nextTerm?.id === period.id;
  };

  const getTermStatusInfo = (period: TermPeriod): { status: string; className: string; description: string } => {
    if (period.isCompleted) {
      return {
        status: "Completed",
        className: "bg-red-100 text-red-800",
        description: "This term has been completed"
      };
    }
    if (period.isCurrent) {
      return {
        status: "Current",
        className: "bg-green-100 text-green-800",
        description: "This is the currently active term"
      };
    }
    if (canActivateTerm(period)) {
      return {
        status: "Ready",
        className: "bg-blue-100 text-blue-800",
        description: "This term is ready to be activated"
      };
    }
    return {
      status: "Pending",
      className: "bg-gray-100 text-gray-800",
      description: "This term is waiting for previous terms to complete"
    };
  };

  // Fetch available periods
  const fetchAvailablePeriods = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/periods/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAvailablePeriods(data);
    } catch {
      toast({ title: "Error", description: "Failed to fetch available periods", variant: "destructive" });
    }
  };

  // Fetch term periods
  const fetchTermPeriods = async (academicCalendarId: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/settings/periods/term?academicCalendarId=${academicCalendarId}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
    } catch {
      toast({ title: "Error", description: "Failed to fetch term periods", variant: "destructive" });
    }
  };

  // Fetch academic calendars
  const fetchAcademicData = async () => {
    setLoading(p => ({ ...p, fetching: true }));
    try {
      const calendars = await academicCalendarService.getAcademicCalendars(token!);
      setAcademicCalendars(calendars);
      let activeCalendar: AcademicCalendar | null = null;
      try {
        activeCalendar = await academicCalendarService.getActiveAcademicCalendar(token!);
      } catch {}
      setActiveAcademicCalendar(activeCalendar);
      const defaultCalendar = activeCalendar || calendars[0] || {
        term: "",
        startDate: null,
        endDate: null,
        isActive: false,
        isCompleted: false,
      };
      setSelectedAcademicCalendar(defaultCalendar);
    } finally {
      setLoading(p => ({ ...p, fetching: false }));
    }
  };

  // Save academic calendar
  const onSaveAcademic = async () => {
    setLoading(p => ({ ...p, academic: true }));
    try {
      await academicCalendarService.createAcademicCalendar(selectedAcademicCalendar, token!);
      toast({ title: "Success", description: "Academic calendar saved" });
      await fetchAcademicData();
      setShowNewCalendarForm(false);
    } catch (e:any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    } finally {
      setLoading(p => ({ ...p, academic: false }));
    }
  };

  // Activate / close academic
  const onActivateAcademicCalendar = async (calendarId: string) => {
    setLoading(p => ({ ...p, activating: true }));
    try {
      await academicCalendarService.setActiveAcademicCalendar(calendarId, token!);
      toast({ title: "Success", description: "Academic calendar activated" });
      await fetchAcademicData();
    } catch (e:any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    } finally {
      setLoading(p => ({ ...p, activating: false }));
    }
  };
  const onCloseAcademicCalendar = async (calendarId: string) => {
    setLoading(p => ({ ...p, closing: true }));
    try {
      await academicCalendarService.closeAcademicCalendar(calendarId, token!);
      toast({ title: "Success", description: "Academic calendar closed" });
      await fetchAcademicData();
    } catch (e:any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    } finally {
      setLoading(p => ({ ...p, closing: false }));
    }
  };

  // Create/update term period
  const onSavePeriod = async () => {
    setLoading(p => ({ ...p, period: true }));
    try {
      if (!currentPeriod.periodId) throw new Error("Select a period");
      if (!selectedAcademicCalendar.id) throw new Error("Select an academic calendar");
      const payload = {
        periodId: currentPeriod.periodId,
        academicCalendarId: selectedAcademicCalendar.id,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
        isCurrent: currentPeriod.isCurrent || false,
      };
      let res;
      if (editingPeriod?.id) {
        res = await fetch(`${API_BASE}/settings/periods/term/${editingPeriod.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/settings/periods/term`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      toast({ title: "Success", description: `Term ${editingPeriod ? "updated" : "created"}` });
      if (selectedAcademicCalendar.id) await fetchTermPeriods(selectedAcademicCalendar.id);
      setShowNewPeriodForm(false);
      setEditingPeriod(null);
      resetCurrentPeriod();
    } catch (e:any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    } finally {
      setLoading(p => ({ ...p, period: false }));
    }
  };

  const onActivatePeriod = async (periodId: string) => {
    setLoading(p => ({ ...p, activatingPeriod: true }));
    try {
      const res = await fetch(`${API_BASE}/settings/periods/term/${periodId}/activate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      toast({ title: "Success", description: "Term activated" });
      if (selectedAcademicCalendar.id) await fetchTermPeriods(selectedAcademicCalendar.id);
    } catch (e:any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    } finally {
      setLoading(p => ({ ...p, activatingPeriod: false }));
    }
  };

  const onCompleteTerm = async (termId: string) => {
    setLoading(p => ({ ...p, completingTerm: true }));
    try {
      const res = await fetch(`${API_BASE}/settings/periods/term/${termId}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      toast({ title: "Success", description: "Term completed" });
      
      if (selectedAcademicCalendar.id) await fetchTermPeriods(selectedAcademicCalendar.id);
      
      // Auto-activate the term's holiday if it exists
      try {
        const holidaysRes = await fetch(`${API_BASE}/settings/terms/${termId}/holidays`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (holidaysRes.ok) {
          const holidays = await holidaysRes.json();
          if (Array.isArray(holidays) && holidays.length > 0) {
            const holiday = holidays[0]; // Get the first (and should be only) holiday
            if (holiday.id && !holiday.isCurrent && !holiday.isCompleted) {
              await onActivateHoliday(holiday.id);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to auto-activate holiday:', error);
      }
      
    } catch (e:any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    } finally {
      setLoading(p => ({ ...p, completingTerm: false }));
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

  // Holidays
  const fetchTermHolidays = async (termId: string) => {
    if (!termId) return;
    setLoading(p => ({ ...p, holidaysFetching: true }));
    try {
      const res = await fetch(`${API_BASE}/settings/terms/${termId}/holidays`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      let holidays = Array.isArray(data) ? data : [];
      // Fallback similar to comprehensive list so Close button appears if backend left isCurrent false
      if (holidays.length === 1) {
        const h = holidays[0];
        if (!h.isCompleted && !h.isCurrent) {
          h.isCurrent = true;
        }
      }
      setTermHolidays(holidays);
    } catch {
      toast({ title: "Error", description: "Failed to fetch holidays", variant: "destructive" });
    } finally {
      setLoading(p => ({ ...p, holidaysFetching: false }));
    }
  };

  const fetchAllAcademicHolidays = async (academicCalendarId: string) => {
    if (!academicCalendarId) return;
    setLoading(p => ({ ...p, holidaysFetching: true }));
    try {
      // First get all terms for this academic calendar
      const termsRes = await fetch(
        `${API_BASE}/settings/periods/term?academicCalendarId=${academicCalendarId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!termsRes.ok) throw new Error('Failed to fetch terms');
      const terms = await termsRes.json();
      
      if (!Array.isArray(terms)) {
        setAllAcademicHolidays([]);
        return;
      }

      // Fetch holidays for each term
      const holidayPromises = terms.map(async (term: TermPeriod) => {
        try {
          const holidaysRes = await fetch(`${API_BASE}/settings/terms/${term.id}/holidays`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (holidaysRes.ok) {
            const holidays = await holidaysRes.json();
            return Array.isArray(holidays) 
              ? holidays.map((holiday: TermHoliday) => ({
                  ...holiday,
                  termName: term.periodName,
                  termOrder: term.order || 0,
                  termId: term.id || holiday.termId,
                }))
              : [];
          }
          return [];
        } catch {
          return [];
        }
      });

      const allHolidays = await Promise.all(holidayPromises);
      const flattenedHolidays: any[] = allHolidays.flat().sort((a, b) => a.termOrder - b.termOrder);

      // Fallback: if backend didn't flag an active holiday but exactly one is incomplete, mark it current for UI
      const hasCurrent = flattenedHolidays.some(h => h.isCurrent && !h.isCompleted);
      if (!hasCurrent) {
        const incomplete = flattenedHolidays.filter(h => !h.isCompleted);
        if (incomplete.length === 1) {
          incomplete[0].isCurrent = true;
        }
      }
      setAllAcademicHolidays(flattenedHolidays);
      
    } catch (error) {
      console.error('Failed to fetch all academic holidays:', error);
      toast({ title: "Error", description: "Failed to fetch academic holidays", variant: "destructive" });
      setAllAcademicHolidays([]);
    } finally {
      setLoading(p => ({ ...p, holidaysFetching: false }));
    }
  };

  const resetHolidayForm = () => {
    setCurrentHoliday({
      id: "",
      name: generateHolidayName(currentPeriod),
      termId: currentPeriod.id || "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      isCompleted: false,
    });
  };

  const handleCreateHoliday = () => {
    setEditingHoliday(null);
    resetHolidayForm();
    setShowHolidayForm(true);
  };

  const handleEditHoliday = (h: TermHoliday) => {
    setEditingHoliday(h);
    setCurrentHoliday({
      ...h,
      startDate: formatDateForInput(h.startDate),
      endDate: formatDateForInput(h.endDate),
    });
    setShowHolidayForm(true);
  };

  const onSaveHoliday = async () => {
    if (!currentPeriod.id) {
      toast({ title: "Error", description: "Select a term first", variant: "destructive" });
      return;
    }
    if (!currentHoliday.name || !currentHoliday.startDate || !currentHoliday.endDate) {
      toast({ title: "Error", description: "Fill required fields", variant: "destructive" });
      return;
    }
    
    // Check if term already has a holiday (only for new holidays)
    if (!editingHoliday?.id && termHolidays.length > 0) {
      toast({ 
        title: "Error", 
        description: "Each term can only have one holiday. Please edit the existing holiday instead.", 
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(p => ({ ...p, holidaySaving: true }));
    try {
      const payload = {
        name: currentHoliday.name,
        startDate: currentHoliday.startDate,
        endDate: currentHoliday.endDate,
        isCurrent: false, // Holidays should not be automatically activated
      };
      let res;
      if (editingHoliday?.id) {
        res = await fetch(`${API_BASE}/settings/holidays/${editingHoliday.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/settings/terms/${currentPeriod.id}/holidays`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      toast({ title: "Success", description: `Holiday ${editingHoliday ? "updated" : "created"}` });
      await fetchTermHolidays(currentPeriod.id!);
      
      // Refresh all academic holidays
      if (selectedAcademicCalendar.id) {
        await fetchAllAcademicHolidays(selectedAcademicCalendar.id);
      }
      
      setShowHolidayForm(false);
      setEditingHoliday(null);
      resetHolidayForm();
    } catch (e:any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    } finally {
      setLoading(p => ({ ...p, holidaySaving: false }));
    }
  };

  const onActivateHoliday = async (holidayId: string) => {
    setLoading(p => ({ ...p, holidayActivating: true }));
    try {
      const res = await fetch(`${API_BASE}/settings/holidays/${holidayId}/activate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      toast({ title: "Success", description: "Holiday activated" });
      if (currentPeriod.id) await fetchTermHolidays(currentPeriod.id);
    } catch (e:any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    } finally {
      setLoading(p => ({ ...p, holidayActivating: false }));
    }
  };

  const onCompleteHoliday = async (holidayId: string) => {
    setLoading(p => ({ ...p, holidayCompleting: true }));
    try {
      const res = await fetch(`${API_BASE}/settings/holidays/${holidayId}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      toast({ title: "Success", description: "Holiday completed" });
      
      if (currentPeriod.id) await fetchTermHolidays(currentPeriod.id);
      
      // Refresh all academic holidays
      if (selectedAcademicCalendar.id) {
        await fetchAllAcademicHolidays(selectedAcademicCalendar.id);
      }
      
      // Auto-activate the next term
      try {
        if (selectedAcademicCalendar.id) {
          await fetchTermPeriods(selectedAcademicCalendar.id);
          
          // Find the next incomplete term
          const periodsRes = await fetch(
            `${API_BASE}/settings/periods/term?academicCalendarId=${selectedAcademicCalendar.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (periodsRes.ok) {
            const periods = await periodsRes.json();
            if (Array.isArray(periods)) {
              // Sort by order and find the next incomplete term
              const sortedPeriods = periods.sort((a, b) => a.order - b.order);
              const nextTerm = sortedPeriods.find(term => !term.isCurrent && !term.isCompleted);
              
              if (nextTerm?.id) {
                await onActivatePeriod(nextTerm.id);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to auto-activate next term:', error);
      }
      
    } catch (e:any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    } finally {
      setLoading(p => ({ ...p, holidayCompleting: false }));
    }
  };

  // Effects
  useEffect(() => {
    fetchAcademicData();
    fetchAvailablePeriods();
  }, []);
  useEffect(() => {
    if (selectedAcademicCalendar.id) {
      fetchTermPeriods(selectedAcademicCalendar.id);
      fetchAllAcademicHolidays(selectedAcademicCalendar.id);
    }
  }, [selectedAcademicCalendar.id]);
  useEffect(() => {
    if (currentPeriod.id) {
      fetchTermHolidays(currentPeriod.id);
      setCurrentHoliday(ch => ({
        ...ch,
        termId: currentPeriod.id || "",
      }));
      // If creating a new holiday and the form is open, prefill name when empty
      if (showHolidayForm && !editingHoliday) {
        setCurrentHoliday(ch => {
          if (!ch.name || ch.name.trim() === "") {
            return { ...ch, name: generateHolidayName(currentPeriod) };
          }
          return ch;
        });
      }
    } else {
      setTermHolidays([]);
    }
  }, [currentPeriod.id]);

  return (
    <div className="space-y-6">
      {/* Active Academic Calendar */}
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
              <Label className="text-sm font-medium">Academic Year</Label>
              <Input value={activeAcademicCalendar.term} readOnly />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date</Label>
              <Input value={formatDateForDisplay(activeAcademicCalendar.startDate)} readOnly />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date</Label>
              <Input value={formatDateForDisplay(activeAcademicCalendar.endDate)} readOnly />
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              No active academic calendar set
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Please activate one from the list below.
            </p>
          </div>
        )}
      </div>

      {/* Academic Calendar Management */}
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
                <Label>Academic Year</Label>
                <Input
                  value={selectedAcademicCalendar.term}
                  onChange={(e) =>
                    setSelectedAcademicCalendar({ ...selectedAcademicCalendar, term: e.target.value })
                  }
                  placeholder="2025-2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formatDateForInput(selectedAcademicCalendar.startDate)}
                  onChange={(e) =>
                    setSelectedAcademicCalendar({ ...selectedAcademicCalendar, startDate: e.target.value || null })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formatDateForInput(selectedAcademicCalendar.endDate)}
                  onChange={(e) =>
                    setSelectedAcademicCalendar({ ...selectedAcademicCalendar, endDate: e.target.value || null })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewCalendarForm(false)}>Cancel</Button>
              <Button onClick={onSaveAcademic} disabled={loading.academic || !selectedAcademicCalendar.term}>
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
                      const sel = academicCalendars.find(c => c.id === value);
                      if (sel) setSelectedAcademicCalendar(sel);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicCalendars.map(c => (
                        <SelectItem key={c.id} value={c.id || ""}>
                          {c.term} {c.id === activeAcademicCalendar?.id ? "(Active)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Input value={selectedAcademicCalendar.term} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input value={formatDateForDisplay(selectedAcademicCalendar.startDate)} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input value={formatDateForDisplay(selectedAcademicCalendar.endDate)} readOnly />
                  </div>
                </div>
                <div className="space-y-2 mt-6">
                  <Label>All Academic Calendars</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academicCalendars.map(calendar => (
                        <TableRow key={calendar.id}>
                          <TableCell>{calendar.term}</TableCell>
                          <TableCell>{formatDateForDisplay(calendar.startDate)}</TableCell>
                          <TableCell>{formatDateForDisplay(calendar.endDate)}</TableCell>
                          <TableCell>
                            {calendar.id === activeAcademicCalendar?.id ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                            ) : calendar.isCompleted ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Completed</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {calendar.id === activeAcademicCalendar?.id && !calendar.isCompleted ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={loading.closing}>
                                      {loading.closing ? "Closing..." : "Close"}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Close Academic Calendar</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will mark it as completed.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => calendar.id && onCloseAcademicCalendar(calendar.id)}
                                        className="bg-destructive text-destructive-foreground"
                                      >
                                        Confirm
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : calendar.id !== activeAcademicCalendar?.id && !calendar.isCompleted && !activeAcademicCalendar ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => calendar.id && onActivateAcademicCalendar(calendar.id)}
                                  disabled={loading.activating}
                                >
                                  {loading.activating ? "Activating..." : "Activate"}
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
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
                <p className="text-muted-foreground">No academic calendars found</p>
                <Button className="mt-2" onClick={() => setShowNewCalendarForm(true)}>
                  Create First Academic Calendar
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sequential Flow Information */}
      {selectedAcademicCalendar.id && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📚 Academic Term Flow</h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Terms must be completed sequentially. When a term is completed, its holiday (if defined) will be automatically activated. 
            When the holiday is completed, the next term will be automatically activated.
          </p>
        </div>
      )}

      {/* Term Management */}
      <div className="space-y-4 border p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Term Management</h3>
          <div className="text-sm text-muted-foreground">
            <span>Academic Calendar: </span>
            <span className="font-medium">
              {selectedAcademicCalendar.term || "Not selected"}
            </span>
            {selectedAcademicCalendar.id === activeAcademicCalendar?.id && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
            )}
          </div>
        </div>
        {selectedAcademicCalendar.id ? (
          <>
            {termPeriods.length > 0 && (
              <div className="space-y-2">
                <Label>Select Term</Label>
                <Select
                  value={currentPeriod.id || ""}
                  onValueChange={(value) => {
                    const period = termPeriods.find(t => t.id === value);
                    if (period) setCurrentPeriod(period);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a term" />
                  </SelectTrigger>
                  <SelectContent>
                    {termPeriods.map(period => (
                      <SelectItem key={period.id} value={period.id || ""}>
                        {period.periodName} ({formatDateForDisplay(period.startDate)} - {formatDateForDisplay(period.endDate)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="mt-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{editingPeriod ? "Edit Term" : "Create New Term"}</h3>
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
                          const period = availablePeriods.find(p => p.id === value);
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
                          {availablePeriods.map(p => (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              disabled={!editingPeriod && termPeriods.some(t => t.periodId === p.id)}
                            >
                              {p.name}
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
                        onChange={(e) => setCurrentPeriod({ ...currentPeriod, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={currentPeriod.endDate}
                        onChange={(e) => setCurrentPeriod({ ...currentPeriod, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  {!editingPeriod && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isCurrent"
                        checked={currentPeriod.isCurrent}
                        onCheckedChange={(checked) =>
                          setCurrentPeriod({ ...currentPeriod, isCurrent: Boolean(checked) })
                        }
                      />
                      <Label htmlFor="isCurrent">Set as current term</Label>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowNewPeriodForm(false);
                      setEditingPeriod(null);
                      resetCurrentPeriod();
                    }}>Cancel</Button>
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
                  <Label>Terms in {selectedAcademicCalendar.term}</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Term</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {termPeriods.map(period => (
                        <TableRow key={period.id}>
                          <TableCell>{period.periodName}</TableCell>
                          <TableCell>{formatDateForDisplay(period.startDate)}</TableCell>
                          <TableCell>{formatDateForDisplay(period.endDate)}</TableCell>
                          <TableCell>
                            {(() => {
                              const statusInfo = getTermStatusInfo(period);
                              return (
                                <span 
                                  className={`px-2 py-1 text-xs rounded-full ${statusInfo.className}`}
                                  title={statusInfo.description}
                                >
                                  {statusInfo.status}
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              {!period.isCompleted && (
                                <Button variant="ghost" size="sm" onClick={() => handleEditPeriod(period)}>
                                  Edit
                                </Button>
                              )}
                              {canActivateTerm(period) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => period.id && onActivatePeriod(period.id)}
                                  disabled={loading.activatingPeriod}
                                >
                                  {loading.activatingPeriod ? "Activating..." : "Activate"}
                                </Button>
                              )}
                              {period.isCurrent && !period.isCompleted && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={loading.completingTerm}
                                    >
                                      {loading.completingTerm ? "Completing..." : "Complete Term"}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Complete Term</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will mark the term as completed. If this term has a holiday defined, it will be automatically activated.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => period.id && onCompleteTerm(period.id)}
                                        className="bg-destructive text-destructive-foreground"
                                      >
                                        Confirm
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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

            {/* Holiday Management */}
            <div className="mt-10 space-y-4 border-t pt-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Holiday Management (Selected Term)</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Term: {currentPeriod.periodName || "None selected"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateHoliday}
                    disabled={!currentPeriod.id || showHolidayForm}
                  >
                    New Holiday
                  </Button>
                </div>
              </div>

              {!currentPeriod.id && (
                <p className="text-sm text-muted-foreground">
                  Select a term to manage holidays.
                </p>
              )}

              {currentPeriod.id && showHolidayForm && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Holiday Name</Label>
                      <Input
                        value={currentHoliday.name}
                        onChange={(e) =>
                          setCurrentHoliday({ ...currentHoliday, name: e.target.value })
                        }
                        placeholder={generateHolidayName(currentPeriod)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={currentHoliday.startDate}
                        onChange={(e) =>
                          setCurrentHoliday({ ...currentHoliday, startDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={currentHoliday.endDate}
                        onChange={(e) =>
                          setCurrentHoliday({ ...currentHoliday, endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  {/* Holidays are automatically activated when terms complete - no manual activation */}
                  <div className="text-sm text-muted-foreground p-2 bg-blue-50 rounded border border-blue-200">
                    ℹ️ This holiday will be automatically activated when the current term is completed.
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowHolidayForm(false);
                        setEditingHoliday(null);
                        resetHolidayForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={onSaveHoliday}
                      disabled={
                        loading.holidaySaving ||
                        !currentHoliday.name ||
                        !currentHoliday.startDate ||
                        !currentHoliday.endDate
                      }
                    >
                      {loading.holidaySaving
                        ? "Saving..."
                        : editingHoliday
                        ? "Update Holiday"
                        : "Save Holiday"}
                    </Button>
                  </div>
                </div>
              )}

              {currentPeriod.id && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Holidays for {currentPeriod.periodName}</Label>
                    {termHolidays.length === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreateHoliday}
                        disabled={loading.holidaySaving}
                      >
                        Add Holiday
                      </Button>
                    )}
                  </div>
                  
                  {termHolidays.length === 0 && !showHolidayForm && (
                    <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                      No holiday defined for this term. Each term can have one holiday that will be automatically activated when the term is completed.
                    </div>
                  )}
                  
                  {termHolidays.length > 0 && (
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading.holidaysFetching ? (
                        <TableRow>
                          <TableCell colSpan={5}>Loading...</TableCell>
                        </TableRow>
                      ) : (
                        termHolidays.map(h => (
                          <TableRow key={h.id}>
                            <TableCell className="font-medium">{h.name}</TableCell>
                            <TableCell>{formatDateForDisplay(h.startDate)}</TableCell>
                            <TableCell>{formatDateForDisplay(h.endDate)}</TableCell>
                            <TableCell>
                              {h.isCompleted ? (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Completed</span>
                              ) : h.isCurrent ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Current</span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Pending</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                {!h.isCompleted && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditHoliday(h)}
                                  >
                                    Edit
                                  </Button>
                                )}
                                {/* Holidays are auto-activated when terms complete - no manual activate button */}
                                {h.isCurrent && !h.isCompleted && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={loading.holidayCompleting}
                                      >
                                        {loading.holidayCompleting ? "Closing..." : "Close Holiday"}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Close Holiday</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will mark the holiday as completed and automatically activate the next term.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => h.id && onCompleteHoliday(h.id)}
                                          className="bg-destructive text-destructive-foreground"
                                        >
                                          Confirm
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  )}
                </div>
              )}
            </div>

            {/* Comprehensive Holidays View */}
            <div className="mt-10 space-y-4 border-t pt-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">All Academic Calendar Holidays</h3>
                <div className="text-sm text-muted-foreground">
                  Complete overview of all holidays for this academic calendar
                </div>
              </div>

              {allAcademicHolidays.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Holiday Name</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allAcademicHolidays.map((holiday) => {
                        const startDate = new Date(holiday.startDate);
                        const endDate = new Date(holiday.endDate);
                        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        
                        return (
                          <TableRow key={holiday.id}>
                            <TableCell className="font-medium">{holiday.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {holiday.termName || termPeriods.find(t => t.id === holiday.termId)?.periodName || 'Unknown Term'}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(startDate, 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{format(endDate, 'MMM dd, yyyy')}</TableCell>
                            <TableCell>
                              {duration} day{duration !== 1 ? 's' : ''}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  holiday.isCompleted
                                    ? "default"
                                    : holiday.isCurrent
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {holiday.isCompleted
                                  ? "Completed"
                                  : holiday.isCurrent
                                  ? "Active"
                                  : "Upcoming"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {!holiday.isCompleted && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Switch to the term that contains this holiday
                                      const termPeriod = termPeriods.find(t => t.id === holiday.termId);
                                      if (termPeriod) {
                                        setCurrentPeriod(termPeriod);
                                        // Find and edit this holiday
                                        const holidayToEdit = termHolidays.find(h => h.id === holiday.id);
                                        if (holidayToEdit) {
                                          setCurrentHoliday(holidayToEdit);
                                          setShowHolidayForm(true);
                                        }
                                      }
                                    }}
                                  >
                                    Edit
                                  </Button>
                                )}
                                {holiday.isCurrent && !holiday.isCompleted && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={loading.holidayCompleting}
                                      >
                                        Close
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Close Holiday</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will mark "{holiday.name}" as completed and automatically activate the next term.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => holiday.id && onCompleteHoliday(holiday.id)}
                                          className="bg-destructive text-destructive-foreground"
                                        >
                                          Confirm
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No holidays have been created for this academic calendar yet.</p>
                  <p className="text-sm mt-2">Create holidays by selecting a term and clicking "New Holiday" above.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">
            Please select an academic calendar to manage terms and holidays
          </p>
        )}
      </div>
    </div>
  );
}