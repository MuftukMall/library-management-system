'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  LayoutDashboard,
  Users,
  Armchair,
  Building2,
  Layers,
  CreditCard,
  MessageCircle,
  Settings,
  Search,
} from 'lucide-react';
import { useAppStore, type Page } from '@/store/appStore';

const navItems: { page: Page; label: string; icon: React.ElementType; shortcut: string }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'D' },
  { page: 'members', label: 'Members', icon: Users, shortcut: 'M' },
  { page: 'seats', label: 'Seats', icon: Armchair, shortcut: 'S' },
  { page: 'floors', label: 'Floors', icon: Building2, shortcut: 'F' },
  { page: 'sections', label: 'Sections', icon: Layers, shortcut: 'E' },
  { page: 'payments', label: 'Payments', icon: CreditCard, shortcut: 'P' },
  { page: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, shortcut: 'W' },
  { page: 'settings', label: 'Settings', icon: Settings, shortcut: 'T' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { setCurrentPage } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = navItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = useCallback((page: Page) => {
    setCurrentPage(page);
    setOpen(false);
  }, [setCurrentPage]);

  // Reset search and selectedIndex when dialog closes
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, []);

  // Reset selectedIndex when search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].page);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-0 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="border-0 shadow-none focus-visible:ring-0 h-8 p-0 text-sm"
          />
        </div>
        <div className="max-h-64 overflow-y-auto py-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => handleSelect(item.page)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {item.shortcut}
                  </kbd>
                </button>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-center px-4 py-2 border-t bg-muted/30">
          <kbd className="text-[10px] font-mono text-muted-foreground bg-background border rounded px-1.5 py-0.5 mr-1">↑↓</kbd>
          <span className="text-[10px] text-muted-foreground mr-3">navigate</span>
          <kbd className="text-[10px] font-mono text-muted-foreground bg-background border rounded px-1.5 py-0.5 mr-1">↵</kbd>
          <span className="text-[10px] text-muted-foreground mr-3">open</span>
          <kbd className="text-[10px] font-mono text-muted-foreground bg-background border rounded px-1.5 py-0.5 mr-1">esc</kbd>
          <span className="text-[10px] text-muted-foreground">close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}