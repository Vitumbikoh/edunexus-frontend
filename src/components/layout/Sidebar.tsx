import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  User,
  Home,
  Users,
  BookOpen,
  Calendar,
  Settings,
  DollarSign,
  ChevronLeft,
  Check,
  Upload,
  FileText,
  Award,
  Download,
  ChartPie,
  MessageSquare,
  CreditCard,
  ChevronDown,
  FileText as ReportIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

type SubNavItem = {
  label: string;
  href: string;
  roles: UserRole[];
};

type NavItem = {
  label: string;
  icon: React.ElementType;
  href?: string;
  roles: UserRole[];
  subItems?: SubNavItem[];
};

const adminNavItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    label: "Students",
    icon: Users,
    roles: ["admin", "teacher"],
    subItems: [
      {
        label: "View Students",
        href: "/students/view",
        roles: ["admin", "teacher"],
      },
      { label: "Add Students", href: "/students/add", roles: ["admin"] },
    ],
  },
  {
    label: "Teachers",
    icon: User,
    roles: ["admin"],
    subItems: [
      { label: "View Teachers", href: "/teachers/view", roles: ["admin"] },
      { label: "Add Teachers", href: "/teachers/add", roles: ["admin"] },
    ],
  },
  {
    label: "Courses",
    icon: BookOpen,
    roles: ["admin", "teacher", "student"],
    subItems: [
      {
        label: "View Courses",
        href: "/courses/view",
        roles: ["admin", "teacher", "student"],
      },
      { label: "Add Courses", href: "/courses/add", roles: ["admin"] },
      {
        label: "View Exams",
        href: "/courses/exams",
        roles: ["admin", "teacher"],
      },
      {
        label: "View Exam Results",
        href: "/courses/exam-results",
        roles: ["admin"],
      },
      {
        label: "View Grades Report",
        href: "/courses/grades-report",
        roles: ["admin"],
      },
    ],
  },
  {
    label: "Library",
    icon: BookOpen,
    roles: ["admin", "teacher", "student", "finance"],
    subItems: [
      { label: "Catalog", href: "/library/catalog", roles: ["admin", "teacher", "student", "finance"] },
      { label: "Borrowings", href: "/library/borrowings", roles: ["admin", "teacher", "finance"] },
      { label: "Reports", href: "/library/reports", roles: ["admin", "finance"] },
    ],
  },

  {
    label: "Finance",
    icon: DollarSign,
    roles: ["admin", "parent"],
    subItems: [
      {
        label: "View Financial Records",
        href: "/finance",
        roles: ["admin", "parent"],
      },
      {
        label: "Financial Reports",
        href: "/finance/reports",
        roles: ["admin"],
      },
      {
        label: "Finance Approvals",
        href: "/finance/approvals",
        roles: ["admin"],
      },
      {
        label: "View Financial Officers",
        href: "/finance/officers/view",
        roles: ["admin"],
      },
      {
        label: "Add Financial Officers",
        href: "/finance/officers/add",
        roles: ["admin"],
      },
    ],
  },
  {
    label: "Setups",
    icon: Calendar,
    roles: ["admin", "teacher", "student"],
    subItems: [
      {
        label: "View Classes",
        href: "/classes/view",
        roles: ["admin", "teacher", "student"],
      },
      {
        label: "Academic Calendar",
        href: "/setups/academic-calendar",
        roles: ["admin"],
      },
      // { label: 'Add Classes', href: '/classes/add', roles: ['admin'] },
      {
        label: "Schedule Management",
        href: "/schedules/view",
        roles: ["admin", "teacher", "student"],
      },
      {
        label: "Grading Format",
        href: "/admin/grading-format",
        roles: ["admin"],
      },
      // { label: 'Add Schedules', href: '/schedules/add', roles: ['admin'] },
    ],
  },
  { label: "Reports", icon: ReportIcon, href: "/reports", roles: ["admin"] },
  { label: "Settings", icon: Settings, href: "/settings", roles: ["admin"] },
];

const teacherNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, href: "/dashboard", roles: ["teacher"] },
  {
    label: "My Students",
    icon: Users,
    href: "/my-students",
    roles: ["teacher"],
  },
  {
    label: "My Courses",
    icon: Users,
    roles: ["admin", "teacher"],
    subItems: [
      {
        label: "View Courses",
        href: "/my-courses",
        roles: ["admin", "teacher"],
      },
      {
        label: "View Exams",
        href: "/teacher/exams",
        roles: ["teacher"],
      },
      {
        label: "Weighting Scheme",
        href: "/teacher/course-scheme",
        roles: ["teacher"],
      },
      {
        label: "Aggregated Results",
        href: "/teacher/aggregated-results",
        roles: ["teacher"],
      },
      
      { label: "Submit Grades", href: "/submit-grades", roles: ["teacher"] },
    ],
  },
  {
    label: "My Schedule",
    icon: Calendar,
    href: "/my-schedule",
    roles: ["teacher"],
  },
  {
    label: "Attendance",
    icon: Check,
    roles: ["teacher"],
    subItems: [
      {
        label: "Take Attendance",
        href: "/take-attendance",
        roles: ["teacher"],
      },
      {
        label: "View Attendance",
        href: "/teacher/attendance/view",
        roles: ["teacher"],
      },
    ],
  },
  {
    label: "Learning Materials",
    icon: Upload,
    href: "/learning-materials",
    roles: ["teacher"],
  },

  { label: "Settings", icon: Settings, href: "/settings", roles: ["teacher"] },
];

const studentNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, href: "/dashboard", roles: ["student"] },
  { label: "My Courses", icon: BookOpen, href: "/courses", roles: ["student"] },
  { label: "Exam Results", icon: Award, href: "/grades", roles: ["student"] },
  { label: "Schedule", icon: Calendar, href: "/schedule", roles: ["student"] },
  { label: "Settings", icon: Settings, href: "/settings", roles: ["student"] },
];

const parentNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, href: "/dashboard", roles: ["parent"] },
  {
    label: "Children's Performance",
    icon: ChartPie,
    href: "/children/performance",
    roles: ["parent"],
  },
  { label: "Attendance", icon: Users, href: "/attendance", roles: ["parent"] },
  {
    label: "Finance",
    icon: DollarSign,
    href: "/parent/finance",
    roles: ["parent"],
  },
  {
    label: "Messages",
    icon: MessageSquare,
    href: "/messages",
    roles: ["parent"],
  },
  { label: "Settings", icon: Settings, href: "/settings", roles: ["parent"] },
];

const financeNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, href: "/dashboard", roles: ["finance"] },
  {
    label: "Finance Summary",
    icon: DollarSign,
    href: "/finance",
    roles: ["finance"],
  },
  {
    label: "Transactions",
    icon: CreditCard,
    href: "/finance/transactions",
    roles: ["finance"],
  },
  {
    label: "Expenses",
    icon: FileText,
    href: "/finance/expenses",
    roles: ["finance"],
  },
  {
    label: "Reports",
    icon: ChartPie,
    href: "/finance/reports",
    roles: ["finance"],
  },
  { label: "Settings", icon: Settings, href: "/settings", roles: ["finance"] },
];

export default function Sidebar() {
  const { isOpen, toggle } = useSidebar();
  const { user } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  if (!user) return null;

  let navItems = adminNavItems;

  if (user.role === "teacher") {
    navItems = teacherNavItems;
  } else if (user.role === "student") {
    navItems = studentNavItems;
  } else if (user.role === "parent") {
    navItems = parentNavItems;
  } else if (user.role === "finance") {
    navItems = financeNavItems;
  }

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(label)
        ? [] // Close all dropdowns if the clicked one is already open
        : [label] // Open only the clicked dropdown and close all others
    );
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-screen bg-background flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 border-r border-border shadow-sm",
          isOpen ? "w-64" : "w-16"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-background">
          <div
            className={cn(
              "flex items-center",
              isOpen ? "justify-start" : "justify-center w-full"
            )}
          >
            <div className="rounded-lg bg-primary w-8 h-8 flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">
                SA
              </span>
            </div>
            {isOpen && (
              <span className="ml-3 font-semibold text-foreground">
                Schomas Academy
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className={cn("h-8 w-8", isOpen ? "" : "hidden")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {filteredNavItems.map((item) => (
              <div key={item.label}>
                {item.subItems ? (
                  <div>
                    {!isOpen ? (
                      // When sidebar is minimized, use popover for dropdown items
                      <Popover>
                        <PopoverTrigger asChild>
                          <div
                            className={cn(
                              "flex items-center px-3 py-3 text-base font-medium rounded-md hover:bg-accent hover:text-accent-foreground group transition-all duration-200 cursor-pointer justify-center"
                            )}
                          >
                            <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="w-56 p-2">
                          <div className="space-y-1">
                            <h4 className="font-medium text-sm text-foreground mb-2">
                              {item.label}
                            </h4>
                            {item.subItems
                              .filter((subItem) =>
                                subItem.roles.includes(user.role)
                              )
                              .map((subItem) => (
                                <Link
                                  key={subItem.href}
                                  to={subItem.href}
                                  className="block px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                                >
                                  {subItem.label}
                                </Link>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      // When sidebar is expanded, use normal dropdown
                      <>
                        <div
                          className={cn(
                            "flex items-center px-3 py-3 text-base font-medium rounded-md hover:bg-accent hover:text-accent-foreground group transition-all duration-200 cursor-pointer"
                          )}
                          onClick={() => toggleDropdown(item.label)}
                        >
                          <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                          <span className="ml-3 flex-1">{item.label}</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform text-muted-foreground",
                              openDropdowns.includes(item.label) && "rotate-180"
                            )}
                          />
                        </div>
                        {openDropdowns.includes(item.label) && (
                          <div className="ml-4 mt-1 space-y-1 border-l border-border pl-4">
                            {item.subItems
                              .filter((subItem) =>
                                subItem.roles.includes(user.role)
                              )
                              .map((subItem) => (
                                <Link
                                  key={subItem.href}
                                  to={subItem.href}
                                  className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground group transition-all duration-200"
                                >
                                  <span>{subItem.label}</span>
                                </Link>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : !isOpen ? (
                  // Add tooltip for regular items when sidebar is minimized
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href!}
                        className={cn(
                          "flex items-center px-3 py-3 text-base font-medium rounded-md hover:bg-accent hover:text-accent-foreground group transition-all duration-200 justify-center"
                        )}
                      >
                        <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    to={item.href!}
                    className={cn(
                      "flex items-center px-3 py-3 text-base font-medium rounded-md hover:bg-accent hover:text-accent-foreground group transition-all duration-200"
                    )}
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                    <span className="ml-3">{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </TooltipProvider>
  );
}
