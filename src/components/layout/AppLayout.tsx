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

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.libraryName) setLibraryName(data.libraryName);
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
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
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
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.page}>
                    <SidebarMenuButton
                      isActive={currentPage === item.page}
                      onClick={() => setCurrentPage(item.page)}
                      tooltip={item.label}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-[11px] text-sidebar-foreground/50 leading-tight">
              Library Management System
            </p>
            <p className="text-[10px] text-sidebar-foreground/30 mt-0.5">
              &copy; {new Date().getFullYear()}
            </p>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />

          <Separator orientation="vertical" className="h-6" />

          <h2 className="text-sm font-medium truncate">
            {navItems.find((i) => i.page === currentPage)?.label || 'Dashboard'}
          </h2>

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
            Library Management System &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}