import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

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

export default function Settings() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);

        if (!token || !user) {
          throw new Error("Authentication required");
        }

        const response = await fetch('http://localhost:5000/api/v1/settings', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }

        const data = await response.json();
        if (data.user) {
          setFormData(prev => ({
            ...prev,
            username: data.user.username || user?.name || '',
            email: data.user.email || user?.email || '',
            phone: data.user.phone || '',
            notifications: data.user.notifications || prev.notifications,
            security: data.user.security || prev.security,
            schoolSettings: data.schoolSettings || prev.schoolSettings,
          }));
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
      } else if (tab === 'school' && user?.role.toUpperCase() === 'ADMIN') {
        updateData = { schoolSettings: formData.schoolSettings };
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
        throw new Error("Failed to update settings");
      }

      // Clear password fields only if we're on the security tab
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
              <CardContent className="space-y-4">
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
                  <Button onClick={() => handleSubmit('school')}>Save School Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}