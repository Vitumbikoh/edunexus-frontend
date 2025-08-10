import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AcademicCalendar = {
  academicYear: string;
  startDate?: string;
  endDate?: string;
};

export type Term = {
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

type Props = {
  academicCalendar: AcademicCalendar;
  setAcademicCalendar: (v: AcademicCalendar) => void;
  currentTerm: Term;
  setCurrentTerm: (v: Term) => void;
  onSaveAcademic: () => void;
  onSaveTerm: () => void;
  schoolSettings: SchoolSettings;
  onSchoolChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSaveSchool: () => void;
};

export default function SchoolAcademicSection({
  academicCalendar,
  setAcademicCalendar,
  currentTerm,
  setCurrentTerm,
  onSaveAcademic,
  onSaveTerm,
  schoolSettings,
  onSchoolChange,
  onSaveSchool,
}: Props) {
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
            <Button onClick={onSaveAcademic}>Save Academic Calendar</Button>
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
            <Button onClick={onSaveTerm}>Save Term Settings</Button>
          </div>
        </div>

        {/* School Information Section */}
        <div className="space-y-4 border p-4 rounded-lg">
          <h3 className="font-medium">School Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input id="schoolName" value={schoolSettings.schoolName} onChange={onSchoolChange} placeholder="Enter school name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolEmail">School Email</Label>
              <Input id="schoolEmail" type="email" value={schoolSettings.schoolEmail} onChange={onSchoolChange} placeholder="Enter school email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolPhone">School Phone</Label>
              <Input id="schoolPhone" type="tel" value={schoolSettings.schoolPhone} onChange={onSchoolChange} placeholder="Enter school phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolAddress">School Address</Label>
              <Input id="schoolAddress" value={schoolSettings.schoolAddress} onChange={onSchoolChange} placeholder="Enter school address" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolAbout">About School</Label>
            <textarea
              id="schoolAbout"
              className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm"
              value={schoolSettings.schoolAbout}
              onChange={onSchoolChange}
              placeholder="Enter school description"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={onSaveSchool}>Save School Information</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
