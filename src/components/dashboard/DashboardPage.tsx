'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  UserCheck,
  UserX,
  Armchair,
  Armchair as ArmchairOccupied,
  DollarSign,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardData {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  monthlyRevenue: number;
  pendingPayments: number;
  monthlyCollection: { month: string; amount: number }[];
  memberGrowth: { month: string; count: number }[];
}

const statCards = [
  { key: 'totalMembers', label: 'Total Members', icon: Users, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40' },
  { key: 'activeMembers', label: 'Active Members', icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { key: 'expiredMembers', label: 'Expired Members', icon: UserX, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40' },
  { key: 'totalSeats', label: 'Total Seats', icon: Armchair, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
  { key: 'occupiedSeats', label: 'Occupied Seats', icon: ArmchairOccupied, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { key: 'availableSeats', label: 'Available Seats', icon: UserCheck, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { key: 'pendingPayments', label: 'Pending Payments', icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40' },
];

const barChartConfig = {
  amount: { label: 'Collection', color: 'oklch(0.596 0.145 163.225)' },
};

const areaChartConfig = {
  count: { label: 'Members', color: 'oklch(0.696 0.17 162.48)' },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = data || {
    totalMembers: 0, activeMembers: 0, expiredMembers: 0,
    totalSeats: 0, occupiedSeats: 0, availableSeats: 0,
    monthlyRevenue: 0, pendingPayments: 0,
    monthlyCollection: [], memberGrowth: [],
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof DashboardData] as number;
          const displayValue = card.key === 'monthlyRevenue' ? formatCurrency(value) : formatNumber(value);

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${card.bg} ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                      <p className="text-lg font-semibold tabular-nums">{displayValue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4 md:p-6">
              <h3 className="text-sm font-semibold mb-4">Monthly Collection</h3>
              <div className="h-64">
                <ChartContainer config={barChartConfig} className="h-full w-full">
                  <BarChart data={stats.monthlyCollection}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="oklch(0.596 0.145 163.225)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4 md:p-6">
              <h3 className="text-sm font-semibold mb-4">Member Growth</h3>
              <div className="h-64">
                <ChartContainer config={areaChartConfig} className="h-full w-full">
                  <AreaChart data={stats.memberGrowth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <defs>
                      <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.696 0.17 162.48)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.696 0.17 162.48)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="count" stroke="oklch(0.696 0.17 162.48)" fill="url(#memberGradient)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}