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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Printer, X, MapPin, Phone, CalendarDays, Armchair, Building2 } from 'lucide-react';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface CardData {
  member: {
    id: string; name: string; phone: string; address?: string;
    joinDate: string; expiryDate: string; fee: number; status: string;
  };
  seat: { seatNumber: string; section: string; floor: string } | null;
  library: { name: string; phone: string; address: string; email: string };
}

interface MemberCardProps {
  memberId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberCard({ memberId, open, onOpenChange }: MemberCardProps) {
  const { data, isLoading } = useQuery<CardData>({
    queryKey: ['member-card', memberId],
    queryFn: () => fetch(`/api/members/${memberId}/card`).then((r) => r.json()),
    enabled: !!memberId && open,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md print:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Member ID Card
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-52 w-full rounded-xl" />
              </div>
            ) : data ? (
              <CardPreview data={data} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Failed to load card data</p>
            )}
          </div>
          <div className="flex gap-2 justify-end print:hidden">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-1" /> Close
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Print Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print-only card */}
      {open && data && !isLoading && (
        <div className="hidden print:block print:p-0 print:m-0">
          <CardPreview data={data} />
        </div>
      )}
    </>
  );
}

function CardPreview({ data }: { data: CardData }) {
  const { member, seat, library } = data;
  const memberId = `LIB-${member.id.slice(0, 6).toUpperCase()}`;
  const isActive = member.status === 'active';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="print-card"
    >
      {/* Card Container - credit card proportions */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-border/50 print:shadow-none print:border-2 print:border-black" style={{ aspectRatio: '85.6/53.98' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 print:opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-teal-500 translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Gradient Top Bar */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 px-5 pt-4 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold">
                📚
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">{library.name}</p>
                <p className="text-[10px] text-white/70">MEMBERSHIP CARD</p>
              </div>
            </div>
            <Badge className={`${isActive ? 'bg-emerald-400 text-emerald-900' : 'bg-red-400 text-red-900'} border-0 text-[10px] font-bold print:bg-black print:text-white`}>
              {isActive ? 'ACTIVE' : 'EXPIRED'}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative px-5 -mt-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 -mt-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20 shrink-0 print:shadow-none border-2 border-white dark:border-zinc-900">
              {getInitials(member.name)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-lg font-bold truncate print:text-black">{member.name}</h3>
              <p className="text-[11px] text-muted-foreground font-mono print:text-gray-600">{memberId}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4 text-xs print:text-black">
            <DetailItem icon={Phone} label="Phone" value={member.phone} />
            <DetailItem icon={Armchair} label="Seat" value={seat?.seatNumber || 'Unassigned'} />
            <DetailItem icon={Building2} label="Section" value={seat?.section || '—'} />
            <DetailItem icon={MapPin} label="Floor" value={seat?.floor || '—'} />
          </div>

          <Separator className="my-3 print:bg-gray-300" />

          {/* Bottom Row */}
          <div className="flex items-center justify-between text-xs print:text-black">
            <div className="flex items-center gap-1 text-muted-foreground print:text-gray-600">
              <CalendarDays className="w-3 h-3" />
              <span>Valid till: <strong className="text-foreground print:text-black">{member.expiryDate ? format(new Date(member.expiryDate), 'dd MMM yyyy') : '—'}</strong></span>
            </div>
            <p className="text-[10px] text-muted-foreground print:text-gray-500">{library.address || library.phone}</p>
          </div>
        </div>
      </div>

      {/* Print-Only Footer */}
      <div className="hidden print:block text-center mt-4 text-xs text-gray-500">
        <p>{library.name} &middot; {library.address} &middot; {library.phone}</p>
      </div>
    </motion.div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-muted-foreground print:text-gray-500 shrink-0" />
      <span className="text-muted-foreground print:text-gray-500">{label}:</span>
      <span className="font-medium truncate print:text-black">{value}</span>
    </div>
  );
}