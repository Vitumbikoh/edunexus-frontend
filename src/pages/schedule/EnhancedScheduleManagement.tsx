import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import WeeklyScheduleGrid from '@/components/schedule/WeeklyScheduleGrid';
import TeacherScheduleView from '@/components/schedule/TeacherScheduleView';
import ScheduleImportExport from '@/components/schedule/ScheduleImportExport';
import { 
  Calendar,
  Upload,
  Eye,
  Settings
} from "lucide-react";

export default function EnhancedScheduleManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  // Define available tabs based on user role
  const getAvailableTabs = () => {
    const tabs = [];

    if (isAdmin) {
      tabs.push(
        { value: 'grid', label: 'Weekly Grid', icon: Calendar, description: 'Manage class schedules' },
        { value: 'import', label: 'Import/Export', icon: Upload, description: 'Bulk operations' }
      );
    }

    if (isTeacher || isAdmin) {
      tabs.push(
        { value: 'teacher', label: 'Teacher View', icon: Eye, description: 'View teacher schedules' }
      );
    }

    return tabs;
  };

  const availableTabs = getAvailableTabs();

  if (availableTabs.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            You don't have permission to access schedule management features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-muted-foreground">
            Professional timetable management with conflict detection and bulk operations
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={isAdmin ? "default" : "secondary"}>
            {user?.role?.toUpperCase()}
          </Badge>
          {isAdmin && <Badge variant="outline">Full Access</Badge>}
          {isTeacher && <Badge variant="outline">Teacher View</Badge>}
        </div>
      </div>

      {/* Role-based Tab Interface */}
      <Tabs defaultValue={availableTabs[0]?.value} className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-auto">
          {availableTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs opacity-80">{tab.description}</div>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Admin: Weekly Grid Management */}
        {isAdmin && (
          <TabsContent value="grid" className="space-y-6">
            <WeeklyScheduleGrid />
          </TabsContent>
        )}

        {/* Admin: Import/Export */}
        {isAdmin && (
          <TabsContent value="import" className="space-y-6">
            <ScheduleImportExport />
          </TabsContent>
        )}

        {/* Teacher/Admin: Teacher Schedule View */}
        {(isTeacher || isAdmin) && (
          <TabsContent value="teacher" className="space-y-6">
            <TeacherScheduleView />
          </TabsContent>
        )}
      </Tabs>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {isAdmin && (
          <>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Weekly Grid</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Visual weekly timetable with drag-and-drop editing, real-time conflict detection, and bulk operations.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Upload className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Import/Export</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Bulk import from Excel/CSV files with validation, and professional CSV exports for sharing.
              </p>
            </div>
          </>
        )}

        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Teacher View</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Professional teacher schedule display with filtering, exports, and mobile-friendly interface.
          </p>
        </div>

        {isAdmin && (
          <>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Conflict Management</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatic detection of teacher, class, and room conflicts with detailed validation messages.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold">Multi-Tenant</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                School-level data isolation ensures schedules never conflict across different institutions.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-5 w-5 text-teal-600" />
                <h3 className="font-semibold">Professional Output</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Export schedules as CSV, ready for PDF generation and professional printing.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}