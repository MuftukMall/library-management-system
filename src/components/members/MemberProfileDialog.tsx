'use client';

import { useQuery } from '@tanstack/react-query';
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
import {
  Phone,
  MapPin,
  CalendarDays,
  IndianRupee,
  Armchair,
  Building2,
  Layers,
  CreditCard,
} from 'lucide-react';

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
    joinDate: string; expiryDate: string; fee: number; status: string;
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
  const { data, isLoading } = useQuery<MemberProfileData>({
    queryKey: ['member-profile', memberId],
    queryFn: () => fetch(`/api/members/${memberId}`).then((r) => r.json()),
    enabled: !!memberId && open,
  });

  const member = data?.member;
  const payments = data?.payments || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0">
        <ScrollArea className="max-h-[90vh] custom-scrollbar">
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-32 w-full" />
              </div>
            ) : member ? (
              <>
                <DialogHeader className="mb-4">
                  <DialogTitle>Member Profile</DialogTitle>
                </DialogHeader>

                {/* Profile Header */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 mb-6"
                >
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
                  </div>
                </motion.div>

                {/* Info Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-2 gap-3 mb-6"
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

                <Separator className="my-4" />

                {/* Payment History Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-4">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Payment History
                  </h4>

                  {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No payment records found
                    </p>
                  ) : (
                    <div className="relative pl-6">
                      {/* Timeline line */}
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

                      {payments.map((payment, index) => (
                        <div key={payment.id} className="relative pb-4 last:pb-0">
                          {/* Timeline dot */}
                          <div
                            className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-background z-10 ${
                              payment.status === 'paid'
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                          />

                          <div className="bg-muted/50 rounded-lg p-3">
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
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Member not found</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
