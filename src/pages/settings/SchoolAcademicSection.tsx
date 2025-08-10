
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type AcademicCalendar = {
  academicYear: string;
  startDate?: string;
  endDate?: string;
};

const API_BASE = 'http://localhost:5000/api/v1';

export type Term = {
  id?: string;
  termName: string;
  startDate?: string;
  endDate?: string;
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
  
  const [academicCalendar, setAcademicCalendar] = useState<AcademicCalendar>({
    academicYear: "",
    startDate: "",
    endDate: "",
  });
  
  const [currentTerm, setCurrentTerm] = useState<Term>({
    termName: "",
    startDate: "",
    endDate: "",
    isCurrent: true,
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
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchSchoolData();
    fetchAcademicData();
    fetchTermData();
  }, []);

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
      setAcademicCalendar({
        academicYear: data.academicYear || "",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
      });
    } catch (error) {
      console.error('Failed to fetch academic calendar:', error);
    }
  };

  const fetchTermData = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/terms`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const current = list.find((t: any) => t.isCurrent) || list[0] || {};
      setCurrentTerm({
        id: current.id || current._id || "",
        termName: current.termName || "",
        startDate: current.startDate || "",
        endDate: current.endDate || "",
        isCurrent: current.isCurrent ?? true,
      });
    } catch (error) {
      console.error('Failed to fetch current term:', error);
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
        body: JSON.stringify(academicCalendar),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({
        title: "Success",
        description: "Academic calendar updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update academic calendar",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, academic: false }));
    }
  };

  const onSaveTerm = async () => {
    setLoading(prev => ({ ...prev, term: true }));
    try {
      if (currentTerm.id) {
        const res = await fetch(`${API_BASE}/settings/terms/${currentTerm.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            termName: currentTerm.termName,
            startDate: currentTerm.startDate,
            endDate: currentTerm.endDate,
            isCurrent: currentTerm.isCurrent,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch(`${API_BASE}/settings/terms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(currentTerm),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      toast({
        title: "Success",
        description: "Term settings updated successfully",
      });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Settings</CardTitle>
        <CardDescription>Configure school-wide settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Academic Calendar Section */}
        <div className="space-y-4 border p-4 rounded-lg">
          <h3 className="font-medium">Academic Calendar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                value={academicCalendar.academicYear}
                onChange={(e) => setAcademicCalendar({ ...academicCalendar, academicYear: e.target.value })}
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
                value={academicCalendar.startDate || ""}
                onChange={(e) => setAcademicCalendar({ ...academicCalendar, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={academicCalendar.endDate || ""}
                onChange={(e) => setAcademicCalendar({ ...academicCalendar, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onSaveAcademic} disabled={loading.academic}>
              {loading.academic ? "Saving..." : "Save Academic Calendar"}
            </Button>
          </div>
        </div>

        {/* Term Settings Section */}
        <div className="space-y-4 border p-4 rounded-lg">
          <h3 className="font-medium">Current Term</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Term</Label>
              <Select
                value={currentTerm.termName}
                onValueChange={(value) => setCurrentTerm({ ...currentTerm, termName: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select current term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="termStartDate">Start Date (Optional)</Label>
              <Input
                id="termStartDate"
                type="date"
                value={currentTerm.startDate || ""}
                onChange={(e) => setCurrentTerm({ ...currentTerm, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termEndDate">End Date (Optional)</Label>
              <Input
                id="termEndDate"
                type="date"
                value={currentTerm.endDate || ""}
                onChange={(e) => setCurrentTerm({ ...currentTerm, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onSaveTerm} disabled={loading.term}>
              {loading.term ? "Saving..." : "Save Term Settings"}
            </Button>
          </div>
        </div>

        {/* School Information Section */}
        <div className="space-y-4 border p-4 rounded-lg">
          <h3 className="font-medium">School Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input id="schoolName" value={schoolSettings.schoolName} onChange={handleSchoolChange} placeholder="Enter school name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolEmail">School Email</Label>
              <Input id="schoolEmail" type="email" value={schoolSettings.schoolEmail} onChange={handleSchoolChange} placeholder="Enter school email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolPhone">School Phone</Label>
              <Input id="schoolPhone" type="tel" value={schoolSettings.schoolPhone} onChange={handleSchoolChange} placeholder="Enter school phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolAddress">School Address</Label>
              <Input id="schoolAddress" value={schoolSettings.schoolAddress} onChange={handleSchoolChange} placeholder="Enter school address" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolAbout">About School</Label>
            <textarea
              id="schoolAbout"
              className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm"
              value={schoolSettings.schoolAbout}
              onChange={handleSchoolChange}
              placeholder="Enter school description"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={onSaveSchool} disabled={loading.school}>
              {loading.school ? "Saving..." : "Save School Information"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
