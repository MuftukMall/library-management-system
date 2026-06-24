'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/appStore';

interface ActivityItem {
  id: string; type: string; title: string; date: string;
}

export function NotificationBell() {
  const { setCurrentPage } = useAppStore();

  const { data } = useQuery<{ activities: ActivityItem[] }>({
    queryKey: ['dashboard-activity'],
    queryFn: () => fetch('/api/dashboard/activity').then((r) => r.json()),
    refetchInterval: 30000,
  });

  const activities = data?.activities || [];
  const recentActivities = activities.slice(0, 6);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {recentActivities.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {recentActivities.length > 9 ? '9+' : recentActivities.length}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-xl shadow-lg" align="end">
        <div className="p-3 border-b">
          <h3 className="text-sm font-semibold">Recent Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Latest updates from your library</p>
        </div>
        {recentActivities.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="max-h-72">
            <div className="p-2">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-default"
                >
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold ${
                    activity.type === 'member'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : activity.type === 'payment'
                        ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  }`}>
                    {activity.type === 'member' ? 'U' : '₹'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight">{activity.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <div className="p-2 border-t">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="w-full text-center text-xs font-medium text-primary hover:underline py-1.5 rounded-md hover:bg-primary/5 transition-colors"
          >
            View All Activity
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
