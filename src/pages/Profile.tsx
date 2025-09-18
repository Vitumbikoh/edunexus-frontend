
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';
import { useToast } from '@/components/ui/use-toast';

const mockActivities = [
  { id: 1, action: "Logged in", date: "April 20, 2023 - 08:45 AM" },
  { id: 2, action: "Updated profile information", date: "April 19, 2023 - 02:30 PM" },
  { id: 3, action: "Submitted grade reports", date: "April 18, 2023 - 03:15 PM" },
  { id: 4, action: "Created new assignment", date: "April 17, 2023 - 11:00 AM" },
  { id: 5, action: "Logged in", date: "April 17, 2023 - 08:30 AM" },
];

export default function Profile() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Profile fetch failed:', response.status, errorText);
          throw new Error(`Failed to fetch profile: ${response.status} ${errorText}`);
        }

        const profileData = await response.json();
        console.log('Profile data received:', profileData); // Debug log
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        });
        // Fallback to user data from auth context
        setProfile(user);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, user, toast]);
  
  // Use profile data if available, otherwise fallback to user data
  const displayData = profile || user;
  console.log('Display data:', displayData); // Debug log
  console.log('Phone fields:', { phone: displayData.phone, phoneNumber: displayData.phoneNumber }); // Debug log
  
  if (!user) return null;
  
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getDisplayName = () => {
    if (loading) return "Loading...";
    
    // For profile data, try different field combinations
    if (displayData.firstName && displayData.lastName) {
      return `${displayData.firstName} ${displayData.lastName}`;
    }
    if (displayData.fullName) {
      return displayData.fullName;
    }
    return displayData.name || displayData.email?.split('@')[0] || 'User';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">View and manage your profile information</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and manage your profile information</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={displayData.avatar || displayData.profilePicture} alt={getDisplayName()} />
              <AvatarFallback>{getInitials(getDisplayName())}</AvatarFallback>
            </Avatar>
            
            <h2 className="text-xl font-bold">{getDisplayName()}</h2>
            <p className="text-muted-foreground capitalize">{displayData.role}</p>
            <p className="text-sm mt-1">{displayData.email}</p>
            
            <div className="mt-6 w-full">
              <Button className="w-full">Edit Profile</Button>
            </div>
            
            <div className="mt-8 w-full space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">User ID:</span>
                <span>{displayData.id || displayData.userId}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Role:</span>
                <span className="capitalize">{displayData.role}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-500">{displayData.status || 'Active'}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Joined:</span>
                <span>{displayData.createdAt ? new Date(displayData.createdAt).toLocaleDateString() : 'March 15, 2023'}</span>
              </div>
              {/* Always show phone section for debugging */}
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Phone:</span>
                <span>{displayData.phone || displayData.phoneNumber || 'no phone number'}</span>
              </div>
              {/* Debug: Always show phone section */}
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Debug Phone:</span>
                <span>
                  phone: "{displayData.phone}", 
                  phoneNumber: "{displayData.phoneNumber}", 
                  result: "{displayData.phone || displayData.phoneNumber || 'no phone number'}"
                </span>
              </div>
              {displayData.department && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Department:</span>
                  <span>{displayData.department}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="activity">
              <TabsList className="mb-4">
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity">
                <div className="space-y-4">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 border-b pb-4">
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="stats">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.role === 'teacher' && (
                    <>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Classes Taught</h3>
                          <p className="text-3xl font-bold mt-2">12</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Students</h3>
                          <p className="text-3xl font-bold mt-2">248</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Assignments Created</h3>
                          <p className="text-3xl font-bold mt-2">56</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Average Rating</h3>
                          <p className="text-3xl font-bold mt-2">4.8/5.0</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                  
                  {user.role === 'student' && (
                    <>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Current GPA</h3>
                          <p className="text-3xl font-bold mt-2">3.8</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Attendance</h3>
                          <p className="text-3xl font-bold mt-2">95%</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Assignments Completed</h3>
                          <p className="text-3xl font-bold mt-2">42/45</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Extracurricular Activities</h3>
                          <p className="text-3xl font-bold mt-2">3</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                  
                  {user.role === 'admin' && (
                    <>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Total Logins</h3>
                          <p className="text-3xl font-bold mt-2">152</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Reports Generated</h3>
                          <p className="text-3xl font-bold mt-2">48</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">System Changes</h3>
                          <p className="text-3xl font-bold mt-2">86</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Users Managed</h3>
                          <p className="text-3xl font-bold mt-2">1,280</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                  
                  {user.role === 'parent' && (
                    <>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Children</h3>
                          <p className="text-3xl font-bold mt-2">2</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Teacher Meetings</h3>
                          <p className="text-3xl font-bold mt-2">8</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Messages Sent</h3>
                          <p className="text-3xl font-bold mt-2">24</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Fee Payments</h3>
                          <p className="text-3xl font-bold mt-2">12</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="preferences">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold mb-2">Email Notifications</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch id="email-news" defaultChecked />
                          <Label htmlFor="email-news">School news and updates</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="email-events" defaultChecked />
                          <Label htmlFor="email-events">Upcoming events</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="email-grades" defaultChecked />
                          <Label htmlFor="email-grades">Grade updates</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-bold mb-2">System Preferences</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch id="show-status" defaultChecked />
                          <Label htmlFor="show-status">Show online status</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="app-notifs" defaultChecked />
                          <Label htmlFor="app-notifs">In-app notifications</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="sound-notifs" />
                          <Label htmlFor="sound-notifs">Sound notifications</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button>Save Preferences</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
