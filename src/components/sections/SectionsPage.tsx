'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Layers,
  Armchair,
  Users,
  Loader2,
} from 'lucide-react';

interface Section {
  id: string;
  name: string;
  floorId: string;
  floorName?: string;
  seatCount: number;
  memberCount: number;
}

interface Floor {
  id: string;
  name: string;
}

export function SectionsPage() {
  const queryClient = useQueryClient();
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [form, setForm] = useState({ name: '', floorId: '' });
  const [loading, setLoading] = useState(false);

  const { data: floors = [] } = useQuery<Floor[]>({
    queryKey: ['floors'],
    queryFn: () => fetch('/api/floors').then((r) => r.json()).then((d) => d.floors),
  });

  const { data: sections = [], isLoading } = useQuery<Section[]>({
    queryKey: ['sections', floorFilter],
    queryFn: () => {
      const params = floorFilter !== 'all' ? `?floorId=${floorFilter}` : '';
      return fetch(`/api/sections${params}`).then((r) => r.json()).then((d) => (d.sections || []).map((s: Record<string, unknown>) => ({ ...s, floorName: (s.floor as Record<string, unknown>)?.name, seatCount: (s._count as Record<string, unknown>)?.seats || 0, memberCount: (s._count as Record<string, unknown>)?.members || 0 })));
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const res = await fetch('/api/sections', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add section');
      return data;
    },
    onSuccess: () => { toast.success('Section added successfully'); setAddOpen(false); setForm({ name: '', floorId: '' }); queryClient.invalidateQueries({ queryKey: ['sections'] }); },
    onError: (e) => toast.error(e.message),
    onSettled: () => setLoading(false),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const res = await fetch(`/api/sections/${selectedSection!.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update section');
      return data;
    },
    onSuccess: () => { toast.success('Section updated successfully'); setEditOpen(false); queryClient.invalidateQueries({ queryKey: ['sections'] }); },
    onError: (e) => toast.error(e.message),
    onSettled: () => setLoading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sections/${selectedSection!.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete section');
      }
    },
    onSuccess: () => { toast.success('Section deleted successfully'); setDeleteOpen(false); queryClient.invalidateQueries({ queryKey: ['sections'] }); },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (section: Section) => {
    setSelectedSection(section);
    setForm({ name: section.name, floorId: section.floorId });
    setEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Sections</h3>
          <p className="text-sm text-muted-foreground">Manage library sections by floor</p>
        </div>
        <div className="flex gap-2">
          <Select value={floorFilter} onValueChange={setFloorFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Floors" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floors.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => { setForm({ name: '', floorId: '' }); setAddOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Section
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Layers className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No sections found</p>
          <p className="text-xs mt-1">Add a section to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{section.name}</h4>
                        <p className="text-xs text-muted-foreground">{section.floorName || ''}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Armchair className="w-3 h-3" />
                            {section.seatCount || 0} seats
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {section.memberCount || 0} members
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(section)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedSection(section); setDeleteOpen(true); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Section Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Floor *</Label>
              <Select value={form.floorId} onValueChange={(v) => setForm((p) => ({ ...p, floorId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select floor" /></SelectTrigger>
                <SelectContent>
                  {floors.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section Name *</Label>
              <Input
                placeholder="e.g., Reading Area"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && form.name && form.floorId && addMutation.mutate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={loading || !form.name || !form.floorId}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Floor</Label>
              <Select value={form.floorId} onValueChange={(v) => setForm((p) => ({ ...p, floorId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {floors.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => editMutation.mutate()} disabled={loading || !form.name}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedSection?.name}&quot;? This will also delete all seats in this section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}