
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function Schedule() {
  const [selectedClass, setSelectedClass] = React.useState("10A");

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
