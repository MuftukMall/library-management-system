'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  IndianRupee,
  TrendingUp,
  Armchair,
  Users,
  Trophy,
} from 'lucide-react';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

interface ReportsData {
  memberStatusDistribution: { status: string; count: number }[];
  seatOccupancyByFloor: { floorName: string; total: number; occupied: number; available: number; percentage: number }[];
  paymentStatusDistribution: { status: string; count: number; totalAmount: number }[];
  topMembers: { name: string; phone: string; totalPaid: number; paymentCount: number }[];
  revenueByMonth: { month: string; amount: number }[];
  newMembersByMonth: { month: string; count: number }[];
  kpis: { totalRevenue: number; avgFee: number; occupancyRate: number; retentionRate: number };
}

const revenueConfig = { amount: { label: 'Revenue', color: 'oklch(0.596 0.145 163.225)' } };
const membersConfig = { count: { label: 'New Members', color: 'oklch(0.696 0.17 162.48)' } };
const PIE_COLORS = ['oklch(0.596 0.145 163.225)', 'oklch(0.7 0.15 60)'];
const SEAT_COLORS = ['oklch(0.596 0.145 163.225)', 'oklch(0.696 0.17 162.48)'];

const kpiCards = [
  { key: 'totalRevenue', label: 'Total Revenue', icon: IndianRupee, borderColor: 'border-l-rose-500', format: (v: number) => formatCurrency(v) },
  { key: 'avgFee', label: 'Avg Membership Fee', icon: TrendingUp, borderColor: 'border-l-teal-500', format: (v: number) => formatCurrency(v) },
  { key: 'occupancyRate', label: 'Seat Occupancy', icon: Armchair, borderColor: 'border-l-emerald-500', format: (v: number) => `${v}%` },
  { key: 'retentionRate', label: 'Member Retention', icon: Users, borderColor: 'border-l-amber-500', format: (v: number) => `${v}%` },
];

export function ReportsPage() {
  const { data, isLoading } = useQuery<ReportsData>({
    queryKey: ['reports'],
    queryFn: () => fetch('/api/reports').then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 page-enter">
        <div className="rounded-xl bg-gradient-to-r from-rose-600 to-emerald-600 p-4 h-20" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const reports = data || {
    memberStatusDistribution: [], seatOccupancyByFloor: [], paymentStatusDistribution: [],
    topMembers: [], revenueByMonth: [], newMembersByMonth: [],
    kpis: { totalRevenue: 0, avgFee: 0, occupancyRate: 0, retentionRate: 0 },
  };

  const paymentPieData = reports.paymentStatusDistribution.map((p) => ({ name: p.status, value: p.count, amount: p.totalAmount }));

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-rose-600 to-emerald-600 p-3 md:p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Reports</h2>
            <p className="text-sm text-white/70">Analytics and insights for your library</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const value = reports.kpis[card.key as keyof typeof reports.kpis];
          return (
            <motion.div key={card.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
              <Card className={`hover-card-lift border-l-4 ${card.borderColor}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                      <p className="text-xl font-bold mt-0.5">{card.format(value)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row: Revenue Trend + Member Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm font-semibold">Revenue Trend (12 Months)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="h-72">
                <ChartContainer config={revenueConfig} className="h-full w-full">
                  <AreaChart data={reports.revenueByMonth}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.596 0.145 163.225)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.596 0.145 163.225)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="amount" stroke="oklch(0.596 0.145 163.225)" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Users className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm font-semibold">Member Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="h-72 flex items-center justify-center">
                {reports.memberStatusDistribution.some((d) => d.count > 0) ? (
                  <ChartContainer config={{ Active: { label: 'Active', color: 'oklch(0.596 0.145 163.225)' }, Expired: { label: 'Expired', color: 'oklch(0.7 0.15 60)' } }} className="h-full w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={reports.memberStatusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="status"
                      >
                        {reports.memberStatusDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No member data</p>
                )}
              </div>
              <div className="flex justify-center gap-6 mt-2">
                {reports.memberStatusDistribution.map((item, i) => (
                  <div key={item.status} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-xs text-muted-foreground">{item.status}: {item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Seat Occupancy by Floor */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 px-5 pt-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Armchair className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-semibold">Seat Occupancy by Floor</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="h-56">
              <ChartContainer config={{ occupied: { label: 'Occupied', color: 'oklch(0.596 0.145 163.225)' }, available: { label: 'Available', color: 'oklch(0.696 0.17 162.48)' } }} className="h-full w-full">
                <BarChart data={reports.seatOccupancyByFloor} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="floorName" fontSize={11} tickLine={false} axisLine={false} width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="occupied" stackId="a" fill="oklch(0.596 0.145 163.225)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="available" stackId="a" fill="oklch(0.696 0.17 162.48)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-xs text-muted-foreground">Available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* New Members Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 px-5 pt-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-semibold">New Members (12 Months)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="h-56">
              <ChartContainer config={membersConfig} className="h-full w-full">
                <BarChart data={reports.newMembersByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="oklch(0.696 0.17 162.48)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Members */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader className="pb-3 px-5 pt-5">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm font-semibold">Top Members by Revenue</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {reports.topMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No payment data</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-8">#</TableHead>
                      <TableHead className="text-xs">Member</TableHead>
                      <TableHead className="text-xs text-right">Total Paid</TableHead>
                      <TableHead className="text-xs text-right">Payments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.topMembers.map((m, i) => (
                      <TableRow key={i} className="hover:bg-muted/50">
                        <TableCell className="text-xs font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{m.name}</p>
                            <p className="text-[11px] text-muted-foreground">{m.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-right">{formatCurrency(m.totalPaid)}</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">{m.paymentCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Floor Occupancy Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-3 px-5 pt-5">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Armchair className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm font-semibold">Floor Occupancy Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {reports.seatOccupancyByFloor.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No floor data</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Floor</TableHead>
                      <TableHead className="text-xs text-center">Total</TableHead>
                      <TableHead className="text-xs text-center">Occupied</TableHead>
                      <TableHead className="text-xs">Occupancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.seatOccupancyByFloor.map((f) => (
                      <TableRow key={f.floorName} className="hover:bg-muted/50">
                        <TableCell className="text-sm font-medium">{f.floorName}</TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground">{f.total}</TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground">{f.occupied}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={f.percentage} className="h-2 flex-1" />
                            <span className="text-xs font-medium w-9 text-right">{f.percentage}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <Card>
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-semibold">Payment Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-2 gap-4">
              {reports.paymentStatusDistribution.map((p) => (
                <div key={p.status} className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                      {p.status}
                    </span>
                    <span className="text-2xl font-bold">{p.count}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.count} payment{p.count !== 1 ? 's' : ''}</p>
                  <p className="text-lg font-semibold mt-1">{formatCurrency(p.totalAmount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}