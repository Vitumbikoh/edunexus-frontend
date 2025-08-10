
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Monitor, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/lib/api";

export type PreferencesVariant = "notifications" | "appearance";

type Notifications = {
  email: boolean;
  sms: boolean;
  browser: boolean;
  weeklySummary: boolean;
};

type Props = {
  variant: PreferencesVariant;
};

export default function PreferencesSection({ variant }: Props) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [notifications, setNotifications] = useState<Notifications>({
    email: false,
    sms: false,
    browser: false,
    weeklySummary: false,
  });

  const [loading, setLoading] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    if (variant === "notifications") {
      fetchNotificationPreferences();
    }
  }, [variant]);

  const fetchNotificationPreferences = async () => {
    try {
      const data = await api.get('/settings');
      const n = data.notifications || data;
      setNotifications({
        email: n.email || false,
        sms: n.sms || false,
        browser: n.browser || false,
        weeklySummary: n.weeklySummary || false,
      });
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
    }
  };

  const handleNotificationToggle = (key: keyof Notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const onSaveNotifications = async () => {
    setLoading(true);
    try {
      await api.patch('/settings', { notifications });
      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
      console.error('Error updating notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "notifications") {
    return (
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
              <Switch checked={notifications.email} onCheckedChange={() => handleNotificationToggle("email")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">SMS Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive text messages</p>
              </div>
              <Switch checked={notifications.sms} onCheckedChange={() => handleNotificationToggle("sms")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Browser Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive notifications in browser</p>
              </div>
              <Switch checked={notifications.browser} onCheckedChange={() => handleNotificationToggle("browser")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Weekly Summary</h4>
                <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
              </div>
              <Switch checked={notifications.weeklySummary} onCheckedChange={() => handleNotificationToggle("weeklySummary")} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onSaveNotifications} disabled={loading}>
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <Sun className="h-6 w-6" />
                <span className="text-sm font-medium">Light</span>
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <Moon className="h-6 w-6" />
                <span className="text-sm font-medium">Dark</span>
              </button>

              <button
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  theme === "system" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <Monitor className="h-6 w-6" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {theme === "system"
                ? "The system theme will automatically adjust based on your device settings."
                : `The ${theme} theme will be applied across the entire system for your account.`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
