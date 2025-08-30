import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AcademicAndPeriodsSection from "./AcademicAndPeriodsSection";
import SchoolInfoSection from "./SchoolInfoSection";


export default function SchoolAcademicSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>School Settings</CardTitle>
        <CardDescription>Configure school-wide settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AcademicAndPeriodsSection />
      </CardContent>
    </Card>
  );
}
