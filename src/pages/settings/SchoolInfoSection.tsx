import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { API_CONFIG, getServerBaseUrl } from '@/config/api';

const UPLOADS_BASE_URL = getServerBaseUrl();

export default function SchoolInfoSection() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: "",
    schoolEmail: "",
    schoolPhone: "",
    schoolAddress: "",
    schoolAbout: "",
    schoolLogo: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Failed to fetch school settings');
        }

        const data = await res.json();
        
        // Check if the response has schoolSettings nested
        const settings = data.schoolSettings || data;
        
        setSchoolSettings({
          schoolName: settings.schoolName || "",
          schoolEmail: settings.schoolEmail || "",
          schoolPhone: settings.schoolPhone || "",
          schoolAddress: settings.schoolAddress || "",
          schoolAbout: settings.schoolAbout || "",
          schoolLogo: settings.schoolLogo || "",
        });
        
        if (settings.schoolLogo) {
          setLogoPreview(`${UPLOADS_BASE_URL}${settings.schoolLogo}`);
        }
      } catch (error) {
        console.error('Failed to fetch school settings:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load school information',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSchoolData();
    }
  }, [token, toast]);

  const handleSchoolChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSchoolSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSaveSchool = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      
      // Add school settings as JSON string
      const settingsToSend = { ...schoolSettings };
      if (logoFile) {
        formData.append('logo', logoFile);
        // Don't include schoolLogo in the JSON if we're uploading a file
        delete settingsToSend.schoolLogo;
      }
      
      formData.append('schoolSettings', JSON.stringify(settingsToSend));

      const res = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update school information');
      }

      const data = await res.json();
      
      // Update local state with response
      if (data.schoolSettings) {
        setSchoolSettings(prev => ({
          ...prev,
          ...data.schoolSettings,
        }));
        if (data.schoolSettings.schoolLogo) {
          setLogoPreview(`${UPLOADS_BASE_URL}${data.schoolSettings.schoolLogo}`);
        }
      }

      toast({ 
        title: 'Success', 
        description: 'School information updated successfully' 
      });
    } catch (error) {
      console.error('Error updating school settings:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to update school information', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading school information...</div>;
  }

  return (
    <div className="space-y-4 border p-4 rounded-lg">
      <h3 className="font-medium">School Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="schoolName">School Name</Label>
          <Input 
            id="schoolName" 
            value={schoolSettings.schoolName} 
            onChange={handleSchoolChange} 
            placeholder="Enter school name" 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="schoolEmail">School Email</Label>
          <Input 
            id="schoolEmail" 
            type="email" 
            value={schoolSettings.schoolEmail} 
            onChange={handleSchoolChange} 
            placeholder="Enter school email" 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="schoolPhone">School Phone</Label>
          <Input 
            id="schoolPhone" 
            type="tel" 
            value={schoolSettings.schoolPhone} 
            onChange={handleSchoolChange} 
            placeholder="Enter school phone" 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="schoolAddress">School Address</Label>
          <Input 
            id="schoolAddress" 
            value={schoolSettings.schoolAddress} 
            onChange={handleSchoolChange} 
            placeholder="Enter school address" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolAbout">About School</Label>
        <textarea id="schoolAbout" className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm" value={schoolSettings.schoolAbout} onChange={handleSchoolChange} placeholder="Enter school description" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolLogo">School Logo</Label>
        <div className="flex items-center space-x-4">
          {logoPreview && (
            <img src={logoPreview} alt="School Logo" className="w-16 h-16 object-cover rounded-md border" />
          )}
          <Input 
            id="schoolLogo" 
            type="file" 
            accept="image/*"
            onChange={handleLogoChange}
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSaveSchool} disabled={saving}>
          {saving ? 'Saving...' : 'Save School Information'}
        </Button>
      </div>
    </div>
  );
}