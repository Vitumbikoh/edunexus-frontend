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

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setSchoolSettings({
          schoolName: data.schoolName || "",
          schoolEmail: data.schoolEmail || "",
          schoolPhone: data.schoolPhone || "",
          schoolAddress: data.schoolAddress || "",
          schoolAbout: data.schoolAbout || "",
        });
      } catch (error) {
        console.error('Failed to fetch school settings:', error);
      }
    };

    fetchSchoolData();
  }, [token]);

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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(schoolSettings),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Success', description: 'School information updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update school information', variant: 'destructive' });
      console.error('Error updating school settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 border p-4 rounded-lg">
      <h3 className="font-medium">School Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="schoolName">School Name</Label>
          <Input id="schoolName" value={schoolSettings.schoolName} onChange={handleSchoolChange} placeholder="Enter school name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="schoolEmail">School Email</Label>
          <Input id="schoolEmail" type="email" value={schoolSettings.schoolEmail} onChange={handleSchoolChange} placeholder="Enter school email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="schoolPhone">School Phone</Label>
          <Input id="schoolPhone" type="tel" value={schoolSettings.schoolPhone} onChange={handleSchoolChange} placeholder="Enter school phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="schoolAddress">School Address</Label>
          <Input id="schoolAddress" value={schoolSettings.schoolAddress} onChange={handleSchoolChange} placeholder="Enter school address" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolAbout">About School</Label>
        <textarea id="schoolAbout" className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm" value={schoolSettings.schoolAbout} onChange={handleSchoolChange} placeholder="Enter school description" />
      </div>

      <div className="flex justify-end">
        <Button onClick={onSaveSchool} disabled={saving}>
          {saving ? 'Saving...' : 'Save School Information'}
        </Button>
      </div>
    </div>
  );
}
