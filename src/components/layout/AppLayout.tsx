'use client';

import { useEffect, useState } from 'react';
import { useAppStore, type Page } from '@/store/appStore';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NotificationBell } from './NotificationBell';
import { CommandPalette } from './CommandPalette';
import {
  LayoutDashboard,
  Users,
  Armchair,
  Building2,
  Layers,
  CreditCard,
  MessageCircle,
  Settings,
  Moon,
  Sun,
  LogOut,
  BookOpen,
  CircleHelp,
  Search,
} from 'lucide-react';

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'members', label: 'Members', icon: Users },
  { page: 'seats', label: 'Seats', icon: Armchair },
  { page: 'floors', label: 'Floors', icon: Building2 },
  { page: 'sections', label: 'Sections', icon: Layers },
  { page: 'payments', label: 'Payments', icon: CreditCard },
  { page: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { page: 'settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentPage, setCurrentPage, setAuthenticated } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [libraryName, setLibraryName] = useState('Library Management System');
  const [stats, setStats] = useState({ members: 0, seats: 0 });

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.libraryName) setLibraryName(data.libraryName);
      })
      .catch(() => {});

    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => {
        setStats({
          members: data.activeMembers || 0,
          seats: data.totalSeats || 0,
        });
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        {/* Gradient header */}
        <SidebarHeader className="p-4 bg-gradient-to-r from-primary/20 via-sidebar to-transparent">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-600 text-sidebar-primary-foreground shrink-0 shadow-lg shadow-primary/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-sm text-sidebar-foreground truncate">
                {libraryName}
              </span>
              <span className="text-[11px] text-sidebar-foreground/60">Management System</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = currentPage === item.page;
                  return (
                    <SidebarMenuItem key={item.page}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setCurrentPage(item.page)}
                        tooltip={item.label}
                        className="relative"
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                        )}
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Enhanced footer with stats */}
        <SidebarFooter className="p-3">
          <div className="group-data-[collapsible=icon]:hidden space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Quick Stats</span>
            </div>
            <div className="flex items-center gap-3 px-1">
              <div className="flex items-center gap-1.5 text-[11px] text-sidebar-foreground/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {stats.members} members
              </div>
              <span className="text-sidebar-foreground/20">•</span>
              <div className="flex items-center gap-1.5 text-[11px] text-sidebar-foreground/70">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                {stats.seats} seats
              </div>
            </div>
            <Separator className="!bg-sidebar-border/50" />
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-sidebar-foreground/40">
                &copy; {new Date().getFullYear()}
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="text-[10px] text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors flex items-center gap-1"
                    onClick={() => {
                      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <CircleHelp className="w-3 h-3" />
                    <span>Help</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Scroll to top</TooltipContent>
              </Tooltip>
            </div>
          </div>
          {/* Collapsed state: just show the help icon */}
          <div className="group-data-[collapsible=icon]:flex hidden justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors p-1"
                  onClick={() => {
                    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <CircleHelp className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Back to top</TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />

          <Separator orientation="vertical" className="h-6" />

          {/* Breadcrumb with current page name */}
          <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            <span className="text-muted-foreground">{libraryName}</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-medium">{navItems.find((i) => i.page === currentPage)?.label || 'Dashboard'}</span>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <NotificationBell />

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground"
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
              }}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>

        <footer className="border-t px-4 md:px-6 py-3 mt-auto">
          <p className="text-xs text-muted-foreground text-center">
            Library Management System &copy; {new Date().getFullYear()} &middot; Built with care
          </p>
        </footer>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}