import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AcademicAndTermsSection from "./AcademicAndTermsSection";
import SchoolInfoSection from "./SchoolInfoSection";


export default function SchoolAcademicSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>School Settings</CardTitle>
        <CardDescription>Configure school-wide settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AcademicAndTermsSection />
      </CardContent>
    </Card>
  );
}
