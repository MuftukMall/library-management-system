'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  UserPlus,
  RefreshCw,
  CreditCard,
  Armchair,
  Settings,
  MessageCircle,
  Download,
  Database,
  Shield,
  Filter,
  Clock,
  TrendingUp,
  Layers,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LogEntry {
  id: string;
  type: string;
  title: string;
  details: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  member_created: { label: 'Member Joined', icon: UserPlus, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  member_updated: { label: 'Member Updated', icon: UserPlus, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  member_deleted: { label: 'Member Removed', icon: Trash2, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40' },
  member_renewed: { label: 'Renewal', icon: RefreshCw, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  payment_created: { label: 'Payment', icon: CreditCard, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40' },
  seat_assigned: { label: 'Seat Assignment', icon: Armchair, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
  seat_unassigned: { label: 'Seat Freed', icon: Armchair, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-950/40' },
  floor_created: { label: 'Floor Added', icon: Layers, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
  floor_updated: { label: 'Floor Updated', icon: Layers, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
  floor_deleted: { label: 'Floor Removed', icon: Trash2, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40' },
  section_created: { label: 'Section Added', icon: Layers, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40' },
  section_updated: { label: 'Section Updated', icon: Layers, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40' },
  section_deleted: { label: 'Section Removed', icon: Trash2, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40' },
  settings_updated: { label: 'Settings', icon: Settings, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-950/40' },
  whatsapp_sent: { label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40' },
  data_exported: { label: 'Export', icon: Download, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
  data_restored: { label: 'Restore', icon: Database, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
  system: { label: 'System', icon: Shield, color: 'text-muted-foreground', bg: 'bg-muted' },
};

const DEFAULT_CONFIG = { label: 'Activity', icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted' };

function getConfig(type: string) {
  return TYPE_CONFIG[type] || DEFAULT_CONFIG;
}

function formatGroupDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEEE');
  return format(date, 'MMM d, yyyy');
}

export function ActivityLogPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<{
    logs: LogEntry[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ['activity-logs', typeFilter],
    queryFn: () => {
      const params = typeFilter !== 'all' ? `?type=${typeFilter}&limit=100` : '?limit=100';
      return fetch(`/api/activity-logs${params}`).then((r) => r.json());
    },
  });

  const logs = data?.logs || [];

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, LogEntry[]> = {};
    for (const log of logs) {
      const group = formatGroupDate(log.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(log);
    }
    return Object.entries(groups);
  }, [logs]);

  // Stats
  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const log of logs) {
      stats[log.type] = (stats[log.type] || 0) + 1;
    }
    return stats;
  }, [logs]);

  const topTypes = useMemo(() => {
    return Object.entries(typeStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [typeStats]);

  return (
    <div className="space-y-6 page-enter">
      {/* Gradient header */}
      <div className="rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-3 md:p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Activity Log</h2>
              <p className="text-sm text-white/70">Track all library operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-0">
              {data?.total || 0} events
            </Badge>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 h-8 w-8 p-0" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats Row */}
      {!isLoading && logs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {topTypes.map(([type, count]) => {
              const config = getConfig(type);
              const Icon = config.icon;
              return (
                <Card key={type} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${config.bg} ${config.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold leading-tight">{count}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{config.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {typeFilter !== 'all' && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setTypeFilter('all')}>
              Clear filter
            </Button>
          )}
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline
                </CardTitle>
                <CardDescription>Recent activity in chronological order</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm font-medium">No activity yet</p>
                <p className="text-xs mt-1 text-muted-foreground/70">Activities will appear here as you use the system</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-6 pr-4">
                  {groupedLogs.map(([group, groupLogs]) => (
                    <div key={group}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-px bg-border flex-1" />
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {group}
                        </span>
                        <div className="h-px bg-border flex-1" />
                      </div>
                      <div className="space-y-2">
                        {groupLogs.map((log, index) => {
                          const config = getConfig(log.type);
                          const Icon = config.icon;
                          const isExpanded = expandedId === log.id;
                          return (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                            >
                              <div
                                className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer group ${
                                  isExpanded
                                    ? 'bg-muted/60 shadow-sm'
                                    : 'hover:bg-muted/30'
                                }`}
                                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              >
                                {/* Icon */}
                                <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${config.bg} ${config.color} shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110`}>
                                  <Icon className="w-4 h-4" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium leading-tight">{log.title}</p>
                                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-1">
                                          {config.label}
                                        </Badge>
                                        <span>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                                      </p>
                                    </div>
                                    <div className="shrink-0 text-muted-foreground">
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </div>
                                  </div>

                                  {/* Expanded Details */}
                                  <AnimatePresence>
                                    {isExpanded && (log.details || log.metadata) && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-2 pt-2 border-t space-y-1.5">
                                          {log.details && (
                                            <p className="text-xs text-muted-foreground">{log.details}</p>
                                          )}
                                          {log.metadata && (
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                              {Object.entries(log.metadata).map(([key, value]) => (
                                                <span key={key} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                                                  {key}: {String(value).slice(0, 12)}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                          <p className="text-[10px] text-muted-foreground/50 mt-1">
                                            {format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a')}
                                          </p>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}