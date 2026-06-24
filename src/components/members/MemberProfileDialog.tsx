'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Phone,
  MapPin,
  CalendarDays,
  IndianRupee,
  Armchair,
  Building2,
  Layers,
  CreditCard,
  StickyNote,
  Save,
  Loader2,
  FileText,
  IdCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { MemberCard } from './MemberCard';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

interface MemberProfileData {
  member: {
    id: string; name: string; phone: string; whatsapp?: string; address?: string;
    joinDate: string; expiryDate: string; fee: number; status: string; notes?: string;
    seat?: { id: string; seatNumber: string } | null;
    floor?: { id: string; name: string } | null;
    section?: { id: string; name: string } | null;
  };
  payments: {
    id: string; receiptNo: string; amount: number; paymentDate: string;
    validTill: string; status: string;
  }[];
}

interface MemberProfileDialogProps {
  memberId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberProfileDialog({ memberId, open, onOpenChange }: MemberProfileDialogProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  const { data, isLoading } = useQuery<MemberProfileData>({
    queryKey: ['member-profile', memberId],
    queryFn: () => fetch(`/api/members/${memberId}`).then((r) => r.json()),
    enabled: !!memberId && open,
  });

  const member = data?.member;
  const payments = data?.payments || [];

  // Sync notes when data loads
  if (member && !notesLoaded && member.notes !== undefined) {
    setNotes(member.notes || '');
    setNotesLoaded(true);
  }

  // Reset notes loaded when dialog reopens
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setNotesLoaded(false);
    onOpenChange(nextOpen);
  };

  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error('Failed to save notes');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Notes saved');
      queryClient.invalidateQueries({ queryKey: ['member-profile', memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: () => toast.error('Failed to save notes'),
  });

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : member ? (
          <>
            {/* Header with avatar - always visible */}
            <div className="p-6 pb-0">
              <DialogHeader className="mb-4">
                <DialogTitle>Member Profile</DialogTitle>
              </DialogHeader>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-emerald-500/20 shrink-0">
                  {getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold truncate">{member.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={
                        member.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0'
                      }
                    >
                      {member.status === 'active' ? 'Active' : 'Expired'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Fee: {formatCurrency(member.fee)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5 mt-2"
                    onClick={() => setCardOpen(true)}
                  >
                    <IdCard className="w-3.5 h-3.5" />
                    Print Card
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="profile" className="px-6">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="profile" className="flex-1 gap-1.5 text-xs">
                  <Phone className="w-3.5 h-3.5" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex-1 gap-1.5 text-xs">
                  <CreditCard className="w-3.5 h-3.5" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex-1 gap-1.5 text-xs">
                  <StickyNote className="w-3.5 h-3.5" />
                  Notes
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="max-h-[50vh] custom-scrollbar pb-6">
                {/* Profile Tab */}
                <TabsContent value="profile" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <InfoItem icon={Phone} label="Phone" value={member.phone} />
                    <InfoItem icon={Phone} label="WhatsApp" value={member.whatsapp || '—'} />
                    <InfoItem icon={MapPin} label="Address" value={member.address || 'Not set'} />
                    <InfoItem icon={CalendarDays} label="Joined" value={member.joinDate ? format(new Date(member.joinDate), 'dd MMM yyyy') : '—'} />
                    <InfoItem icon={CalendarDays} label="Expires" value={member.expiryDate ? format(new Date(member.expiryDate), 'dd MMM yyyy') : '—'} />
                    <InfoItem icon={IndianRupee} label="Fee" value={formatCurrency(member.fee)} />
                    <InfoItem icon={Armchair} label="Seat" value={member.seat?.seatNumber || 'Not assigned'} />
                    <InfoItem icon={Building2} label="Floor" value={member.floor?.name || '—'} />
                    <InfoItem icon={Layers} label="Section" value={member.section?.name || '—'} />
                  </motion.div>
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments" className="mt-0">
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">{payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
                      {totalPaid > 0 && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                          Total: {formatCurrency(totalPaid)}
                        </p>
                      )}
                    </div>

                    {payments.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-muted-foreground">
                        <CreditCard className="w-10 h-10 opacity-20 mb-2" />
                        <p className="text-sm">No payment records</p>
                      </div>
                    ) : (
                      <div className="relative pl-6 space-y-3">
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                        {payments.map((payment) => (
                          <div key={payment.id} className="relative">
                            <div
                              className={`absolute -left-6 top-3 w-4 h-4 rounded-full border-2 border-background z-10 ${
                                payment.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            <div className="bg-muted/50 rounded-lg p-3 hover:bg-muted/80 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-mono text-muted-foreground">
                                  {payment.receiptNo || payment.id.slice(0, 8)}
                                </span>
                                <Badge
                                  variant={payment.status === 'paid' ? 'default' : 'secondary'}
                                  className={`text-[10px] border-0 ${
                                    payment.status === 'paid'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                  }`}
                                >
                                  {payment.status === 'paid' ? 'Paid' : 'Pending'}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{formatCurrency(payment.amount)}</span>
                                <span className="text-xs text-muted-foreground">
                                  {payment.paymentDate ? format(new Date(payment.paymentDate), 'dd MMM yyyy') : '—'}
                                </span>
                              </div>
                              {payment.validTill && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  Valid till: {format(new Date(payment.validTill), 'dd MMM yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="mt-0">
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <StickyNote className="w-4 h-4" />
                        <span>Admin notes about {member.name}</span>
                      </div>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this member (preferences, reminders, special arrangements...)"
                        rows={6}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground">{notes.length} characters</p>
                        <Button
                          size="sm"
                          onClick={() => saveNotesMutation.mutate()}
                          disabled={saveNotesMutation.isPending}
                        >
                          {saveNotesMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : (
                            <Save className="w-3.5 h-3.5 mr-1" />
                          )}
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </>
        ) : (
          <div className="p-6">
            <p className="text-sm text-muted-foreground text-center py-8">Member not found</p>
          </div>
        )}
      </DialogContent>
      <MemberCard memberId={memberId} open={cardOpen} onOpenChange={setCardOpen} />
    </Dialog>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium truncate">{value}</p>
      </div>
    </div>
  );
}