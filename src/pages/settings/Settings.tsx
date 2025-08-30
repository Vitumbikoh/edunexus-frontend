
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import SchoolAcademicSection from "./AcademicAndPeriodsSection";
import AccountSecuritySection from "./AccountSecuritySection";
import PreferencesSection from "./PreferencesSection";
import SchoolInfoSection from "./SchoolInfoSection";

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="flex w-full flex-wrap gap-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          {isAdmin && <TabsTrigger value="school">School</TabsTrigger>}
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <AccountSecuritySection variant="account" />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <AccountSecuritySection variant="security" />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <PreferencesSection variant="notifications" />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <PreferencesSection variant="appearance" />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="school" className="space-y-6">
            <SchoolAcademicSection />
            <SchoolInfoSection />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
