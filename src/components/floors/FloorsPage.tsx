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
  Building2,
  Layers,
  Armchair,
  Loader2,
} from 'lucide-react';

interface Floor {
  id: string;
  name: string;
  sectionCount: number;
  seatCount: number;
}

export function FloorsPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [floorName, setFloorName] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: floors = [], isLoading } = useQuery<Floor[]>({
    queryKey: ['floors'],
    queryFn: () => fetch('/api/floors').then((r) => r.json()).then((d) => (d.floors || []).map((f: Record<string, unknown>) => ({ ...f, sectionCount: f._count?.sections || 0, seatCount: f._count?.seats || 0 }))),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const res = await fetch('/api/floors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: floorName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add floor');
      return data;
    },
    onSuccess: () => { toast.success('Floor added successfully'); setAddOpen(false); setFloorName(''); queryClient.invalidateQueries({ queryKey: ['floors'] }); },
    onError: (e) => toast.error(e.message),
    onSettled: () => setLoading(false),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const res = await fetch(`/api/floors/${selectedFloor!.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: floorName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update floor');
      return data;
    },
    onSuccess: () => { toast.success('Floor updated successfully'); setEditOpen(false); setFloorName(''); queryClient.invalidateQueries({ queryKey: ['floors'] }); },
    onError: (e) => toast.error(e.message),
    onSettled: () => setLoading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/floors/${selectedFloor!.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete floor');
      }
    },
    onSuccess: () => { toast.success('Floor deleted successfully'); setDeleteOpen(false); queryClient.invalidateQueries({ queryKey: ['floors'] }); },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (floor: Floor) => {
    setSelectedFloor(floor);
    setFloorName(floor.name);
    setEditOpen(true);
  };

  return (
    <div className="space-y-4 page-enter">
      {/* Gradient header */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-700 to-teal-600 p-3 md:p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Floors</h2>
              <p className="text-sm text-white/70">Manage your library floors</p>
            </div>
          </div>
          {floors.length > 0 && (
            <Button size="sm" onClick={() => { setFloorName(''); setAddOpen(true); }}
              className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Plus className="h-4 w-4 mr-1" /> Add Floor
            </Button>
          )}
        </div>
      </div>

      {floors.length > 0 && !isLoading && (
        <Button size="sm" onClick={() => { setFloorName(''); setAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Floor
        </Button>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : floors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">No floors yet</p>
          <p className="text-xs mt-1 text-muted-foreground/70">Add your first floor to get started</p>
          <Button size="sm" className="mt-4" onClick={() => { setFloorName(''); setAddOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Your First Floor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {floors.map((floor, index) => (
            <motion.div
              key={floor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover-card-lift hover:scale-[1.02] group border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{floor.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {floor.sectionCount || 0} sections
                          </span>
                          <span className="flex items-center gap-1">
                            <Armchair className="w-3 h-3" />
                            {floor.seatCount || 0} seats
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(floor)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedFloor(floor); setDeleteOpen(true); }}>
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

      {/* Add Floor Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Floor</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Floor Name</Label>
            <Input
              placeholder="e.g., Ground Floor"
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && floorName && addMutation.mutate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={loading || !floorName}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Floor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Floor Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Floor</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Floor Name</Label>
            <Input
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && floorName && editMutation.mutate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => editMutation.mutate()} disabled={loading || !floorName}>
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
            <AlertDialogTitle>Delete Floor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedFloor?.name}&quot;? This will also delete all sections and seats in this floor.
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