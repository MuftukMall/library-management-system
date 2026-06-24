'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  joinDate: string;
  expiryDate: string;
  fee: number;
  status: 'active' | 'expired';
  seatId?: string;
  seatNumber?: string;
  floorId?: string;
  floorName?: string;
  sectionId?: string;
  sectionName?: string;
}

interface Floor { id: string; name: string; }
interface Section { id: string; name: string; floorId: string; }

const PAGE_SIZE = 20;

export function MembersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', phone: '', whatsapp: '', address: '',
    joinDate: new Date().toISOString().split('T')[0],
    expiryDate: '', floorId: '', sectionId: '', seatId: '', fee: 0,
  });
  const [renewForm, setRenewForm] = useState({
    amount: 0, paymentDate: new Date().toISOString().split('T')[0], validTill: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['members', search, statusFilter, floorFilter, sectionFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE), search,
        status: statusFilter, floorId: floorFilter, sectionId: sectionFilter,
      });
      return fetch(`/api/members?${params}`).then((r) => r.json()).then((d) => ({ members: (d.members || []).map((m: Record<string, unknown>) => ({ ...m, seatNumber: (m.seat as Record<string, unknown>)?.seatNumber, floorName: (m.floor as Record<string, unknown>)?.name, sectionName: (m.section as Record<string, unknown>)?.name })), pagination: d.pagination }));
    },
  });

  const { data: floors } = useQuery<Floor[]>({
    queryKey: ['floors'],
    queryFn: () => fetch('/api/floors').then((r) => r.json()).then((d) => d.floors),
  });

  const { data: sections } = useQuery<Section[]>({
    queryKey: ['sections', form.floorId],
    queryFn: () => fetch(`/api/sections?floorId=${form.floorId}`).then((r) => r.json()).then((d) => d.sections),
    enabled: !!form.floorId,
  });

  const { data: editSections } = useQuery<Section[]>({
    queryKey: ['sections-edit', form.floorId],
    queryFn: () => fetch(`/api/sections?floorId=${form.floorId}`).then((r) => r.json()).then((d) => d.sections),
    enabled: !!form.floorId,
  });

  const { data: viewMember, isLoading: viewLoading } = useQuery({
    queryKey: ['member', selectedMember?.id],
    queryFn: () => fetch(`/api/members/${selectedMember!.id}`).then((r) => r.json()).then((m: Record<string, unknown>) => ({ ...m, seatNumber: (m.seat as Record<string, unknown>)?.seatNumber, floorName: (m.floor as Record<string, unknown>)?.name, sectionName: (m.section as Record<string, unknown>)?.name })),
    enabled: !!selectedMember?.id && viewOpen,
  });

  const { data: availableSeats } = useQuery({
    queryKey: ['available-seats', form.sectionId, selectedMember?.id],
    queryFn: () => fetch(`/api/seats?sectionId=${form.sectionId}&status=available`).then((r) => r.json()).then((d) => d.seats || []),
    enabled: !!form.sectionId,
  });

  const members = data?.members || [];
  const total = data?.pagination?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const updateForm = (key: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      ...(key === 'floorId' ? { floorId: value, sectionId: '', seatId: '' } :
          key === 'sectionId' ? { sectionId: value, seatId: '' } :
          { [key]: value }),
    }));
  };

  const resetForm = useCallback(() => {
    setForm({
      name: '', phone: '', whatsapp: '', address: '',
      joinDate: new Date().toISOString().split('T')[0],
      expiryDate: '', floorId: '', sectionId: '', seatId: '', fee: 0,
    });
  }, []);

  const openEdit = (member: Member) => {
    setSelectedMember(member);
    setForm({
      name: member.name, phone: member.phone, whatsapp: member.whatsapp || '',
      address: member.address || '', joinDate: member.joinDate,
      expiryDate: member.expiryDate, floorId: member.floorId || '',
      sectionId: member.sectionId || '', seatId: member.seatId || '',
      fee: member.fee,
    });
    setEditOpen(true);
  };

  const openView = (member: Member) => {
    setSelectedMember(member);
    setViewOpen(true);
  };

  const openRenew = (member: Member) => {
    setSelectedMember(member);
    setRenewForm({ amount: member.fee, paymentDate: new Date().toISOString().split('T')[0], validTill: '' });
    setRenewOpen(true);
  };

  // Mutations
  const addMutation = useMutation({
    mutationFn: async () => {
      setFormLoading(true);
      const res = await fetch('/api/members', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');
      return data;
    },
    onSuccess: () => { toast.success('Member added successfully'); setAddOpen(false); resetForm(); queryClient.invalidateQueries({ queryKey: ['members'] }); },
    onError: (e) => toast.error(e.message),
    onSettled: () => setFormLoading(false),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      setFormLoading(true);
      const res = await fetch(`/api/members/${selectedMember!.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member');
      return data;
    },
    onSuccess: () => { toast.success('Member updated successfully'); setEditOpen(false); queryClient.invalidateQueries({ queryKey: ['members'] }); },
    onError: (e) => toast.error(e.message),
    onSettled: () => setFormLoading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/members/${selectedMember!.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete member');
    },
    onSuccess: () => { toast.success('Member deleted successfully'); setDeleteOpen(false); queryClient.invalidateQueries({ queryKey: ['members'] }); },
    onError: () => toast.error('Failed to delete member'),
  });

  const renewMutation = useMutation({
    mutationFn: async () => {
      setFormLoading(true);
      const res = await fetch(`/api/members/${selectedMember!.id}/renew`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(renewForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to renew');
      return data;
    },
    onSuccess: () => { toast.success('Membership renewed successfully'); setRenewOpen(false); queryClient.invalidateQueries({ queryKey: ['members'] }); },
    onError: (e) => toast.error(e.message),
    onSettled: () => setFormLoading(false),
  });

  const handleExport = () => {
    window.open('/api/export/members', '_blank');
    toast.success('Exporting members to CSV...');
  };

  const allSeats = availableSeats || [];

  const renderMemberForm = (isEdit: boolean) => {
    const sects = isEdit ? (editSections || []) : (sections || []);
    const seats = allSeats;

    return (
      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Member name" />
          </div>
          <div className="space-y-2">
            <Label>Phone *</Label>
            <Input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="Phone number" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => updateForm('whatsapp', e.target.value)} placeholder="WhatsApp number" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Address" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Join Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {form.joinDate ? format(new Date(form.joinDate), 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={form.joinDate ? new Date(form.joinDate) : undefined} onSelect={(d) => d && updateForm('joinDate', format(d, 'yyyy-MM-dd'))} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {form.expiryDate ? format(new Date(form.expiryDate), 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={form.expiryDate ? new Date(form.expiryDate) : undefined} onSelect={(d) => d && updateForm('expiryDate', format(d, 'yyyy-MM-dd'))} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Floor</Label>
            <Select value={form.floorId} onValueChange={(v) => updateForm('floorId', v)}>
              <SelectTrigger><SelectValue placeholder="Select floor" /></SelectTrigger>
              <SelectContent>
                {floors?.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={form.sectionId} onValueChange={(v) => updateForm('sectionId', v)} disabled={!form.floorId}>
              <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>
                {sects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Seat</Label>
            <Select value={form.seatId} onValueChange={(v) => updateForm('seatId', v)} disabled={!form.sectionId}>
              <SelectTrigger><SelectValue placeholder="Select seat" /></SelectTrigger>
              <SelectContent>
                {Array.isArray(availableSeats) && availableSeats.map((s: { id: string; seatNumber: string }) => (
                  <SelectItem key={s.id} value={s.id}>{s.seatNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Fee (₹)</Label>
          <Input type="number" value={form.fee} onChange={(e) => updateForm('fee', Number(e.target.value))} placeholder="0" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={floorFilter} onValueChange={(v) => { setFloorFilter(v); setSectionFilter('all'); setPage(1); }}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floors?.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setAddOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Member
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No members found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Phone</TableHead>
                      <TableHead className="hidden md:table-cell">Seat</TableHead>
                      <TableHead className="hidden lg:table-cell">Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member: Member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{member.phone}</TableCell>
                        <TableCell className="hidden md:table-cell">{member.seatNumber || '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {member.expiryDate ? format(new Date(member.expiryDate), 'dd MMM yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={member.status === 'active' ? 'default' : 'destructive'}
                            className={member.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0' : ''}
                          >
                            {member.status === 'active' ? 'Active' : 'Expired'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(member)} title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(member)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openRenew(member)} title="Renew">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedMember(member); setDeleteOpen(true); }} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">{page} / {totalPages}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          {renderMemberForm(false)}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={formLoading || !form.name || !form.phone}>
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          {renderMemberForm(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => editMutation.mutate()} disabled={formLoading}>
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Member Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {viewLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : viewMember ? (
            <ScrollArea className="max-h-[60vh] pr-2 custom-scrollbar">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Name:</span><p className="font-medium">{viewMember.name}</p></div>
                  <div><span className="text-muted-foreground">Phone:</span><p className="font-medium">{viewMember.phone}</p></div>
                  <div><span className="text-muted-foreground">WhatsApp:</span><p className="font-medium">{viewMember.whatsapp || '—'}</p></div>
                  <div><span className="text-muted-foreground">Address:</span><p className="font-medium">{viewMember.address || '—'}</p></div>
                  <div><span className="text-muted-foreground">Join Date:</span><p className="font-medium">{viewMember.joinDate ? format(new Date(viewMember.joinDate), 'dd MMM yyyy') : '—'}</p></div>
                  <div><span className="text-muted-foreground">Expiry Date:</span><p className="font-medium">{viewMember.expiryDate ? format(new Date(viewMember.expiryDate), 'dd MMM yyyy') : '—'}</p></div>
                  <div><span className="text-muted-foreground">Floor:</span><p className="font-medium">{viewMember.floorName || '—'}</p></div>
                  <div><span className="text-muted-foreground">Section:</span><p className="font-medium">{viewMember.sectionName || '—'}</p></div>
                  <div><span className="text-muted-foreground">Seat:</span><p className="font-medium">{viewMember.seatNumber || '—'}</p></div>
                  <div><span className="text-muted-foreground">Fee:</span><p className="font-medium">₹{viewMember.fee}</p></div>
                  <div><span className="text-muted-foreground">Status:</span>
                    <p>
                      <Badge variant={viewMember.status === 'active' ? 'default' : 'destructive'}
                        className={viewMember.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0' : ''}>
                        {viewMember.status === 'active' ? 'Active' : 'Expired'}
                      </Badge>
                    </p>
                  </div>
                </div>

                {/* Payment History */}
                {viewMember.payments && viewMember.payments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Payment History</h4>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Valid Till</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewMember.payments.map((p: { id: string; paymentDate: string; amount: number; validTill: string }) => (
                            <TableRow key={p.id}>
                              <TableCell className="text-xs">{p.paymentDate ? format(new Date(p.paymentDate), 'dd MMM yyyy') : '—'}</TableCell>
                              <TableCell className="text-xs">₹{p.amount}</TableCell>
                              <TableCell className="text-xs">{p.validTill ? format(new Date(p.validTill), 'dd MMM yyyy') : '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            {selectedMember && (
              <Button onClick={() => { setViewOpen(false); openRenew(selectedMember); }}>
                <RefreshCw className="h-4 w-4 mr-1" /> Renew
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Dialog */}
      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renew Membership</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={renewForm.amount} onChange={(e) => setRenewForm((p) => ({ ...p, amount: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {renewForm.paymentDate ? format(new Date(renewForm.paymentDate), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={new Date(renewForm.paymentDate)} onSelect={(d) => d && setRenewForm((p) => ({ ...p, paymentDate: format(d, 'yyyy-MM-dd') }))} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Valid Till</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {renewForm.validTill ? format(new Date(renewForm.validTill), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={renewForm.validTill ? new Date(renewForm.validTill) : undefined} onSelect={(d) => d && setRenewForm((p) => ({ ...p, validTill: format(d, 'yyyy-MM-dd') }))} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewOpen(false)}>Cancel</Button>
            <Button onClick={() => renewMutation.mutate()} disabled={formLoading}>
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Renew
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMember?.name}? This action cannot be undone.
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