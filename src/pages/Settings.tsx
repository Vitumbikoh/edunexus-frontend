import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AccountSecuritySection from "./settings/AccountSecuritySection";
import PreferencesSection from "./settings/PreferencesSection";
import SchoolAcademicSection from "./settings/SchoolAcademicSection";

interface UserSettings {
  username: string;
  email: string;
  phone?: string;
  notifications: {
    email: boolean;
    sms: boolean;
    browser: boolean;
    weeklySummary: boolean;
  };
  security: {
    twoFactor: boolean;
  };
}

interface SchoolSettings {
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  schoolAbout: string;
}

interface AcademicCalendar {
  academicYear: string;
  startDate?: string;
  endDate?: string;
}

interface Term {
  termName: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
}

export default function Settings() {
  const { user, token } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Main form data state
  const [formData, setFormData] = useState({
    username: user?.name || '',
    email: user?.email || '',
    phone: '',
    notifications: {
      email: true,
      sms: false,
      browser: true,
      weeklySummary: true,
    },
    security: {
      twoFactor: false,
    },
    schoolSettings: {
      schoolName: '',
      schoolEmail: '',
      schoolPhone: '',
      schoolAddress: '',
      schoolAbout: '',
    },
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Academic calendar state
  const [academicCalendar, setAcademicCalendar] = useState<AcademicCalendar>({
    academicYear: '',
  });

  // Term state
  const [currentTerm, setCurrentTerm] = useState<Term>({
    termName: '',
    isCurrent: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        if (!token || !user) throw new Error("Authentication required");

        // First fetch the main settings
        const settingsRes = await fetch('http://localhost:5000/api/v1/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!settingsRes.ok) {
          throw new Error("Failed to fetch settings");
        }

        const settingsData = await settingsRes.json();

        // Update state with user settings
        if (settingsData.user) {
          setFormData(prev => ({
            ...prev,
            username: settingsData.user.username || user?.name || '',
            email: settingsData.user.email || user?.email || '',
            phone: settingsData.user.phone || '',
            notifications: settingsData.user.notifications || prev.notifications,
            security: settingsData.user.security || prev.security,
            schoolSettings: settingsData.schoolSettings || prev.schoolSettings,
          }));
        }

        // If admin, fetch academic calendar and current term
        if (user?.role.toUpperCase() === 'ADMIN') {
          try {
            const [calendarRes, termRes] = await Promise.all([
              fetch('http://localhost:5000/api/v1/settings/academic-calendar', {
                headers: { Authorization: `Bearer ${token}` },
              }),
              fetch('http://localhost:5000/api/v1/settings/terms', {
                headers: { Authorization: `Bearer ${token}` },
              }),
            ]);

            if (calendarRes.ok) {
              const calendarData = await calendarRes.json();
              setAcademicCalendar({
                academicYear: calendarData.academicYear || '',
                startDate: calendarData.startDate,
                endDate: calendarData.endDate
              });
            }

            if (termRes.ok) {
              const termData = await termRes.json();
              setCurrentTerm({
                termName: termData.termName || '',
                startDate: termData.startDate,
                endDate: termData.endDate,
                isCurrent: termData.isCurrent || false
              });
            }
          } catch (err) {
            console.log("Optional admin settings not found, using defaults");
          }
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role && token) {
      fetchSettings();
    }
  }, [user, token, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleNotificationChange = (key: keyof typeof formData.notifications) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleSecurityChange = () => {
    setFormData(prev => ({
      ...prev,
      security: {
        ...prev.security,
        twoFactor: !prev.security.twoFactor,
      },
    }));
  };

  const handleSchoolSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      schoolSettings: {
        ...prev.schoolSettings,
        [id]: value,
      },
    }));
  };

  const handleAcademicCalendarSubmit = async () => {
    try {
      if (!token) throw new Error("Authentication required");
      
      // Validate academic year format
      if (!/^\d{4}-\d{4}$/.test(academicCalendar.academicYear)) {
        throw new Error("Academic year must be in YYYY-YYYY format");
      }

      const response = await fetch('http://localhost:5000/api/v1/settings/academic-calendar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(academicCalendar),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update academic calendar");
      }

      toast({
        title: "Success",
        description: "Academic calendar updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update academic calendar",
        variant: "destructive",
      });
    }
  };

  const handleTermSubmit = async () => {
    try {
      if (!token) throw new Error("Authentication required");
      
      if (!currentTerm.termName) {
        throw new Error("Please select a term");
      }

      const response = await fetch('http://localhost:5000/api/v1/settings/terms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentTerm,
          isCurrent: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update term");
      }

      toast({
        title: "Success",
        description: "Term updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update term",
        variant: "destructive",
      });
    }
  };

  const handleSchoolSettingsSubmit = async () => {
    try {
      if (!token || !user) throw new Error("Authentication required");

      const response = await fetch('http://localhost:5000/api/v1/settings', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          schoolSettings: formData.schoolSettings 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update school settings");
      }

      toast({
        title: "Success",
        description: "School settings updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update school settings",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (tab: string) => {
    try {
      if (!token || !user) {
        throw new Error("Authentication required");
      }

      let updateData: any = {};
      if (tab === 'account') {
        updateData = {
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
        };
      } else if (tab === 'notifications') {
        updateData = { notifications: formData.notifications };
      } else if (tab === 'security') {
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
          throw new Error("Passwords don't match");
        }
        updateData = {
          security: formData.security,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        };
      }

      const response = await fetch('http://localhost:5000/api/v1/settings', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update settings");
      }

      if (tab === 'security') {
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      }

      toast({
        title: "Success",
        description: `Settings ${tab === 'security' ? 'and password ' : ''}updated successfully`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account {user?.role.toUpperCase() === 'ADMIN' ? 'and school settings' : 'settings'}
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="mb-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {user?.role.toUpperCase() === 'ADMIN' && <TabsTrigger value="school">School Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="account">
          <AccountSecuritySection
            variant="account"
            formData={formData}
            role={user?.role}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit as any}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <PreferencesSection
            variant="notifications"
            notifications={formData.notifications}
            onNotificationToggle={handleNotificationChange as any}
            onSaveNotifications={() => handleSubmit('notifications')}
          />
        </TabsContent>

        <TabsContent value="appearance">
          <PreferencesSection
            variant="appearance"
            theme={theme}
            setTheme={setTheme}
          />
        </TabsContent>

        <TabsContent value="security">
          <AccountSecuritySection
            variant="security"
            formData={formData}
            onInputChange={handleInputChange}
            showCurrentPassword={showCurrentPassword}
            showNewPassword={showNewPassword}
            showConfirmPassword={showConfirmPassword}
            setShowCurrentPassword={setShowCurrentPassword}
            setShowNewPassword={setShowNewPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            onSecurityToggle={handleSecurityChange}
            onSubmit={handleSubmit as any}
          />
        </TabsContent>

        {user?.role.toUpperCase() === 'ADMIN' && (
          <TabsContent value="school">
            <SchoolAcademicSection
              academicCalendar={academicCalendar}
              setAcademicCalendar={setAcademicCalendar}
              currentTerm={currentTerm}
              setCurrentTerm={setCurrentTerm}
              onSaveAcademic={handleAcademicCalendarSubmit}
              onSaveTerm={handleTermSubmit}
              schoolSettings={formData.schoolSettings}
              onSchoolChange={handleSchoolSettingsChange}
              onSaveSchool={handleSchoolSettingsSubmit}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}