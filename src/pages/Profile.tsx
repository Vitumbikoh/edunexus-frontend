import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';

type ProfileData = {
  id: string;
  username?: string;
  role?: string;
  email?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  firstName?: string;
  lastName?: string;
  status?: string;
  createdAt?: string;
  image?: string;
  avatar?: string;
  profilePicture?: string;
  school?: {
    id: string;
    name: string;
    code: string;
  } | null;
};

type ProfileFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type NotificationPreferences = {
  email: boolean;
  sms: boolean;
  browser: boolean;
  whatsapp: boolean;
  weeklySummary: boolean;
};

const defaultPreferences: NotificationPreferences = {
  email: false,
  sms: false,
  browser: false,
  whatsapp: false,
  weeklySummary: false,
};

const getDisplayName = (data: ProfileData | null) => {
  if (!data) return 'User';
  if (data.firstName || data.lastName) {
    return `${data.firstName || ''} ${data.lastName || ''}`.trim();
  }
  return data.username || data.email?.split('@')[0] || 'User';
};

const getInitials = (name: string) => {
  const cleaned = name.trim();
  if (!cleaned) return 'U';
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const hydrateForm = (data: Partial<ProfileData> | null | undefined): ProfileFormState => ({
  firstName: data?.firstName || '',
  lastName: data?.lastName || '',
  email: data?.email || '',
  phone: data?.phone || data?.phoneNumber || '',
});

const normalizeRole = (role?: string) => (role || '').replace('_', ' ').toUpperCase();

const mapUserToProfile = (userData: ReturnType<typeof useAuth>['user']): ProfileData | null => {
  if (!userData) return null;

  return {
    id: userData.id,
    username: userData.username,
    role: userData.role,
    email: userData.email,
    phone: userData.phone,
    firstName: userData.firstName,
    lastName: userData.lastName,
    avatar: userData.avatar,
    image: userData.image,
    createdAt: userData.createdAt ? new Date(userData.createdAt).toISOString() : undefined,
  };
};

export default function Profile() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const userProfile = useMemo(() => mapUserToProfile(user), [user]);

  const [form, setForm] = useState<ProfileFormState>(hydrateForm(userProfile));

  const displayName = useMemo(() => getDisplayName(profile || userProfile), [profile, userProfile]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch profile (${response.status})`);
        }

        const data: ProfileData = await response.json();
        setProfile(data);
        setForm(hydrateForm(data));
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setProfile(userProfile);
        setForm(hydrateForm(userProfile));
        toast({
          title: 'Error',
          description: 'Failed to load profile information',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, user, userProfile, toast]);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!token) return;

      try {
        setPreferencesLoading(true);
        const response = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch preferences (${response.status})`);
        }

        const data = await response.json();
        const notifications = data?.user?.notifications || data?.notifications || data;

        setPreferences({
          email: Boolean(notifications?.email),
          sms: Boolean(notifications?.sms),
          browser: Boolean(notifications?.browser),
          whatsapp: Boolean(notifications?.whatsapp),
          weeklySummary: Boolean(notifications?.weeklySummary),
        });
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      } finally {
        setPreferencesLoading(false);
      }
    };

    fetchPreferences();
  }, [token]);

  if (!user) return null;

  const activeProfile = profile || userProfile;

  if (!activeProfile) return null;

  const handleInputChange = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancelEdit = () => {
    setForm(hydrateForm(activeProfile));
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!token) return;

    try {
      setSavingProfile(true);

      const role = (activeProfile.role || user.role || '').toLowerCase();
      const phone = form.phone.trim();

      const payload: Record<string, string> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      };

      if (role === 'admin' || role === 'super_admin') {
        payload.phone = phone;
      } else {
        payload.phoneNumber = phone;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update profile (${response.status})`);
      }

      const updatedProfile: ProfileData = await response.json();
      setProfile(updatedProfile);
      setForm(hydrateForm(updatedProfile));
      setIsEditing(false);

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile details',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async () => {
    if (!token) return;

    try {
      setSavingPreferences(true);

      const response = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notifications: preferences }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to save preferences (${response.status})`);
      }

      toast({
        title: 'Success',
        description: 'Preferences updated successfully',
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and manage your profile information</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage
                    src={activeProfile.avatar || activeProfile.profilePicture || activeProfile.image}
                    alt={displayName}
                  />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <p className="text-muted-foreground text-sm">{normalizeRole(activeProfile.role || user.role)}</p>
                <p className="text-sm mt-1">{activeProfile.email || '-'}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Status</span>
                  <span>{activeProfile.status || 'Active'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Joined</span>
                  <span>
                    {activeProfile.createdAt
                      ? new Date(activeProfile.createdAt).toLocaleDateString()
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{activeProfile.phone || activeProfile.phoneNumber || '-'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">School</span>
                  <span>{activeProfile.school?.name || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handleCancelEdit} disabled={savingProfile}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-email">Email notifications</Label>
                    <Switch
                      id="pref-email"
                      checked={preferences.email}
                      onCheckedChange={() => togglePreference('email')}
                      disabled={preferencesLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-sms">SMS notifications</Label>
                    <Switch
                      id="pref-sms"
                      checked={preferences.sms}
                      onCheckedChange={() => togglePreference('sms')}
                      disabled={preferencesLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-browser">In-app notifications</Label>
                    <Switch
                      id="pref-browser"
                      checked={preferences.browser}
                      onCheckedChange={() => togglePreference('browser')}
                      disabled={preferencesLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-whatsapp">WhatsApp notifications</Label>
                    <Switch
                      id="pref-whatsapp"
                      checked={preferences.whatsapp}
                      onCheckedChange={() => togglePreference('whatsapp')}
                      disabled={preferencesLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pref-weekly">Weekly summary reports</Label>
                    <Switch
                      id="pref-weekly"
                      checked={preferences.weeklySummary}
                      onCheckedChange={() => togglePreference('weeklySummary')}
                      disabled={preferencesLoading}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button onClick={handleSavePreferences} disabled={savingPreferences || preferencesLoading}>
                    {savingPreferences ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
