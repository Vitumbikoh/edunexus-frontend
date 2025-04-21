
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Save } from "lucide-react";

// Mock data - Weekly schedule
const weekSchedule = [
  {
    day: "Monday",
    periods: [
      { time: "08:00 - 09:00", subject: "Mathematics", teacher: "Dr. Amanda Lewis", room: "101" },
      { time: "09:10 - 10:10", subject: "English", teacher: "Mrs. Elizabeth Chen", room: "203" },
      { time: "10:20 - 11:20", subject: "Physics", teacher: "Prof. Richard Thomas", room: "Lab 3" },
      { time: "11:30 - 12:30", subject: "History", teacher: "Mr. James Wilson", room: "105" },
      { time: "13:30 - 14:30", subject: "Computer Science", teacher: "Dr. Maria Rodriguez", room: "CompLab" },
    ]
  },
  {
    day: "Tuesday",
    periods: [
      { time: "08:00 - 09:00", subject: "Biology", teacher: "Dr. Emily Chen", room: "Lab 2" },
      { time: "09:10 - 10:10", subject: "Mathematics", teacher: "Dr. Amanda Lewis", room: "101" },
      { time: "10:20 - 11:20", subject: "English", teacher: "Mrs. Elizabeth Chen", room: "203" },
      { time: "11:30 - 12:30", subject: "Physical Education", teacher: "Mr. Robert Johnson", room: "Gym" },
      { time: "13:30 - 14:30", subject: "Chemistry", teacher: "Prof. Richard Thomas", room: "Lab 1" },
    ]
  },
  {
    day: "Wednesday",
    periods: [
      { time: "08:00 - 09:00", subject: "History", teacher: "Mr. James Wilson", room: "105" },
      { time: "09:10 - 10:10", subject: "Physics", teacher: "Prof. Richard Thomas", room: "Lab 3" },
      { time: "10:20 - 11:20", subject: "Mathematics", teacher: "Dr. Amanda Lewis", room: "101" },
      { time: "11:30 - 12:30", subject: "Computer Science", teacher: "Dr. Maria Rodriguez", room: "CompLab" },
      { time: "13:30 - 14:30", subject: "English", teacher: "Mrs. Elizabeth Chen", room: "203" },
    ]
  },
  {
    day: "Thursday",
    periods: [
      { time: "08:00 - 09:00", subject: "Mathematics", teacher: "Dr. Amanda Lewis", room: "101" },
      { time: "09:10 - 10:10", subject: "Chemistry", teacher: "Prof. Richard Thomas", room: "Lab 1" },
      { time: "10:20 - 11:20", subject: "English", teacher: "Mrs. Elizabeth Chen", room: "203" },
      { time: "11:30 - 12:30", subject: "Physical Education", teacher: "Mr. Robert Johnson", room: "Gym" },
      { time: "13:30 - 14:30", subject: "History", teacher: "Mr. James Wilson", room: "105" },
    ]
  },
  {
    day: "Friday",
    periods: [
      { time: "08:00 - 09:00", subject: "English", teacher: "Mrs. Elizabeth Chen", room: "203" },
      { time: "09:10 - 10:10", subject: "Computer Science", teacher: "Dr. Maria Rodriguez", room: "CompLab" },
      { time: "10:20 - 11:20", subject: "Mathematics", teacher: "Dr. Amanda Lewis", room: "101" },
      { time: "11:30 - 12:30", subject: "Biology", teacher: "Dr. Emily Chen", room: "Lab 2" },
      { time: "13:30 - 14:30", subject: "Physical Education", teacher: "Mr. Robert Johnson", room: "Gym" },
    ]
  },
];

// Mock data for form selects
const mockTeachers = [
  { id: "1", name: "Dr. Amanda Lewis" },
  { id: "2", name: "Mrs. Elizabeth Chen" },
  { id: "3", name: "Prof. Richard Thomas" },
  { id: "4", name: "Mr. James Wilson" },
  { id: "5", name: "Dr. Maria Rodriguez" },
  { id: "6", name: "Mr. Robert Johnson" },
  { id: "7", name: "Dr. Emily Chen" },
];

const mockSubjects = [
  { id: "1", name: "Mathematics" },
  { id: "2", name: "English" },
  { id: "3", name: "Physics" },
  { id: "4", name: "Chemistry" },
  { id: "5", name: "Biology" },
  { id: "6", name: "History" },
  { id: "7", name: "Computer Science" },
  { id: "8", name: "Physical Education" },
];

const mockRooms = [
  { id: "1", name: "101" },
  { id: "2", name: "203" },
  { id: "3", name: "Lab 1" },
  { id: "4", name: "Lab 2" },
  { id: "5", name: "Lab 3" },
  { id: "6", name: "105" },
  { id: "7", name: "CompLab" },
  { id: "8", name: "Gym" },
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function Schedule() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = React.useState("10A");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    day: "",
    time: "",
    subject: "",
    teacher: "",
    room: "",
  });
  
  const canCreateSchedule = user?.role === "admin";

  const handleAddPeriod = () => {
    console.log("Adding new period:", newPeriod);
    // In a real app, this would save to the backend
    // For now just close the dialog
    setIsDialogOpen(false);
    // Reset form
    setNewPeriod({
      day: "",
      time: "",
      subject: "",
      teacher: "",
      room: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground">View weekly class schedules</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select defaultValue={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="9A">Class 9A</SelectItem>
              <SelectItem value="9B">Class 9B</SelectItem>
              <SelectItem value="10A">Class 10A</SelectItem>
              <SelectItem value="10B">Class 10B</SelectItem>
              <SelectItem value="11A">Class 11A</SelectItem>
              <SelectItem value="11B">Class 11B</SelectItem>
            </SelectContent>
          </Select>

          {canCreateSchedule && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> 
                  Create Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Period</DialogTitle>
                  <DialogDescription>
                    Create a new class period for the selected class.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="day">Day</Label>
                    <Select 
                      value={newPeriod.day} 
                      onValueChange={(value) => setNewPeriod({...newPeriod, day: value})}
                    >
                      <SelectTrigger id="day">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day) => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Input 
                      id="time" 
                      placeholder="e.g., 09:00 - 10:00" 
                      value={newPeriod.time}
                      onChange={(e) => setNewPeriod({...newPeriod, time: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select 
                      value={newPeriod.subject}
                      onValueChange={(value) => setNewPeriod({...newPeriod, subject: value})}
                    >
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="teacher">Teacher</Label>
                    <Select 
                      value={newPeriod.teacher}
                      onValueChange={(value) => setNewPeriod({...newPeriod, teacher: value})}
                    >
                      <SelectTrigger id="teacher">
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTeachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.name}>{teacher.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="room">Room</Label>
                    <Select 
                      value={newPeriod.room}
                      onValueChange={(value) => setNewPeriod({...newPeriod, room: value})}
                    >
                      <SelectTrigger id="room">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockRooms.map((room) => (
                          <SelectItem key={room.id} value={room.name}>{room.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddPeriod}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Period
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        {weekSchedule.map((day) => (
          <Card key={day.day}>
            <CardHeader>
              <CardTitle>{day.day}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {day.periods.map((period, idx) => (
                  <Card key={idx} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="text-sm font-semibold">{period.time}</div>
                      <div className="text-base font-bold mt-1">{period.subject}</div>
                      <div className="text-sm text-muted-foreground mt-1">{period.teacher}</div>
                      <div className="text-sm text-muted-foreground">Room: {period.room}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
