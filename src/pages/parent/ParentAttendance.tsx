
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export default function ParentAttendance() {
  // Always show dummy data for demo purposes
  const children = [
    {
      id: 'child-1',
      name: 'Emma Johnson',
      grade: 'Grade 9',
      attendance: { total: 120, present: 88, absent: 8, late: 4 },
    },
    {
      id: 'child-2',
      name: 'Alex Johnson',
      grade: 'Grade 7',
      attendance: { total: 110, present: 92, absent: 5, late: 3 },
    },
  ];

  // Generate mock attendance data for the last 30 days
  const generateAttendanceData = (child) => {
    const today = new Date();
    const attendanceData = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Random status - mostly present, some absent, few late
      let status;
      const rand = Math.random();
      if (rand > 0.9) status = 'absent';
      else if (rand > 0.8) status = 'late';
      else status = 'present';
      
      // Don't show attendance for weekends
      const day = date.getDay();
      if (day !== 0 && day !== 6) {
        attendanceData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          status,
          day: date.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }
    }
    
    return attendanceData.slice(-10); // Show only the last 10 school days
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
          <p className="text-muted-foreground mt-2">Track your children's daily attendance and punctuality</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            Current semester
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {children.map((child) => (
          <Card key={child.id}>
            <CardHeader>
              <CardTitle>{child.name}'s Attendance</CardTitle>
              <CardDescription>Current academic year</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Attendance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Present</div>
                  <div className="text-2xl font-bold text-green-600">{Math.round((child.attendance.present / child.attendance.total) * 100)}%</div>
                  <Progress value={Math.round((child.attendance.present / child.attendance.total) * 100)} className="h-2 mt-2" />
                </div>
                
                <div className="bg-background p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Absent</div>
                  <div className="text-2xl font-bold text-red-500">{child.attendance.absent}</div>
                  <div className="text-sm text-muted-foreground mt-2">days</div>
                </div>
                
                <div className="bg-background p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground">Late</div>
                  <div className="text-2xl font-bold text-amber-500">{child.attendance.late}</div>
                  <div className="text-sm text-muted-foreground mt-2">days</div>
                </div>
              </div>
              
              {/* Recent Attendance */}
              <div>
                <h3 className="text-lg font-medium mb-4">Recent Attendance</h3>
                <Table>
                  <TableCaption>Attendance for the last 10 school days</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generateAttendanceData(child).map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.day}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={
                            record.status === 'present' ? 'default' :
                            record.status === 'late' ? 'secondary' : 'destructive'
                          } className="capitalize">
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
