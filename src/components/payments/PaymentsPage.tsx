'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
  Eye,
  Trash2,
  Download,
  Printer,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  DollarSign,
  CalendarDays,
  Clock,
  IndianRupee,
} from 'lucide-react';

interface Payment {
  id: string;
  receiptNo: string;
  memberId: string;
  memberName: string;
  amount: number;
  paymentDate: string;
  validTill: string;
  status: 'paid' | 'pending';
}

interface MemberOption {
  id: string;
  name: string;
  phone: string;
}

const PAGE_SIZE = 20;

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Form
  const [form, setForm] = useState({
    memberId: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0],
    validTill: '', status: 'paid' as 'paid' | 'pending',
  });
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['payments', statusFilter, memberFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE), status: statusFilter,
      });
      if (memberFilter !== 'all') params.set('memberId', memberFilter);
      return fetch(`/api/payments?${params}`).then((r) => r.json());
    },
  });

  // Fetch summary stats
  const { data: summary } = useQuery({
    queryKey: ['payments-summary'],
    queryFn: () => fetch('/api/payments?limit=1000').then((r) => r.json()).then((d) => {
      const allPayments = d.payments || d || [];
      const total = allPayments.filter((p: Payment) => p.status === 'paid').reduce((sum: number, p: Payment) => sum + p.amount, 0);
      const pending = allPayments.filter((p: Payment) => p.status === 'pending').reduce((sum: number, p: Payment) => sum + p.amount, 0);
      const thisMonth = allPayments.filter((p: Payment) => {
        if (p.status !== 'paid' || !p.paymentDate) return false;
        const d = new Date(p.paymentDate);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((sum: number, p: Payment) => sum + p.amount, 0);
      return { total, pending, thisMonth };
    }),
  });

  const { data: searchResults = [] } = useQuery<MemberOption[]>({
    queryKey: ['payment-member-search', memberSearch],
    queryFn: () => fetch(`/api/members?search=${memberSearch}&limit=10`).then((r) => r.json()).then((d) => d.members || d || []),
    enabled: memberSearch.length >= 2,
  });

  const payments = data?.payments || data || [];
  const total = data?.pagination?.total || payments.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const addMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const res = await fetch('/api/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add payment');
      return data;
    },
    onSuccess: () => {
      toast.success('Payment added successfully');
      setAddOpen(false);
      setForm({ memberId: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0], validTill: '', status: 'paid' });
      setMemberSearch('');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments-summary'] });
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setLoading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payments/${selectedPayment!.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete payment');
    },
    onSuccess: () => { toast.success('Payment deleted'); setDeleteOpen(false); queryClient.invalidateQueries({ queryKey: ['payments'] }); queryClient.invalidateQueries({ queryKey: ['payments-summary'] }); },
    onError: () => toast.error('Failed to delete payment'),
  });

  return (
    <div className="space-y-4 page-enter">
      {/* Gradient header */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 p-3 md:p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Payments</h2>
              <p className="text-sm text-white/70">Track all payment records</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { setForm({ memberId: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0], validTill: '', status: 'paid' }); setMemberSearch(''); setAddOpen(true); }}
            className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Plus className="h-4 w-4 mr-1" /> Add Payment
          </Button>
        </div>
      </div>

      {/* Revenue summary bar */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-l-4 border-l-emerald-500 hover-card-lift">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Total Collected</p>
                <p className="text-sm font-semibold">{formatCurrency(summary.total)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">This Month</p>
                <p className="text-sm font-semibold">{formatCurrency(summary.thisMonth)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Pending</p>
                <p className="text-sm font-semibold">{formatCurrency(summary.pending)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : !Array.isArray(payments) || payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">No payments found</p>
              <p className="text-xs mt-1 text-muted-foreground/70">Adjust filters or add a new payment</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt No</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead className="hidden sm:table-cell">Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead className="hidden lg:table-cell">Valid Till</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: Payment & { member?: { id: string; name: string } }, idx: number) => (
                      <TableRow key={payment.id} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                        <TableCell className="font-mono text-xs">{payment.receiptNo || payment.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-medium">{payment.member?.name || payment.memberName || '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {payment.paymentDate ? format(new Date(payment.paymentDate), 'dd MMM yyyy') : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {payment.validTill ? format(new Date(payment.validTill), 'dd MMM yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={payment.status === 'paid' ? 'default' : 'secondary'}
                            className={payment.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0'}
                          >
                            {payment.status === 'paid' ? 'Paid' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedPayment(payment); setViewOpen(true); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {payment.status === 'paid' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => window.open(`/api/payments/${payment.id}/receipt`, '_blank')}
                                  title="Download Receipt"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => window.open(`/api/payments/${payment.id}/receipt`, '_blank')}
                                  title="Print Receipt"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedPayment(payment); setDeleteOpen(true); }}>
                              <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add Payment Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Search Member *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {memberSearch.length >= 2 && (
                <div className="max-h-40 overflow-y-auto border rounded-lg custom-scrollbar">
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 text-center">No members found</p>
                  ) : (
                    searchResults.map((m) => (
                      <button
                        key={m.id}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${form.memberId === m.id ? 'bg-accent' : ''}`}
                        onClick={() => { setForm((p) => ({ ...p, memberId: m.id })); setMemberSearch(m.name); }}
                      >
                        {m.name} — {m.phone}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal text-sm">
                      {form.paymentDate ? format(new Date(form.paymentDate), 'dd MMM yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={new Date(form.paymentDate)} onSelect={(d) => d && setForm((p) => ({ ...p, paymentDate: format(d, 'yyyy-MM-dd') }))} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Valid Till</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal text-sm">
                      {form.validTill ? format(new Date(form.validTill), 'dd MMM yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={form.validTill ? new Date(form.validTill) : undefined} onSelect={(d) => d && setForm((p) => ({ ...p, validTill: format(d, 'yyyy-MM-dd') }))} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as 'paid' | 'pending' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={loading || !form.memberId || !form.amount}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Payment Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receipt No</span>
                <span className="font-mono font-medium">{selectedPayment.receiptNo || selectedPayment.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member</span>
                <span className="font-medium">{(selectedPayment as Payment & { member?: { id: string; name: string } }).member?.name || selectedPayment.memberName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatCurrency(selectedPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Date</span>
                <span className="font-medium">{selectedPayment.paymentDate ? format(new Date(selectedPayment.paymentDate), 'dd MMM yyyy') : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid Till</span>
                <span className="font-medium">{selectedPayment.validTill ? format(new Date(selectedPayment.validTill), 'dd MMM yyyy') : '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={selectedPayment.status === 'paid' ? 'default' : 'secondary'}
                  className={selectedPayment.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0'}
                >
                  {selectedPayment.status === 'paid' ? 'Paid' : 'Pending'}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            {selectedPayment?.status === 'paid' && (
              <>
                <Button variant="outline" onClick={() => window.open(`/api/payments/${selectedPayment.id}/receipt`, '_blank')}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
                <Button onClick={() => window.open(`/api/payments/${selectedPayment.id}/receipt`, '_blank')}>
                  <Download className="h-4 w-4 mr-1" /> Receipt
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
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