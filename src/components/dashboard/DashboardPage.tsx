'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  UserCheck,
  UserX,
  Armchair,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  UserPlus,
  CreditCard,
  Map,
  Activity,
  AlertTriangle,
  Wallet,
  CalendarDays,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';

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
  { key: 'totalMembers', label: 'Total Members', icon: Users, borderColor: 'border-l-teal-500', change: '+12%', up: true },
  { key: 'activeMembers', label: 'Active Members', icon: UserCheck, borderColor: 'border-l-emerald-500', change: '+8%', up: true },
  { key: 'expiredMembers', label: 'Expired Members', icon: UserX, borderColor: 'border-l-orange-500', change: '-3%', up: false },
  { key: 'totalSeats', label: 'Total Seats', icon: Armchair, borderColor: 'border-l-rose-500', change: '0%', up: null },
  { key: 'occupiedSeats', label: 'Occupied Seats', icon: Armchair, borderColor: 'border-l-amber-500', change: '+5%', up: true },
  { key: 'availableSeats', label: 'Available Seats', icon: UserCheck, borderColor: 'border-l-teal-500', change: '-5%', up: false },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', icon: DollarSign, borderColor: 'border-l-emerald-500', change: '+18%', up: true },
  { key: 'pendingPayments', label: 'Pending Payments', icon: Clock, borderColor: 'border-l-orange-500', change: '-25%', up: false },
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

interface ActivityItem {
  id: string; type: string; title: string; date: string;
}

interface ExpiringMember {
  id: string; name: string; expiryDate: string;
}

interface RevenueData {
  today: number; thisWeek: number; thisMonth: number;
  weekChange: number; monthChange: number;
}

export function DashboardPage() {
  const { setCurrentPage } = useAppStore();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
  });

  const { data: activityData } = useQuery<{ activities: ActivityItem[] }>({
    queryKey: ['dashboard-activity'],
    queryFn: () => fetch('/api/dashboard/activity').then((r) => r.json()),
  });

  const { data: expiringData } = useQuery<{ members: ExpiringMember[] }>({
    queryKey: ['dashboard-expiring'],
    queryFn: () => fetch('/api/dashboard/expiring').then((r) => r.json()),
  });

  const { data: revenueData } = useQuery<RevenueData>({
    queryKey: ['dashboard-revenue'],
    queryFn: () => fetch('/api/dashboard/revenue').then((r) => r.json()),
  });

  const activities = activityData?.activities || [];
  const expiringMembers = expiringData?.members || [];
  const revenue = revenueData || { today: 0, thisWeek: 0, thisMonth: 0, weekChange: 0, monthChange: 0 };

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
    <div className="space-y-6 page-enter">
      {/* Expiring Soon Alert */}
      {expiringMembers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors" onClick={() => setCurrentPage('members')}>
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {expiringMembers.length} member{expiringMembers.length > 1 ? 's' : ''} expiring soon
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 truncate">
                {expiringMembers.slice(0, 3).map(m => m.name).join(', ')}{expiringMembers.length > 3 ? ` and ${expiringMembers.length - 3} more` : ''}
              </p>
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">Click to view →</span>
          </div>
        </motion.div>
      )}

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
              <Card className={`hover-card-lift border-l-4 ${card.borderColor}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                      <p className="text-lg font-semibold stat-value mt-0.5">{displayValue}</p>
                    </div>
                    <div className={`flex items-center gap-0.5 text-[11px] font-medium px-2 py-1 rounded-full ${
                      card.up === true ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' :
                      card.up === false ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40' :
                      'text-muted-foreground bg-muted'
                    }`}>
                      {card.up === true && <TrendingUp className="w-3 h-3" />}
                      {card.up === false && <TrendingDown className="w-3 h-3" />}
                      {card.change}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold">Quick Actions</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCurrentPage('members')}>
              <UserPlus className="w-3.5 h-3.5" />
              Add Member
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCurrentPage('payments')}>
              <CreditCard className="w-3.5 h-3.5" />
              Record Payment
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCurrentPage('seats')}>
              <Map className="w-3.5 h-3.5" />
              View Seat Map
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-l-4 border-l-emerald-500 hover-card-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-lg font-semibold stat-value">{formatCurrency(revenue.today)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-l-4 border-l-teal-500 hover-card-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-lg font-semibold stat-value">{formatCurrency(revenue.thisWeek)}</p>
              </div>
              {revenue.weekChange !== 0 && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${revenue.weekChange > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-orange-600 bg-orange-50 dark:bg-orange-950/40'}`}>
                  {revenue.weekChange > 0 ? '+' : ''}{revenue.weekChange}%
                </span>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-l-4 border-l-emerald-600 hover-card-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-lg font-semibold stat-value">{formatCurrency(revenue.thisMonth)}</p>
              </div>
              {revenue.monthChange !== 0 && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${revenue.monthChange > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-orange-600 bg-orange-50 dark:bg-orange-950/40'}`}>
                  {revenue.monthChange > 0 ? '+' : ''}{revenue.monthChange}%
                </span>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm font-semibold">Monthly Collection</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 relative">
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
              {!stats.monthlyCollection.some((m) => m.amount > 0) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-b-xl">
                  <p className="text-sm text-muted-foreground">No collection data for this month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Activity className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm font-semibold">Member Growth</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 relative">
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
              {!stats.memberGrowth.some((m) => m.count > 0) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-b-xl">
                  <p className="text-sm text-muted-foreground">No growth data for this month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
        <Card>
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
                <Activity className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                      activity.type === 'member' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                      activity.type === 'payment' ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' :
                      'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    }`}>
                      {activity.type === 'member' ? 'U' : '₹'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}