import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';
import AddStaffForm from './AddStaffForm';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Shield,
  Clock,
  BookOpen,
  GraduationCap,
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'teacher' | 'admin' | 'finance' | 'librarian' | 'super_admin';
  department: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  salary?: number;
  subjects?: string[];
  lastLogin?: string;
  qualifications?: string;
  yearsOfExperience?: number;
  canApproveBudgets?: boolean;
  canProcessPayments?: boolean;
}

interface StaffStats {
  total: number;
  active: number;
  teachers: number;
  admins: number;
  finance: number;
  librarians: number;
  newThisMonth: number;
  totalSalary: number;
}

interface PaginatedStaffResponse {
  staff: StaffMember[];
  totalPages: number;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  stats: StaffStats;
}

const StaffManagement: React.FC = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats>({
    total: 0,
    active: 0,
    teachers: 0,
    admins: 0,
    finance: 0,
    librarians: 0,
    newThisMonth: 0,
    totalSalary: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchPeriod, setSearchPeriod] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const itemsPerPage = 10;

  // Check if user has permission to manage staff
  const canManageStaff = user?.role === 'admin' || user?.role === 'super_admin';

  // Fetch staff data
  const fetchStaffData = async (page = 1, limit = itemsPerPage) => {
    if (!token || !canManageStaff) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (searchPeriod) params.append('search', searchPeriod);
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`${API_CONFIG.BASE_URL}/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch staff data: ${response.statusText}`);
      }

      const data: PaginatedStaffResponse = await response.json();
      
      setStaff(data.staff);
      setStats(data.stats);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to fetch staff data');
      toast({
        title: "Error",
        description: "Failed to load staff data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle staff status update
  const handleStatusUpdate = async (staffId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    if (!token) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/staff/${staffId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update staff status');
      }

      // Refresh the staff list
      await fetchStaffData(currentPage);
      
      toast({
        title: "Success",
        description: "Staff status updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast({
        title: "Error",
        description: "Failed to update staff status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle staff deletion
  const handleDeleteStaff = async (staffId: string) => {
    if (!token) return;

    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete staff member');
      }

      // Refresh the staff list
      await fetchStaffData(currentPage);
      
      toast({
        title: "Success",
        description: "Staff member deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast({
        title: "Error",
        description: "Failed to delete staff member. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchStaffData(1);
  }, [token, canManageStaff, roleFilter, statusFilter]);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchPeriod !== '') {
        fetchStaffData(1);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchPeriod]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchStaffData(page);
  };

  // Show loading state
  if (isLoading && staff.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading staff data...</span>
        </div>
      </div>
    );
  }

  // Show error state if user doesn't have permission
  if (!canManageStaff) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to manage staff members.</p>
        </div>
      </div>
    );
  }

  // Show add staff form
  if (showAddForm) {
    return (
      <AddStaffForm
        onBack={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false);
          fetchStaffData(1); // Refresh the list
        }}
      />
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-transparent border border-purple-300 text-purple-700 dark:text-purple-300 dark:border-purple-500/40';
      case 'admin':
        return 'bg-transparent border border-blue-300 text-blue-700 dark:text-blue-300 dark:border-blue-500/40';
      case 'teacher':
        return 'bg-transparent border border-green-300 text-green-700 dark:text-green-300 dark:border-green-500/40';
      case 'finance':
        return 'bg-transparent border border-yellow-300 text-yellow-700 dark:text-yellow-300 dark:border-yellow-500/40';
      case 'librarian':
        return 'bg-transparent border border-indigo-300 text-indigo-700 dark:text-indigo-300 dark:border-indigo-500/40';
      default:
        return 'bg-transparent border border-gray-300 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-transparent border border-green-300 text-green-700 dark:text-green-300 dark:border-green-500/40';
      case 'inactive':
        return 'bg-transparent border border-gray-300 text-gray-700 dark:text-gray-300';
      case 'suspended':
        return 'bg-transparent border border-red-300 text-red-700 dark:text-red-300 dark:border-red-500/40';
      default:
        return 'bg-transparent border border-gray-300 text-gray-700 dark:text-gray-300';
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Administrator';
      case 'teacher':
        return 'Teacher';
      case 'finance':
        return 'Finance Officer';
      case 'librarian':
        return 'Librarian';
      default:
        return role;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage staff members, roles, and permissions
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setShowAddForm(true)}>
          <UserPlus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {apiError && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {apiError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teachers}</div>
            <p className="text-xs text-muted-foreground">Teaching staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">Admin roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.finance}</div>
            <p className="text-xs text-muted-foreground">Finance staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">Recent hires</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Staff List</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search staff members..."
                      value={searchPeriod}
                      onChange={(e) => setSearchPeriod(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Staff List */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Members ({totalItems})</CardTitle>
              <CardDescription>
                Manage your institution's staff members and their details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && staff.length > 0 && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
              
              {staff.length === 0 && !isLoading ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No staff members found</h3>
                  <p className="text-muted-foreground">
                    {searchPeriod || roleFilter !== 'all' || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Start by adding your first staff member'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.firstName[0]}{member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {member.firstName} {member.lastName}
                            </h3>
                            <Badge className={getRoleColor(member.role)}>
                              {formatRole(member.role)}
                            </Badge>
                            <Badge className={getStatusColor(member.status)}>
                              {member.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {member.department}
                            </div>
                          </div>
                          {member.subjects && member.subjects.length > 0 && (
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {member.subjects.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          {member.salary && (
                            <div className="font-medium">${member.salary.toLocaleString()}</div>
                          )}
                          <div className="text-muted-foreground">
                            Joined {new Date(member.joinDate).toLocaleDateString()}
                          </div>
                          {member.lastLogin && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last login: {new Date(member.lastLogin).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="mr-2 h-4 w-4" />
                              Manage Permissions
                            </DropdownMenuItem>
                            {member.status === 'active' ? (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(member.id, 'inactive')}>
                                <Clock className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(member.id, 'active')}>
                                <Clock className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleStatusUpdate(member.id, 'suspended')}>
                              <Shield className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteStaff(member.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Staff
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>
                Configure roles and permissions for staff members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['super_admin', 'admin', 'teacher', 'finance', 'librarian'].map((role) => (
                  <div key={role} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{formatRole(role)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {staff.filter(s => s.role === role).length} members
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit Permissions
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded border border-green-300/60 text-green-700 dark:text-green-300 bg-transparent">✓ Dashboard Access</div>
                      <div className="p-2 rounded border border-green-300/60 text-green-700 dark:text-green-300 bg-transparent">✓ View Reports</div>
                      {role !== 'librarian' && (
                        <div className="p-2 rounded border border-green-300/60 text-green-700 dark:text-green-300 bg-transparent">✓ Manage Students</div>
                      )}
                      {(role === 'admin' || role === 'super_admin') && (
                        <div className="p-2 rounded border border-green-300/60 text-green-700 dark:text-green-300 bg-transparent">✓ Manage Staff</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Distribution by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['teacher', 'admin', 'finance', 'librarian'].map((role) => {
                    const count = staff.filter(s => s.role === role).length;
                    const percentage = staff.length > 0 ? (count / staff.length) * 100 : 0;
                    return (
                      <div key={role} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{formatRole(role)}</span>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(new Set(staff.map(s => s.department))).map((dept) => {
                    const count = staff.filter(s => s.department === dept).length;
                    const percentage = (count / staff.length) * 100;
                    return (
                      <div key={dept} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{dept}</span>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffManagement;
