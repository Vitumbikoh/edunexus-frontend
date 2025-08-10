
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export type AccountSecurityVariant = "account" | "security";

type Security = { twoFactor: boolean };

type AccountData = {
  username: string;
  email: string;
  phone?: string;
  role?: string;
};

type SecurityData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactor: boolean;
};

type Props = {
  variant: AccountSecurityVariant;
};

export default function AccountSecuritySection({ variant }: Props) {
  const { toast } = useToast();
  const [accountData, setAccountData] = useState<AccountData>({
    username: "",
    email: "",
    phone: "",
    role: "",
  });

  const [securityData, setSecurityData] = useState<SecurityData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: false,
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    if (variant === "account") {
      fetchAccountData();
    } else {
      fetchSecurityData();
    }
  }, [variant]);

  const fetchAccountData = async () => {
    try {
      const data = await api.get('/settings');
      setAccountData({
        username: data.username || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "",
      });
    } catch (error) {
      console.error('Failed to fetch account data:', error);
    }
  };

  const fetchSecurityData = async () => {
    try {
      const data = await api.get('/settings');
      setSecurityData(prev => ({
        ...prev,
        twoFactor: (data.twoFactor ?? data.security?.twoFactor) || false,
      }));
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    }
  };

  const handleAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setAccountData(prev => ({ ...prev, [id]: value }));
  };

  const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSecurityData(prev => ({ ...prev, [id]: value }));
  };

  const handleSecurityToggle = () => {
    setSecurityData(prev => ({ ...prev, twoFactor: !prev.twoFactor }));
  };

  const onSubmitAccount = async () => {
    setLoading(true);
    try {
      await api.patch('/settings', {
        phone: accountData.phone,
      });
      toast({
        title: "Success",
        description: "Account information updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update account information",
        variant: "destructive",
      });
      console.error('Error updating account:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSecurity = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.patch('/settings', {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
        twoFactor: securityData.twoFactor,
      });

      toast({
        title: "Success",
        description: "Security settings updated successfully",
      });
      setSecurityData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update security settings",
        variant: "destructive",
      });
      console.error('Error updating security:', error);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "account") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Full Name</Label>
              <Input id="username" value={accountData.username} onChange={handleAccountInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={accountData.email} onChange={handleAccountInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={accountData.phone} onChange={handleAccountInputChange} placeholder="Enter your phone number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" readOnly value={accountData.role || ""} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onSubmitAccount} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // security
  return (
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
                  value={securityData.currentPassword}
                  onChange={handleSecurityInputChange}
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
                  value={securityData.newPassword}
                  onChange={handleSecurityInputChange}
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
                  value={securityData.confirmPassword}
                  onChange={handleSecurityInputChange}
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
            <Switch checked={securityData.twoFactor} onCheckedChange={handleSecurityToggle} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSubmitSecurity} disabled={loading}>
            {loading ? "Saving..." : "Update Security Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
