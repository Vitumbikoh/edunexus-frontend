import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  User,
  Home,
  Users,
  BookOpen,
  Calendar,
  Settings,
  DollarSign,
  LogOut,
  Check,
  Upload,
  FileText,
  Award,
  Download,
  ChartPie,
  MessageSquare,
  CreditCard,
  FileText as ReportIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type NavItem = {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: UserRole[];
};

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['admin', 'teacher', 'student', 'parent'] },
  { label: 'View Students', icon: Users, href: '/students/view', roles: ['admin', 'teacher'] },
  { label: 'Add Students', icon: Users, href: '/students/add', roles: ['admin'] },
  { label: 'View Teachers', icon: User, href: '/teachers/view', roles: ['admin'] },
  { label: 'Add Teachers', icon: User, href: '/teachers/add', roles: ['admin'] },
  { label: 'View Courses', icon: BookOpen, href: '/courses/view', roles: ['admin', 'teacher', 'student'] },
  { label: 'Add Courses', icon: BookOpen, href: '/courses/add', roles: ['admin'] },
  { label: 'View Exams', icon: BookOpen, href: '/courses/exams', roles: ['admin', 'teacher'] },
  { label: 'Exam Results', icon: Award, href: '/courses/exam-results', roles: ['admin'] },
  { label: 'View Classes', icon: Calendar, href: '/classes/view', roles: ['admin', 'teacher', 'student'] },
  { label: 'View Schedules', icon: Calendar, href: '/schedules/view', roles: ['admin', 'teacher', 'student'] },
  { label: 'Financial Records', icon: DollarSign, href: '/finance', roles: ['admin', 'parent'] },
  { label: 'Financial Officers', icon: User, href: '/finance/officers/view', roles: ['admin'] },
  { label: 'Add Financial Officers', icon: User, href: '/finance/officers/add', roles: ['admin'] },
  { label: 'Reports', icon: ReportIcon, href: '/reports', roles: ['admin'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['admin'] },
];

const teacherNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['teacher'] },
  { label: 'My Students', icon: Users, href: '/my-students', roles: ['teacher'] },
  { label: 'My Courses', icon: BookOpen, href: '/my-courses', roles: ['teacher'] },
  { label: 'Submit Grades', icon: Award, href: '/submit-grades', roles: ['teacher'] },
  { label: 'My Schedule', icon: Calendar, href: '/my-schedule', roles: ['teacher'] },
  { label: 'Take Attendance', icon: Check, href: '/take-attendance', roles: ['teacher'] },
  { label: 'Learning Materials', icon: Upload, href: '/learning-materials', roles: ['teacher'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['teacher'] },
];

const studentNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['student'] },
  { label: 'My Courses', icon: BookOpen, href: '/courses', roles: ['student'] },
  { label: 'Assignments', icon: FileText, href: '/assignments', roles: ['student'] },
  { label: 'Grades', icon: Award, href: '/grades', roles: ['student'] },
  { label: 'Schedule', icon: Calendar, href: '/schedule', roles: ['student'] },
  { label: 'Learning Materials', icon: Download, href: '/materials', roles: ['student'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['student'] },
];

const parentNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['parent'] },
  { label: "Children's Performance", icon: ChartPie, href: '/children/performance', roles: ['parent'] },
  { label: 'Attendance', icon: Users, href: '/attendance', roles: ['parent'] },
  { label: 'Finance', icon: DollarSign, href: '/parent/finance', roles: ['parent'] },
  { label: 'Messages', icon: MessageSquare, href: '/messages', roles: ['parent'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['parent'] },
];

const financeNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['finance'] },
  { label: 'Finance Summary', icon: DollarSign, href: '/finance', roles: ['finance'] },
  { label: 'Transactions', icon: CreditCard, href: '/finance/transactions', roles: ['finance'] },
  { label: 'Invoices', icon: FileText, href: '/finance/invoices', roles: ['finance'] },
  { label: 'Reports', icon: ChartPie, href: '/finance/reports', roles: ['finance'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['finance'] },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { open } = useSidebar();

  if (!user) return null;

  let navItems = adminNavItems;

  if (user.role === 'teacher') {
    navItems = teacherNavItems;
  } else if (user.role === 'student') {
    navItems = studentNavItems;
  } else if (user.role === 'parent') {
    navItems = parentNavItems;
  } else if (user.role === 'finance') {
    navItems = financeNavItems;
  }

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user.role)
  );

  const isActive = (href: string) => location.pathname === href;

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">SA</span>
          </div>
          {open && (
            <div>
              <h2 className="text-lg font-semibold">Schomas Academy</h2>
              <p className="text-sm text-muted-foreground capitalize">{user.role} Dashboard</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className="w-full justify-start"
                  >
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start text-muted-foreground hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4 mr-3" />
          {open && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}