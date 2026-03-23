import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Activity,
  User,
  Home,
  Users,
  BookOpen,
  Calendar,
  CalendarDays,
  Settings,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  FileText,
  Award,
  ChartPie,
  MessageSquare,
  CreditCard,
  Library,
  Building2,
  BarChart3,
  Bell,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { termService } from "@/services/termService";
import { messageService } from "@/services/messageService";
import { useSchoolPackage } from "@/hooks/useSchoolPackage";
import { useIsMobile } from "@/hooks/use-mobile";

type SubNavItem = {
  label: string;
  href: string;
  roles: UserRole[];
  icon?: React.ElementType;
  description?: string;
};

type NavItem = {
  label: string;
  icon: React.ElementType;
  href?: string;
  roles: UserRole[];
  subItems?: SubNavItem[];
  /** When set, renders a section heading above this item */
  sectionTitle?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN NAV
// ─────────────────────────────────────────────────────────────────────────────
const adminNavItems: NavItem[] = [
  // ── Main Menu ──────────────────────────────────────────────
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    roles: ["admin"],
    sectionTitle: "Main Menu",
  },
  {
    label: "Students",
    icon: Users,
    roles: ["admin"],
    subItems: [
      { label: "View Students", href: "/students/view", roles: ["admin"] },
      { label: "Add Students",  href: "/students/add",  roles: ["admin"] },
    ],
  },
  {
    label: "Teachers",
    icon: User,
    roles: ["admin"],
    subItems: [
      { label: "View Teachers", href: "/teachers/view", roles: ["admin"] },
      { label: "Add Teachers",  href: "/teachers/add",  roles: ["admin"] },
    ],
  },
  {
    label: "Courses",
    icon: BookOpen,
    roles: ["admin"],
    subItems: [
      { label: "View Courses", href: "/courses/view", roles: ["admin"] },
      { label: "Add Courses",  href: "/courses/add",  roles: ["admin"] },
    ],
  },
  {
    label: "Exams",
    icon: FileText,
    roles: ["admin"],
    subItems: [
      { label: "View Exams",         href: "/courses/exams",            roles: ["admin"] },
      { label: "View Exam Results",  href: "/courses/exam-results",     roles: ["admin"] },
      { label: "View Grades Report", href: "/courses/grades-report",    roles: ["admin"] },
      { label: "Exam Rewards",       href: "/exams/rewards",            roles: ["admin"] },
      { label: "Student Progression",href: "/exams/student-progression",roles: ["admin"] },
    ],
  },
  // ── Management ─────────────────────────────────────────────
  {
    label: "Finance",
    icon: DollarSign,
    roles: ["admin"],
    sectionTitle: "Management",
    subItems: [
      { label: "View Financial Records",  href: "/finance",                       roles: ["admin"] },
      { label: "Expense Management",      href: "/finance/expenses",              roles: ["admin"] },
      { label: "Financial Reports",       href: "/finance/reports",               roles: ["admin"] },
      { label: "Graduated Outstanding",   href: "/finance/graduated-outstanding", roles: ["admin"] },
      { label: "View Financial Officers", href: "/finance/officers/view",         roles: ["admin"] },
    ],
  },
  {
    label: "Payroll",
    icon: Users,
    roles: ["admin"],
    subItems: [
      { label: "Pay Components",   href: "/payroll/components", roles: ["admin"] },
      { label: "Staff Assignments",href: "/payroll/assignments", roles: ["admin"] },
      { label: "Salary Run",       href: "/payroll",            roles: ["admin"] },
      { label: "Payroll Approvals",href: "/finance/approvals?tab=payroll",  roles: ["admin"] },
    ],
  },
  {
    label: "Library",
    icon: Library,
    roles: ["admin"],
    subItems: [
      { label: "Catalog",    href: "/library/catalog",    roles: ["admin"] },
      { label: "Borrowings", href: "/library/borrowings", roles: ["admin"] },
      { label: "Returnings", href: "/library/returnings", roles: ["admin"] },
    ],
  },
  {
    label: "Hostel",
    icon: Building2,
    roles: ["admin"],
    subItems: [
      { label: "Manage Hostels", href: "/hostel/manage", roles: ["admin"] },
      { label: "Allocate Rooms", href: "/hostel/allocate", roles: ["admin"] },
    ],
  },
  {
    label: "Setups",
    icon: Calendar,
    roles: ["admin"],
    subItems: [
      { label: "View Classes",        href: "/classes/view",          roles: ["admin"] },
      { label: "Schedule Management", href: "/schedules/view",        roles: ["admin"] },
      { label: "Grading Format",      href: "/admin/grading-format",  roles: ["admin"] },
      { label: "Weighting Scheme",    href: "/admin/weighting-scheme",roles: ["admin"] },
    ],
  },
  { label: "Reports", icon: BarChart3, href: "/reports", roles: ["admin"] },
  // ── Communications ─────────────────────────────────────────
  {
    label: "Notices",
    icon: Bell,
    href: "/notifications",
    roles: ["admin"],
    sectionTitle: "Communications",
  },
  { label: "Messages", icon: MessageSquare, href: "/messages", roles: ["admin"] },
  // ── System ─────────────────────────────────────────────────
  {
    label: "Settings",
    icon: Settings,
    roles: ["admin"],
    sectionTitle: "System",
    subItems: [
      { label: "System Settings", href: "/settings/system", roles: ["admin"] },
      { label: "Password Settings", href: "/settings/password", roles: ["admin"] },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER NAV
// ─────────────────────────────────────────────────────────────────────────────
const teacherNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, href: "/dashboard", roles: ["teacher"] },
  { label: "My Students", icon: Users, href: "/my-students", roles: ["teacher"] },
  {
    label: "My Courses",
    icon: BookOpen,
    roles: ["teacher"],
    subItems: [
      { label: "View Courses",         href: "/my-courses",                  roles: ["teacher"] },
      { label: "View Exams",           href: "/teacher/exams",               roles: ["teacher"] },
      { label: "Weighting Scheme",     href: "/teacher/course-scheme",       roles: ["teacher"] },
      { label: "Aggregated Results",   href: "/teacher/aggregated-results",  roles: ["teacher"] },
      { label: "Submit Grades",        href: "/submit-grades",               roles: ["teacher"] },
    ],
  },
  { label: "My Schedule", icon: Calendar, href: "/my-schedule", roles: ["teacher"] },
  {
    label: "Attendance",
    icon: Check,
    roles: ["teacher"],
    subItems: [
      { label: "Take Attendance", href: "/take-attendance",          roles: ["teacher"] },
      { label: "View Attendance", href: "/teacher/attendance/view",  roles: ["teacher"] },
    ],
  },
  { label: "Learning Materials", icon: Upload, href: "/learning-materials", roles: ["teacher"] },
  {
    label: "Notices",
    icon: Bell,
    href: "/notifications",
    roles: ["teacher"],
    sectionTitle: "Communications",
  },
  { label: "Messages", icon: MessageSquare, href: "/messages", roles: ["teacher"] },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["teacher"],
    sectionTitle: "System",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT NAV
// ─────────────────────────────────────────────────────────────────────────────
const studentNavItems: NavItem[] = [
  { label: "Dashboard",         icon: Home,      href: "/dashboard", roles: ["student"] },
  { label: "My Courses",        icon: BookOpen,  href: "/courses",   roles: ["student"] },
  { label: "Exam Results",      icon: Award,     href: "/grades",    roles: ["student"] },
  { label: "Schedule",          icon: Calendar,  href: "/schedule",  roles: ["student"] },
  { label: "Learning Materials",icon: FileText,  href: "/materials", roles: ["student"] },
  {
    label: "Notices",
    icon: Bell,
    href: "/notifications",
    roles: ["student"],
    sectionTitle: "Communications",
  },
  { label: "Messages", icon: MessageSquare, href: "/messages", roles: ["student"] },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["student"],
    sectionTitle: "System",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PARENT NAV
// ─────────────────────────────────────────────────────────────────────────────
const parentNavItems: NavItem[] = [
  { label: "Dashboard",             icon: Home,       href: "/dashboard",          roles: ["parent"] },
  { label: "Children's Performance",icon: ChartPie,   href: "/children/performance",roles: ["parent"] },
  { label: "Attendance",            icon: Users,      href: "/attendance",          roles: ["parent"] },
  { label: "Finance",               icon: DollarSign, href: "/parent/finance",      roles: ["parent"] },
  {
    label: "Notices",
    icon: Bell,
    href: "/notifications",
    roles: ["parent"],
    sectionTitle: "Communications",
  },
  { label: "Messages", icon: MessageSquare, href: "/messages", roles: ["parent"] },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["parent"],
    sectionTitle: "System",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE NAV
// ─────────────────────────────────────────────────────────────────────────────
const financeNavItems: NavItem[] = [
  { label: "Dashboard",     icon: Home,       href: "/dashboard",          roles: ["finance"] },
  { label: "Finance Summary",icon: DollarSign, href: "/finance",            roles: ["finance"] },
  { label: "Transactions",  icon: CreditCard, href: "/finance/transactions",roles: ["finance"] },
  { label: "Expenses",      icon: FileText,   href: "/finance/expenses",    roles: ["finance"] },
  { label: "Payroll",       icon: Users,      href: "/payroll",             roles: ["finance"] },
  { label: "Reports",       icon: ChartPie,   href: "/finance/reports",     roles: ["finance"] },
  {
    label: "Notices",
    icon: Bell,
    href: "/notifications",
    roles: ["finance"],
    sectionTitle: "Communications",
  },
  { label: "Messages", icon: MessageSquare, href: "/messages", roles: ["finance"] },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["finance"],
    sectionTitle: "System",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRINCIPAL NAV (READ-ONLY)
// ─────────────────────────────────────────────────────────────────────────────
const principalNavItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    roles: ["principal"],
    sectionTitle: "Executive Overview",
  },
  { label: "Reports", icon: BarChart3, href: "/reports", roles: ["principal"] },
  { label: "Activities", icon: Activity, href: "/activities", roles: ["principal"] },
  {
    label: "Notices",
    icon: Bell,
    href: "/notifications",
    roles: ["principal"],
    sectionTitle: "Communications",
  },
  { label: "Messages", icon: MessageSquare, href: "/messages", roles: ["principal"] },
  {
    label: "Profile",
    icon: User,
    href: "/profile",
    roles: ["principal"],
    sectionTitle: "System",
  },
];

// Light-mode sidebar background (dark mode falls back to theme bg)
const SIDEBAR_LIGHT_CLS = "bg-sidebarbrand dark:bg-background";

export default function Sidebar() {
  const { isOpen, toggle, close } = useSidebar();
  const { user, token } = useAuth();
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
  const {
    canAccessFinance,
    canAccessLibrary,
    canAccessHostel,
    isLoading: packageLoading,
  } = useSchoolPackage();
  const isMobile = useIsMobile();
  const isExpanded = isMobile ? true : isOpen;

  const handleNavigation = () => {
    if (isMobile) {
      close();
    }
  };

  // Fetch active term for the bottom pinned section
  const { data: terms = [] } = useQuery({
    queryKey: ["sidebar-terms", user?.id, token],
    queryFn: async () => {
      const authToken = token || localStorage.getItem("access_token") || (user as any)?.token || "";
      if (!authToken) return [];
      return termService.getTerms(authToken);
    },
    enabled: !!user && !!(token || localStorage.getItem("access_token") || (user as any)?.token),
    staleTime: 5 * 60 * 1000,
  });

  const activeTerm = terms.find(
    (t) => t.isActive || t.isCurrent || t.current
  );

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ["sidebar-unread-messages", user?.id],
    queryFn: async () => {
      const authToken = token || localStorage.getItem("access_token") || "";
      if (!authToken) return 0;
      const result = await messageService.getInbox(authToken);
      return result.unreadCount || 0;
    },
    enabled: !!user,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  if (!user) return null;

  let navItems = adminNavItems;
  if (user.role === "teacher")       navItems = teacherNavItems;
  else if (user.role === "student")  navItems = studentNavItems;
  else if (user.role === "parent")   navItems = parentNavItems;
  else if (user.role === "finance")  navItems = financeNavItems;
  else if (user.role === "principal") navItems = principalNavItems;

  const filteredNavItems = navItems
    .filter((item) => item.roles.includes(user.role))
    .filter((item) => {
      // Avoid hiding links during initial package fetch to reduce UI flicker.
      if (packageLoading || user.role === 'super_admin') return true;

      if (user.role === 'admin') {
        if (item.label === 'Finance' && !canAccessFinance) return false;
        if (item.label === 'Library' && !canAccessLibrary) return false;
        if (item.label === 'Hostel' && !canAccessHostel) return false;
      }

      if (user.role === 'finance' && !canAccessFinance) {
        return false;
      }

      return true;
    });

  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(label) ? [] : [label]
    );
  };

  const isItemActive = (href?: string) => {
    if (!href) return false;
    const path = href.split("?")[0];
    return location.pathname === path;
  };

  // ── Shared item renderer ─────────────────────────────────────
  const renderNavItem = (item: { label: string; icon: React.ElementType; href?: string; subItems?: SubNavItem[]; sectionTitle?: string }, depth = 0) => {
    const Icon = item.icon;
    const active = isItemActive(item.href);

    if (item.subItems && item.subItems.length > 0) {
      const filteredSubs = item.subItems.filter((s) => s.roles.includes(user.role));
      if (filteredSubs.length === 0) return null;

      if (!isExpanded) {
        // Minimized — popover
        return (
          <Popover key={item.label}>
            <PopoverTrigger asChild>
              <button
                aria-label={item.label}
                className="flex w-full items-center justify-center rounded-md px-2 py-2.5 text-white/80 hover:bg-white/10 hover:text-white dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground transition-colors"
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-60 p-2 bg-white dark:bg-card shadow-xl border border-border">
              {/* Settings header inside popover */}
              {item.label === "Settings" && (
                <div className="mb-3 px-2">
                  <p className="font-semibold text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">Manage your account settings and preferences.</p>
                </div>
              )}
              {!item.sectionTitle || item.label !== "Settings" ? (
                <h4 className="mb-2 px-2 text-sm font-semibold text-foreground">{item.label}</h4>
              ) : null}
              <div className="space-y-0.5">
                {filteredSubs.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <Link
                      key={sub.href}
                      to={sub.href}
                      onClick={handleNavigation}
                      className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {SubIcon && <SubIcon className="h-4 w-4 flex-shrink-0" />}
                      <div>
                        <span className="font-medium">{sub.label}</span>
                        {sub.description && (
                          <p className="text-xs text-muted-foreground">{sub.description}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        );
      }

      // Expanded — dropdown
      const isOpen_ = openDropdowns.includes(item.label);
      const isSettings = item.label === "Settings";

      return (
        <div key={item.label}>
          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
              active
                ? "bg-white/15 text-white dark:bg-accent dark:text-accent-foreground"
                : "text-white/90 hover:bg-white/10 hover:text-white dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
            )}
            onClick={() => toggleDropdown(item.label)}
          >
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
            <div className="flex-1 text-left">
              <span>{item.label}</span>
              {isSettings && (
                <p className="text-xs text-white/50 dark:text-muted-foreground font-normal leading-tight">
                  Manage your account settings and preferences.
                </p>
              )}
            </div>
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 flex-shrink-0 transition-transform text-white/50 dark:text-muted-foreground",
                isOpen_ && "rotate-90"
              )}
            />
          </button>

          {isOpen_ && (
            <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/10 dark:border-border pl-3">
              {filteredSubs.map((sub) => {
                const SubIcon = sub.icon;
                const subActive = isItemActive(sub.href);
                return (
                  <Link
                    key={sub.href}
                    to={sub.href}
                    onClick={handleNavigation}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-2 text-[13px] transition-colors",
                      subActive
                        ? "bg-white/15 text-white font-medium dark:bg-accent dark:text-accent-foreground"
                        : "text-white/70 hover:bg-white/10 hover:text-white dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
                    )}
                  >
                    {SubIcon && <SubIcon className="h-4 w-4 flex-shrink-0" />}
                    <div>
                      <span>{sub.label}</span>
                      {sub.description && (
                        <p className="text-xs text-white/40 dark:text-muted-foreground/70 leading-tight">{sub.description}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Simple link
    if (!isExpanded) {
      return (
        <Tooltip key={item.label}>
          <TooltipTrigger asChild>
            <Link
              to={item.href!}
              aria-label={item.label}
              onClick={handleNavigation}
              className={cn(
                "relative flex items-center justify-center rounded-md px-2 py-2.5 transition-colors",
                active
                  ? "bg-white/15 text-white dark:bg-accent dark:text-accent-foreground"
                  : "text-white/80 hover:bg-white/10 hover:text-white dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.href === "/messages" && unreadMessages > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        key={item.label}
        to={item.href!}
        onClick={handleNavigation}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
          active
            ? "bg-white/15 text-white dark:bg-accent dark:text-accent-foreground"
            : "text-white/90 hover:bg-white/10 hover:text-white dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
        )}
      >
        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
        <span>{item.label}</span>
        {item.href === "/messages" && unreadMessages > 0 && (
          <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0 text-[10px] font-semibold text-white leading-4">
            {unreadMessages > 99 ? "99+" : unreadMessages}
          </span>
        )}
      </Link>
    );
  };

  return (
    <TooltipProvider>
      {isMobile && isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-black/45"
          onClick={close}
        />
      ) : null}

      <div
        className={cn(
          "h-screen flex flex-col fixed left-0 top-0 border-r border-white/10 dark:border-border shadow-xl",
          "transition-all duration-300",
          SIDEBAR_LIGHT_CLS,
          isMobile
            ? cn(
                "z-50 w-72 max-w-[85vw]",
                isOpen ? "translate-x-0" : "-translate-x-full"
              )
            : cn("z-40", isOpen ? "w-56" : "w-16")
        )}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div
          className={cn(
            "h-16 flex items-center justify-between px-4 border-b border-white/10 dark:border-border flex-shrink-0",
            SIDEBAR_LIGHT_CLS
          )}
        >
          <div className={cn("flex items-center", isExpanded ? "justify-start" : "justify-center w-full")}>
            <div className="rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0">
              <img
                src="/polymilesicon.png"
                alt="edunexus"
                className="w-8 h-8 rounded-lg object-contain"
              />
            </div>
            {isExpanded && (
              <span className="ml-3 font-semibold text-white dark:text-foreground">EduNexus</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className={cn("h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-accent", !isOpen && "hidden")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {!isMobile && !isOpen && (
            <button
              onClick={toggle}
              className="absolute -right-3 top-16 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 dark:border-border bg-[hsl(222,60%,18%)] dark:bg-background text-white/60 dark:text-muted-foreground hover:text-white dark:hover:text-foreground shadow"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* ── Scrollable nav ──────────────────────────────── */}
        <ScrollArea className="flex-1 min-h-0 py-3">
          <nav className="px-2 space-y-0.5">
            {filteredNavItems.map((item) => (
              <div key={item.label}>
                {/* Section heading */}
                {item.sectionTitle && isExpanded && (
                  <div className="mt-4 mb-1 px-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/50 dark:text-muted-foreground">
                      {item.sectionTitle}
                    </p>
                  </div>
                )}
                {item.sectionTitle && !isExpanded && (
                  <div className="my-2 mx-2 border-t border-white/10 dark:border-border" />
                )}
                {renderNavItem(item)}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* ── Bottom pinned — Academic Calendar (non-scrollable) ── */}
        <div
          className={cn(
            "flex-shrink-0 border-t border-white/10 dark:border-border px-2 py-3",
            SIDEBAR_LIGHT_CLS
          )}
        >
          {isExpanded && (
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-widest text-white/50 dark:text-muted-foreground">
              Academic
            </p>
          )}

          {/* Academic Calendar link */}
          {isExpanded ? (
            <Link
              to="/setups/academic-calendar"
              onClick={handleNavigation}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
                isItemActive("/setups/academic-calendar")
                  ? "bg-white/15 text-white dark:bg-accent dark:text-accent-foreground"
                  : "text-white/90 hover:bg-white/10 hover:text-white dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
              )}
            >
              <CalendarDays className="h-[18px] w-[18px] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span>Academic Calendar</span>
                {activeTerm ? (
                  <p className="text-xs text-white/55 dark:text-muted-foreground truncate leading-snug mt-0.5 flex items-center gap-1 flex-wrap">
                    <span>
                      {[
                        activeTerm.name ?? activeTerm.term,
                        activeTerm.periodName ?? (activeTerm.termNumber ? `Term ${activeTerm.termNumber}` : null),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {(activeTerm.isActive || activeTerm.isCurrent || activeTerm.current) && (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-1.5 py-0 text-[10px] font-semibold text-emerald-300 dark:text-emerald-400 dark:bg-transparent dark:border dark:border-border leading-4">
                        Active
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-white/40 dark:text-muted-foreground/60 leading-snug mt-0.5">No active term</p>
                )}
              </div>
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/setups/academic-calendar"
                  onClick={handleNavigation}
                  className={cn(
                    "flex items-center justify-center rounded-md px-2 py-2.5 transition-colors",
                    isItemActive("/setups/academic-calendar")
                      ? "bg-white/15 text-white dark:bg-accent dark:text-accent-foreground"
                      : "text-white/80 hover:bg-white/10 hover:text-white dark:text-muted-foreground dark:hover:bg-accent"
                  )}
                >
                  <CalendarDays className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">Academic Calendar</p>
                {activeTerm && (
                  <p className="text-xs text-muted-foreground">
                    {[
                      activeTerm.name ?? activeTerm.term,
                      activeTerm.periodName ?? (activeTerm.termNumber ? `Term ${activeTerm.termNumber}` : null),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    {(activeTerm.isActive || activeTerm.isCurrent || activeTerm.current) && " (Active)"}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
