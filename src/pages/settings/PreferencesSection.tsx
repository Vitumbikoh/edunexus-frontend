import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Sun, Moon } from "lucide-react";

export type PreferencesVariant = "notifications" | "appearance";

type Notifications = {
  email: boolean;
  sms: boolean;
  browser: boolean;
  weeklySummary: boolean;
};

type Props = {
  variant: PreferencesVariant;
  notifications?: Notifications;
  onNotificationToggle?: (key: keyof Notifications) => void;
  onSaveNotifications?: () => void;
  theme?: string;
  setTheme?: (theme: "light" | "dark" | "system") => void;
};

export default function PreferencesSection({
  variant,
  notifications,
  onNotificationToggle,
  onSaveNotifications,
  theme,
  setTheme,
}: Props) {
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
              <Switch checked={!!notifications?.email} onCheckedChange={() => onNotificationToggle && onNotificationToggle("email")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">SMS Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive text messages</p>
              </div>
              <Switch checked={!!notifications?.sms} onCheckedChange={() => onNotificationToggle && onNotificationToggle("sms")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Browser Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive notifications in browser</p>
              </div>
              <Switch checked={!!notifications?.browser} onCheckedChange={() => onNotificationToggle && onNotificationToggle("browser")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Weekly Summary</h4>
                <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
              </div>
              <Switch checked={!!notifications?.weeklySummary} onCheckedChange={() => onNotificationToggle && onNotificationToggle("weeklySummary")} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onSaveNotifications}>Save Preferences</Button>
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
                onClick={() => setTheme && setTheme("light")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <Sun className="h-6 w-6" />
                <span className="text-sm font-medium">Light</span>
              </button>

              <button
                onClick={() => setTheme && setTheme("dark")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <Moon className="h-6 w-6" />
                <span className="text-sm font-medium">Dark</span>
              </button>

              <button
                onClick={() => setTheme && setTheme("system")}
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
