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
import { Loader2, Eye, EyeOff, Monitor, Sun, Moon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Full Name</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    readOnly
                    value={user?.role}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSubmit('account')}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive email notifications</p>
                  </div>
                  <Switch
                    checked={formData.notifications.email}
                    onCheckedChange={() => handleNotificationChange('email')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SMS Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive text messages</p>
                  </div>
                  <Switch
                    checked={formData.notifications.sms}
                    onCheckedChange={() => handleNotificationChange('sms')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Browser Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive notifications in browser</p>
                  </div>
                  <Switch
                    checked={formData.notifications.browser}
                    onCheckedChange={() => handleNotificationChange('browser')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Weekly Summary</h4>
                    <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
                  </div>
                  <Switch
                    checked={formData.notifications.weeklySummary}
                    onCheckedChange={() => handleNotificationChange('weeklySummary')}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSubmit('notifications')}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Choose your preferred theme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Theme Mode</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        theme === 'light'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Sun className="h-6 w-6" />
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        theme === 'dark'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Moon className="h-6 w-6" />
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                    
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        theme === 'system'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Monitor className="h-6 w-6" />
                      <span className="text-sm font-medium">System</span>
                    </button>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {theme === 'system' 
                      ? 'The system theme will automatically adjust based on your device settings.'
                      : `The ${theme} theme will be applied across the entire system for your account.`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        placeholder="Enter current password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        placeholder="Enter new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch
                    checked={formData.security.twoFactor}
                    onCheckedChange={handleSecurityChange}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSubmit('security')}>Update Security Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role.toUpperCase() === 'ADMIN' && (
          <TabsContent value="school">
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
                        onChange={(e) => setAcademicCalendar({
                          ...academicCalendar,
                          academicYear: e.target.value
                        })}
                        placeholder="Enter in YYYY-YYYY format (e.g., 2025-2026)"
                        pattern="\d{4}-\d{4}"
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: YYYY-YYYY (e.g., 2025-2026)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date (Optional)</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={academicCalendar.startDate || ''}
                        onChange={(e) => setAcademicCalendar({
                          ...academicCalendar,
                          startDate: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date (Optional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={academicCalendar.endDate || ''}
                        onChange={(e) => setAcademicCalendar({
                          ...academicCalendar,
                          endDate: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleAcademicCalendarSubmit}>
                      Save Academic Calendar
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
                        onValueChange={(value) => setCurrentTerm({
                          ...currentTerm,
                          termName: value
                        })}
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
                        value={currentTerm.startDate || ''}
                        onChange={(e) => setCurrentTerm({
                          ...currentTerm,
                          startDate: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="termEndDate">End Date (Optional)</Label>
                      <Input
                        id="termEndDate"
                        type="date"
                        value={currentTerm.endDate || ''}
                        onChange={(e) => setCurrentTerm({
                          ...currentTerm,
                          endDate: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleTermSubmit}>
                      Save Term Settings
                    </Button>
                  </div>
                </div>

                {/* School Information Section */}
                <div className="space-y-4 border p-4 rounded-lg">
                  <h3 className="font-medium">School Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolName">School Name</Label>
                      <Input
                        id="schoolName"
                        value={formData.schoolSettings.schoolName}
                        onChange={handleSchoolSettingsChange}
                        placeholder="Enter school name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolEmail">School Email</Label>
                      <Input
                        id="schoolEmail"
                        type="email"
                        value={formData.schoolSettings.schoolEmail}
                        onChange={handleSchoolSettingsChange}
                        placeholder="Enter school email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolPhone">School Phone</Label>
                      <Input
                        id="schoolPhone"
                        type="tel"
                        value={formData.schoolSettings.schoolPhone}
                        onChange={handleSchoolSettingsChange}
                        placeholder="Enter school phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolAddress">School Address</Label>
                      <Input
                        id="schoolAddress"
                        value={formData.schoolSettings.schoolAddress}
                        onChange={handleSchoolSettingsChange}
                        placeholder="Enter school address"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolAbout">About School</Label>
                    <textarea
                      id="schoolAbout"
                      className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm"
                      value={formData.schoolSettings.schoolAbout}
                      onChange={handleSchoolSettingsChange}
                      placeholder="Enter school description"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSchoolSettingsSubmit}>
                      Save School Information
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}