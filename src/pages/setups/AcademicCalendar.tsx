import React from "react";
import AcademicAndPeriodsSection from "../settings/AcademicAndPeriodsSection";

export default function AcademicCalendar() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Academic Calendar</h1>
        <p className="text-muted-foreground">Manage academic calendars, terms, and holidays.</p>
      </div>
      <AcademicAndPeriodsSection />
    </div>
  );
}
