'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Pencil,
  Trash2,
  Armchair,
  Map,
  List,
  UserPlus,
  UserMinus,
  Loader2,
  Search,
  Eye,
  Check,
  User as UserIcon,
} from 'lucide-react';

interface Seat {
  id: string;
  seatNumber: string;
  floorId: string;
  floorName?: string;
  sectionId: string;
  sectionName?: string;
  status: 'available' | 'occupied';
  memberId?: string;
  memberName?: string;
}

interface Floor { id: string; name: string; }
interface Section { id: string; name: string; floorId: string; }

export function SeatsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [unassignOpen, setUnassignOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  // Form
  const [form, setForm] = useState({ seatNumber: '', floorId: '', sectionId: '' });
  const [memberSearch, setMemberSearch] = useState('');
  const [assignMemberId, setAssignMemberId] = useState('');
  const [loading, setLoading] = useState(false);

  // Queries
  const { data: floors = [] } = useQuery<Floor[]>({
    queryKey: ['floors'],
    queryFn: () => fetch('/api/floors').then((r) => r.json()).then((d) => d.floors),
  });

  const { data: sections = [] } = useQuery<Section[]>({
    queryKey: ['sections', floorFilter],
    queryFn: () => {
      const params = floorFilter !== 'all' ? `?floorId=${floorFilter}` : '';
      return fetch(`/api/sections${params}`).then((r) => r.json()).then((d) => d.sections);
    },
  });

  const { data: formSections = [] } = useQuery<Section[]>({
    queryKey: ['form-sections', form.floorId],
    queryFn: () => fetch(`/api/sections?floorId=${form.floorId}`).then((r) => r.json()).then((d) => d.sections),
    enabled: !!form.floorId,
  });

  const { data: seats = [], isLoading } = useQuery<Seat[]>({
    queryKey: ['seats', floorFilter, sectionFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (floorFilter !== 'all') params.set('floorId', floorFilter);
      if (sectionFilter !== 'all') params.set('sectionId', sectionFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const qs = params.toString();
      return fetch(`/api/seats${qs ? `?${qs}` : ''}`).then((r) => r.json()).then((d) => (d.seats || []).map((s: Record<string, unknown>) => ({ ...s, floorName: (s.floor as Record<string, unknown>)?.name, sectionName: (s.section as Record<string, unknown>)?.name, memberName: (s.member as Record<string, unknown>)?.name || null })));
    },
  });

  const { data: searchResults = [] } = useQuery<{ id: string; name: string; phone: string }[]>({
    queryKey: ['member-search', memberSearch],
    queryFn: () => fetch(`/api/members?search=${memberSearch}&limit=10`).then((r) => r.json()).then((d) => d.members || d || []),
    enabled: memberSearch.length >= 2,
  });

  const availableSections = viewMode === 'list' ? sections : formSections;

  // Group seats by section for map view
  const seatsBySection = seats.reduce<Record<string, Seat[]>>((acc, seat) => {
    const key = seat.sectionId || 'unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(seat);
    return acc;
  }, {});

  // Summary counts
  const totalSeats = seats.length;
  const occupiedSeats = seats.filter((s) => s.status === 'occupied').length;
  const availableSeatsCount = totalSeats - occupiedSeats;

  // Mutations
  const addMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const res = await fetch('/api/seats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add seat');
      return data;
    },
    onSuccess: () => { toast.success('Seat added successfully'); setAddOpen(false); setForm({ seatNumber: '', floorId: '', sectionId: '' }); queryClient.invalidateQueries({ queryKey: ['seats'] }); },
    onError: (e) => toast.error(e.message),
    onSettled: () => setLoading(false),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const res = await fetch(`/api/seats/${selectedSeat!.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update seat');
      return data;
    },
    onSuccess: () => { toast.success('Seat updated'); setEditOpen(false); queryClient.invalidateQueries({ queryKey: ['seats'] }); },
    onError: (e) => toast.error(e.message),
    onSettled: () => setLoading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/seats/${selectedSeat!.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete seat');
    },
    onSuccess: () => { toast.success('Seat deleted'); setDeleteOpen(false); queryClient.invalidateQueries({ queryKey: ['seats'] }); },
    onError: () => toast.error('Failed to delete seat'),
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const res = await fetch(`/api/seats/${selectedSeat!.id}/assign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: assignMemberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign seat');
      return data;
    },
    onSuccess: () => { toast.success('Seat assigned'); setAssignOpen(false); setMemberSearch(''); setAssignMemberId(''); queryClient.invalidateQueries({ queryKey: ['seats'] }); },
    onError: (e) => toast.error(e.message),
    onSettled: () => setLoading(false),
  });

  const unassignMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/seats/${selectedSeat!.id}/unassign`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to unassign seat');
    },
    onSuccess: () => { toast.success('Seat unassigned'); setUnassignOpen(false); queryClient.invalidateQueries({ queryKey: ['seats'] }); },
    onError: () => toast.error('Failed to unassign seat'),
  });

  const openEdit = (seat: Seat) => {
    setSelectedSeat(seat);
    setForm({ seatNumber: seat.seatNumber, floorId: seat.floorId, sectionId: seat.sectionId });
    setEditOpen(true);
  };

  return (
    <div className="space-y-4 page-enter">
      {/* Gradient header */}
      <div className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 p-4 md:p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Seats</h2>
            <p className="text-sm text-white/70 mt-0.5">Manage seat assignments and layout</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { setForm({ seatNumber: '', floorId: '', sectionId: '' }); setAddOpen(true); }}
              className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Plus className="h-4 w-4 mr-1" /> Add Seat
            </Button>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      {!isLoading && seats.length > 0 && (
        <div className="flex items-center gap-4 sm:gap-6 px-1 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
            <span className="text-muted-foreground">{totalSeats} Total</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">{occupiedSeats} Occupied</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{availableSeatsCount} Available</span>
          </span>
        </div>
      )}

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          <Select value={floorFilter} onValueChange={(v) => { setFloorFilter(v); setSectionFilter('all'); }}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="All Floors" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floors.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="All Sections" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {availableSections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Segmented control toggle */}
        <div className="inline-flex items-center rounded-lg border bg-muted/50 p-0.5 gap-0.5">
          <button
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'map'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setViewMode('map')}
          >
            <Map className="w-3.5 h-3.5" />
            Map
          </button>
          <button
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : seats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Armchair className="h-8 w-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">No seats found</p>
          <p className="text-xs mt-1 text-muted-foreground/70">Adjust filters or add new seats to get started</p>
        </div>
      ) : viewMode === 'map' ? (
        /* Seat Map View */
        <div className="space-y-6">
          {Object.entries(seatsBySection).map(([sectionId, sectionSeats]) => (
            <div key={sectionId}>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {sectionSeats[0]?.sectionName || `Section ${sectionId}`}
                <Badge variant="secondary" className="text-[10px] font-normal px-1.5">
                  {sectionSeats.filter((s) => s.status === 'occupied').length}/{sectionSeats.length}
                </Badge>
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {sectionSeats.map((seat, index) => (
                  <motion.div
                    key={seat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg animate-pulse-glow ${
                        seat.status === 'occupied'
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/60 dark:border-amber-800/40'
                          : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200/60 dark:border-emerald-800/40'
                      }`}
                      onClick={() => { setSelectedSeat(seat); setViewOpen(true); }}
                    >
                      <CardContent className="p-2 text-center">
                        {seat.status === 'available' ? (
                          <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <UserIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          </div>
                        )}
                        <p className="text-xs font-medium">{seat.seatNumber}</p>
                        {seat.memberName && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{seat.memberName}</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-4 h-3 rounded bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border border-emerald-200/60 dark:border-emerald-800/40" />
              Available
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-3 rounded bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-200/60 dark:border-amber-800/40" />
              Occupied
            </span>
          </div>
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seat No.</TableHead>
                    <TableHead className="hidden sm:table-cell">Floor</TableHead>
                    <TableHead className="hidden md:table-cell">Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Member</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seats.map((seat, idx) => (
                    <TableRow key={seat.id} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                      <TableCell className="font-medium">{seat.seatNumber}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{seat.floorName || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{seat.sectionName || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={seat.status === 'available' ? 'default' : 'destructive'}
                          className={seat.status === 'available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0'}
                        >
                          {seat.status === 'available' ? 'Available' : 'Occupied'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{seat.memberName || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(seat)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {seat.status === 'available' ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedSeat(seat); setMemberSearch(''); setAssignMemberId(''); setAssignOpen(true); }}>
                              <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500" onClick={() => { setSelectedSeat(seat); setUnassignOpen(true); }}>
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedSeat(seat); setDeleteOpen(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Seat Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Seat</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Seat Number *</Label>
              <Input
                placeholder="e.g., A1"
                value={form.seatNumber}
                onChange={(e) => setForm((p) => ({ ...p, seatNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Floor *</Label>
              <Select value={form.floorId} onValueChange={(v) => setForm((p) => ({ ...p, floorId: v, sectionId: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select floor" /></SelectTrigger>
                <SelectContent>
                  {floors.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section *</Label>
              <Select value={form.sectionId} onValueChange={(v) => setForm((p) => ({ ...p, sectionId: v }))} disabled={!form.floorId}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {formSections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={loading || !form.seatNumber || !form.floorId || !form.sectionId}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Seat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Seat Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Seat</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Seat Number</Label>
              <Input value={form.seatNumber} onChange={(e) => setForm((p) => ({ ...p, seatNumber: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Floor</Label>
              <Select value={form.floorId} onValueChange={(v) => setForm((p) => ({ ...p, floorId: v, sectionId: '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {floors.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={form.sectionId} onValueChange={(v) => setForm((p) => ({ ...p, sectionId: v }))} disabled={!form.floorId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {formSections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => editMutation.mutate()} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Seat Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Seat Details</DialogTitle>
          </DialogHeader>
          {selectedSeat && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seat Number</span>
                <span className="font-medium">{selectedSeat.seatNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Floor</span>
                <span className="font-medium">{selectedSeat.floorName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Section</span>
                <span className="font-medium">{selectedSeat.sectionName || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={selectedSeat.status === 'available' ? 'default' : 'destructive'}
                  className={selectedSeat.status === 'available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0'}
                >
                  {selectedSeat.status === 'available' ? 'Available' : 'Occupied'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned Member</span>
                <span className="font-medium">{selectedSeat.memberName || '—'}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            {selectedSeat?.status === 'available' && (
              <Button onClick={() => { setViewOpen(false); setMemberSearch(''); setAssignMemberId(''); setAssignOpen(true); }}>
                <UserPlus className="h-4 w-4 mr-1" /> Assign
              </Button>
            )}
            {selectedSeat?.status === 'occupied' && (
              <Button variant="destructive" onClick={() => { setViewOpen(false); setUnassignOpen(true); }}>
                <UserMinus className="h-4 w-4 mr-1" /> Unassign
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Member Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Member to Seat {selectedSeat?.seatNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members by name..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {memberSearch.length >= 2 && (
              <div className="max-h-48 overflow-y-auto border rounded-lg custom-scrollbar">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 text-center">No members found</p>
                ) : (
                  searchResults.map((m) => (
                    <button
                      key={m.id}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between ${
                        assignMemberId === m.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setAssignMemberId(m.id)}
                    >
                      <span>{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.phone}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={() => assignMutation.mutate()} disabled={loading || !assignMemberId}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Confirmation */}
      <AlertDialog open={unassignOpen} onOpenChange={setUnassignOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign Seat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unassign seat {selectedSeat?.seatNumber} from {selectedSeat?.memberName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => unassignMutation.mutate()} className="bg-destructive text-white hover:bg-destructive/90">
              Unassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Seat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete seat {selectedSeat?.seatNumber}? This action cannot be undone.
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