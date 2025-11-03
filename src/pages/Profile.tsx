
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';
import { useToast } from '@/components/ui/use-toast';

interface ProfileActivity {
  id: string;
  action: string;
  date: string;
  description?: string;
}

interface ProfileStats {
  loginCount: number;
  lastLogin: string | null;
  accountAge: number;
  isActive: boolean;
  
  // Role-specific stats
  classesCount?: number;
  studentsCount?: number;
  assignmentsCreated?: number;
  averageRating?: number;
  currentGPA?: number;
  attendanceRate?: number;
  assignmentsCompleted?: number;
  activitiesCount?: number;
  reportsGenerated?: number;
  systemChanges?: number;
  usersManaged?: number;
  childrenCount?: number;
  meetingsAttended?: number;
  messagesExchanged?: number;
  paymentsCount?: number;
  transactionsProcessed?: number;
  expensesManaged?: number;
}

export default function Profile() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<ProfileActivity[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        
        // Fetch profile information
        const profileResponse = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!profileResponse.ok) {
          throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
        }

        const profileData = await profileResponse.json();
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

    fetchProfileData();
  }, [token, user, toast]);

  const fetchActivities = async () => {
    if (!token) return;
    
    try {
      setActivitiesLoading(true);
      console.log('Fetching activities from:', `${API_CONFIG.BASE_URL}/profile/activities?limit=10`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/profile/activities?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Activities response status:', response.status);
      
      if (response.ok) {
        const activitiesData = await response.json();
        console.log('Activities data received:', activitiesData);
        setActivities(activitiesData);
      } else {
        const errorText = await response.text();
        console.error('Activities fetch failed:', response.status, errorText);
        toast({
          title: "Error",
          description: `Failed to load activities: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive",
      });
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    
    try {
      setStatsLoading(true);
      console.log('Fetching stats from:', `${API_CONFIG.BASE_URL}/profile/stats`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/profile/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Stats response status:', response.status);
      
      if (response.ok) {
        const statsData = await response.json();
        console.log('Stats data received:', statsData);
        setStats(statsData);
      } else {
        const errorText = await response.text();
        console.error('Stats fetch failed:', response.status, errorText);
        toast({
          title: "Error",
          description: `Failed to load statistics: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  };
  
  // Use profile data if available, otherwise fallback to user data
  const displayData = profile || user;
  
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
                <span className="text-muted-foreground">Role:</span>
                <span className="capitalize">{displayData.role}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Status:</span>
                <span className={displayData.status === 'Active' ? 'text-green-500' : 'text-red-500'}>
                  {displayData.status || 'Active'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Joined:</span>
                <span>
                  {displayData.createdAt 
                    ? new Date(displayData.createdAt).toLocaleDateString()
                    : 'Unknown'
                  }
                </span>
              </div>
              {(displayData.phone || displayData.phoneNumber) && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{displayData.phone || displayData.phoneNumber}</span>
                </div>
              )}
              {displayData.department && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Department:</span>
                  <span>{displayData.department}</span>
                </div>
              )}
              {displayData.school && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">School:</span>
                  <span>{displayData.school.name}</span>
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
                  {!activities.length && !activitiesLoading && (
                    <Button 
                      onClick={fetchActivities}
                      variant="outline"
                      className="w-full"
                    >
                      Load Recent Activities
                    </Button>
                  )}
                  
                  {activitiesLoading && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  )}
                  
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 border-b pb-4">
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.date).toLocaleString()}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {activities.length === 0 && !activitiesLoading && activities.length > 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activities found.
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="stats">
                <div className="space-y-4">
                  {!stats && !statsLoading && (
                    <Button 
                      onClick={fetchStats}
                      variant="outline"
                      className="w-full"
                    >
                      Load Statistics
                    </Button>
                  )}
                  
                  {statsLoading && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  )}
                  
                  {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Base Stats for all users */}
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Total Logins</h3>
                          <p className="text-3xl font-bold mt-2">{stats.loginCount}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold">Account Age</h3>
                          <p className="text-3xl font-bold mt-2">{stats.accountAge} days</p>
                        </CardContent>
                      </Card>
                      
                      {/* Teacher specific stats */}
                      {user.role === 'teacher' && (
                        <>
                          <Card>
                            <CardContent className="p-6">
                              <h3 className="font-bold">Classes Taught</h3>
                              <p className="text-3xl font-bold mt-2">{stats.classesCount || 0}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-6">
                              <h3 className="font-bold">Students</h3>
                              <p className="text-3xl font-bold mt-2">{stats.studentsCount || 0}</p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                      
                      {/* Student specific stats */}
                      {user.role === 'student' && (
                        <>
                          <Card>
                            <CardContent className="p-6">
                              <h3 className="font-bold">Current GPA</h3>
                              <p className="text-3xl font-bold mt-2">{stats.currentGPA || 0}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-6">
                              <h3 className="font-bold">Attendance Rate</h3>
                              <p className="text-3xl font-bold mt-2">{stats.attendanceRate || 0}%</p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                      
                      {/* Admin specific stats */}
                      {(user.role === 'admin' || user.role === 'super_admin') && (
                        <>
                          <Card>
                            <CardContent className="p-6">
                              <h3 className="font-bold">Reports Generated</h3>
                              <p className="text-3xl font-bold mt-2">{stats.reportsGenerated || 0}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-6">
                              <h3 className="font-bold">Users Managed</h3>
                              <p className="text-3xl font-bold mt-2">{stats.usersManaged || 0}</p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                      
                      {/* Finance specific stats */}
                      {user.role === 'finance' && (
                        <>
                          <Card>
                            <CardContent className="p-6">
                              <h3 className="font-bold">Transactions Processed</h3>
                              <p className="text-3xl font-bold mt-2">{stats.transactionsProcessed || 0}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-6">
                              <h3 className="font-bold">Expenses Managed</h3>
                              <p className="text-3xl font-bold mt-2">{stats.expensesManaged || 0}</p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
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
