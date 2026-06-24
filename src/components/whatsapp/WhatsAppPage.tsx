'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Wifi,
  WifiOff,
  Send,
  Bell,
  Loader2,
  QrCode,
  Phone,
  RefreshCw,
} from 'lucide-react';

export function WhatsAppPage() {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState('');

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => fetch('/api/whatsapp/status').then((r) => r.json()),
    refetchInterval: 10000,
  });

  const isConnected = status?.connected || false;
  const qrCode = status?.qrCode || null;

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      setSendLoading(true);
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      return data;
    },
    onSuccess: () => { toast.success('Message sent successfully'); setPhone(''); setMessage(''); },
    onError: (e) => toast.error(e.message),
    onSettled: () => setSendLoading(false),
  });

  const sendReminder = async (type: 'renewal' | 'payment') => {
    setReminderLoading(type);
    try {
      const res = await fetch('/api/whatsapp/reminders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reminders');
      toast.success(`${type === 'renewal' ? 'Renewal' : 'Payment'} reminders sent successfully`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send reminders');
    } finally {
      setReminderLoading('');
    }
  };

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/whatsapp/status', { method: 'POST' });
      return res.json();
    },
    onSuccess: () => { toast.success('QR code generated. Scan with WhatsApp.'); queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] }); },
    onError: () => toast.error('Failed to connect'),
  });

  // Mock recent messages
  const mockMessages = [
    { id: '1', phone: '+91 98765 43210', message: 'Your membership will expire in 3 days. Please renew.', status: 'sent', time: '2 min ago' },
    { id: '2', phone: '+91 87654 32109', message: 'Welcome to the library!', status: 'sent', time: '15 min ago' },
    { id: '3', phone: '+91 76543 21098', message: 'Payment received. Thank you!', status: 'sent', time: '1 hour ago' },
  ];

  return (
    <div className="space-y-6 max-w-4xl page-enter">
      {/* Gradient header */}
      <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-4 md:p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">WhatsApp</h2>
              <p className="text-sm text-white/70">Send messages and manage reminders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-full ${isConnected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                    {isConnected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {isConnected ? 'Connected' : 'Disconnected'}
                      <Badge variant={isConnected ? 'default' : 'destructive'} className={isConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0' : ''}>
                        {isConnected ? 'Online' : 'Offline'}
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isConnected ? 'WhatsApp Web is connected and ready' : 'Scan QR code to connect WhatsApp Web'}
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                {!isConnected && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    {qrCode ? (
                      <div className="p-4 bg-white rounded-xl border">
                        <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <QrCode className="h-12 w-12 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No QR code available</p>
                      </div>
                    )}
                    <Button size="sm" variant="outline" onClick={() => connectMutation.mutate()}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Generate QR Code
                    </Button>
                  </div>
                )}

                {/* Connect/Disconnect */}
                <div className="flex gap-2">
                  {!isConnected ? (
                    <Button size="sm" onClick={() => connectMutation.mutate()}>
                      <Wifi className="h-4 w-4 mr-1" /> Connect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        try {
                          await fetch('/api/whatsapp/status', { method: 'DELETE' });
                          toast.success('WhatsApp disconnected');
                          queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
                        } catch {
                          toast.error('Failed to disconnect');
                        }
                      }}
                    >
                      <WifiOff className="h-4 w-4 mr-1" /> Disconnect
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Message */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Message
              </CardTitle>
              <CardDescription>Send a message to a member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <Button
                onClick={() => sendMessageMutation.mutate()}
                disabled={sendLoading || !phone || !message || !isConnected}
                className="w-full"
              >
                {sendLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Message
              </Button>
              {!isConnected && (
                <p className="text-xs text-destructive text-center">Connect WhatsApp first to send messages</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Quick Actions
              </CardTitle>
              <CardDescription>Send bulk reminders to members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => sendReminder('renewal')}
                disabled={reminderLoading === 'renewal' || !isConnected}
              >
                {reminderLoading === 'renewal' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Send Renewal Reminders
              </Button>
              <p className="text-xs text-muted-foreground px-1">
                Sends reminder to all members whose membership is expiring within 7 days
              </p>
              <Separator />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => sendReminder('payment')}
                disabled={reminderLoading === 'payment' || !isConnected}
              >
                {reminderLoading === 'payment' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Send Payment Reminders
              </Button>
              <p className="text-xs text-muted-foreground px-1">
                Sends reminder to all members with pending payments
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Messages */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Messages</CardTitle>
            <CardDescription>Your recently sent messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar">
              {mockMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{msg.phone}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{msg.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{msg.message}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">Sent</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}