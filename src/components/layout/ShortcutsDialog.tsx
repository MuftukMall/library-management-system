'use client';

import { useEffect } from 'react';
import { useAppStore, type Page } from '@/store/appStore';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Moon,
  PanelLeft,
  Command,
} from 'lucide-react';

const pageShortcuts: { page: Page; label: string; num: number }[] = [
  { page: 'dashboard', label: 'Dashboard', num: 1 },
  { page: 'members', label: 'Members', num: 2 },
  { page: 'seats', label: 'Seats', num: 3 },
  { page: 'floors', label: 'Floors', num: 4 },
  { page: 'sections', label: 'Sections', num: 5 },
  { page: 'payments', label: 'Payments', num: 6 },
  { page: 'whatsapp', label: 'WhatsApp', num: 7 },
  { page: 'reports', label: 'Reports', num: 8 },
  { page: 'activity', label: 'Activity', num: 9 },
  { page: 'settings', label: 'Settings', num: 0 },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="text-[11px] font-mono text-muted-foreground bg-muted border rounded px-1.5 py-0.5 shadow-sm">
      {children}
    </kbd>
  );
}

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { setCurrentPage } = useAppStore();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const num = parseInt(e.key);
        if (num >= 0 && num <= 9) {
          e.preventDefault();
          const shortcut = pageShortcuts.find((s) => s.num === num);
          if (shortcut) {
            setCurrentPage(shortcut.page);
            onOpenChange(false);
          }
          return;
        }
        if (e.key === 'd') {
          e.preventDefault();
          setTheme(theme === 'dark' ? 'light' : 'dark');
          return;
        }
        if (e.key === 'b') {
          e.preventDefault();
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }));
          return;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setCurrentPage, setTheme, theme, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="w-5 h-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* General */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">General</p>
            <div className="space-y-2">
              <ShortcutRow icon={Search} label="Search / Command Palette" shortcut={<><Kbd>⌘</Kbd> <Kbd>K</Kbd></>} />
              <ShortcutRow icon={Moon} label="Toggle Dark Mode" shortcut={<><Kbd>⌘</Kbd> <Kbd>D</Kbd></>} />
              <ShortcutRow icon={PanelLeft} label="Toggle Sidebar" shortcut={<><Kbd>⌘</Kbd> <Kbd>B</Kbd></>} />
            </div>
          </div>

          <Separator />

          {/* Navigation */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Navigation</p>
            <div className="space-y-2">
              {pageShortcuts.map((s) => (
                <ShortcutRow key={s.page} label={s.label} shortcut={<><Kbd>⌘</Kbd> <Kbd>{s.num}</Kbd></>} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutRow({ icon: Icon, label, shortcut }: { icon?: React.ElementType; label: string; shortcut: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1 px-1 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-0.5">{shortcut}</div>
    </div>
  );
}