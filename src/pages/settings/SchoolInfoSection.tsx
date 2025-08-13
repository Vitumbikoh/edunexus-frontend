import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API_BASE = 'http://localhost:5000/api/v1';

export default function SchoolInfoSection() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: "",
    schoolEmail: "",
    schoolPhone: "",
    schoolAddress: "",
    schoolAbout: "",
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`, {
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
        });
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

  const onSaveSchool = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolSettings // Match your backend expected structure
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update school information');
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
        <textarea 
          id="schoolAbout" 
          className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm" 
          value={schoolSettings.schoolAbout} 
          onChange={handleSchoolChange} 
          placeholder="Enter school description" 
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onSaveSchool} disabled={saving}>
          {saving ? 'Saving...' : 'Save School Information'}
        </Button>
      </div>
    </div>
  );
}