'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  FileText,
  Check,
  CheckCheck,
  User,
  Sparkles,
} from 'lucide-react';

interface MemberListItem {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  status: string;
}

const TEMPLATES = [
  {
    id: 'renewal',
    name: 'Renewal Reminder',
    icon: RefreshCw,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    getText: (libraryName: string) =>
      `Dear {name},\n\nYour membership at ${libraryName} is expiring soon. Please renew to continue enjoying our services.\n\nThank you!`,
  },
  {
    id: 'payment',
    name: 'Payment Confirmation',
    icon: Check,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    getText: (libraryName: string) =>
      `Dear {name},\n\nWe have received your payment of ₹{amount}. Your membership at ${libraryName} is valid till {date}.\n\nThank you!`,
  },
  {
    id: 'welcome',
    name: 'Welcome Message',
    icon: Sparkles,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40',
    getText: (libraryName: string) =>
      `Welcome to ${libraryName}! 🎉\n\nWe're glad to have you as a member. Your membership is valid till {date}.\n\nIf you have any questions, feel free to reach out.`,
  },
  {
    id: 'expiry',
    name: 'Expiry Alert',
    icon: Bell,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
    getText: (libraryName: string) =>
      `Dear {name},\n\nYour membership at ${libraryName} has expired. Please renew at the earliest to continue using the library.\n\nWe'd love to see you back!`,
  },
];

const mockMessages = [
  { id: '1', phone: '+91 98765 43210', message: 'Your membership will expire in 3 days. Please renew.', status: 'read' as const, time: '2 min ago', template: 'renewal' },
  { id: '2', phone: '+91 87654 32109', message: 'Welcome to the library! We are glad to have you.', status: 'delivered' as const, time: '15 min ago', template: 'welcome' },
  { id: '3', phone: '+91 76543 21098', message: 'Payment received. Thank you!', status: 'sent' as const, time: '1 hour ago', template: 'payment' },
  { id: '4', phone: '+91 65432 10987', message: 'Your membership has expired. Please renew at the earliest.', status: 'read' as const, time: '3 hours ago', template: 'expiry' },
];

function StatusIcon({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-teal-500" />;
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
  return <Check className="w-3.5 h-3.5 text-muted-foreground/50" />;
}

function getTemplateLabel(templateId: string) {
  return TEMPLATES.find((t) => t.id === templateId)?.name || '';
}

export function WhatsAppPage() {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => fetch('/api/whatsapp/status').then((r) => r.json()),
    refetchInterval: 10000,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  });

  const libraryName = settingsData?.libraryName || 'our library';

  const { data: membersData } = useQuery<{ members: MemberListItem[] }>({
    queryKey: ['members-list-whatsapp'],
    queryFn: () => fetch('/api/members?limit=200').then((r) => r.json()),
  });

  const members = useMemo(() => {
    if (!membersData?.members) return [];
    return membersData.members.map((m: Record<string, unknown>) => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      whatsapp: (m.whatsapp as string) || '',
      status: m.status,
    }));
  }, [membersData]);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId),
    [members, selectedMemberId]
  );

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
    onSuccess: () => { toast.success('Message sent successfully'); setPhone(''); setMessage(''); setSelectedMemberId(''); },
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

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    const member = members.find((m) => m.id === memberId);
    if (member) {
      const num = member.whatsapp || member.phone;
      setPhone(num.startsWith('+') ? num : `+91 ${num}`);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setMessage(template.getText(libraryName));
      toast.success(`"${template.name}" template loaded`);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Gradient header */}
      <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-3 md:p-4 text-white">
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
          {isConnected && (
            <Badge className="bg-emerald-500 text-white border-0 gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Connected
            </Badge>
          )}
        </div>
      </div>

      {/* Connection Status Card */}
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
                  <div className={`flex items-center justify-center h-10 w-10 rounded-full transition-colors ${isConnected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
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

      {/* Message Templates */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base">Message Templates</CardTitle>
                <CardDescription className="text-xs">Click to load a template into the message field</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleUseTemplate(tpl.id)}
                    className="text-left p-3 rounded-xl border hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tpl.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">{tpl.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {tpl.getText(libraryName).slice(0, 80)}...
                    </p>
                  </button>
                );
              })}
            </div>
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
              {/* Member Selector */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Select Member
                </Label>
                <Select value={selectedMemberId} onValueChange={handleSelectMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <span>{m.name}</span>
                          <span className="text-xs text-muted-foreground">{m.phone}</span>
                          <Badge variant="outline" className={`text-[9px] ml-1 border-0 ${m.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                            {m.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedMember && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs"
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Selected: <strong>{selectedMember.name}</strong> ({selectedMember.phone})</span>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

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
                <p className="text-[11px] text-muted-foreground text-right">{message.length} characters</p>
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
                className="w-full justify-start h-12"
                onClick={() => sendReminder('renewal')}
                disabled={reminderLoading === 'renewal' || !isConnected}
              >
                {reminderLoading === 'renewal' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                <div className="text-left">
                  <p className="text-sm font-medium">Send Renewal Reminders</p>
                  <p className="text-[11px] text-muted-foreground font-normal">Members expiring within 7 days</p>
                </div>
              </Button>
              <Separator />
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => sendReminder('payment')}
                disabled={reminderLoading === 'payment' || !isConnected}
              >
                {reminderLoading === 'payment' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                <div className="text-left">
                  <p className="text-sm font-medium">Send Payment Reminders</p>
                  <p className="text-[11px] text-muted-foreground font-normal">Members with pending payments</p>
                </div>
              </Button>
              <Separator />
              <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Messages sent today</p>
                    <p className="text-2xl font-bold mt-1">{mockMessages.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Messages */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Messages</CardTitle>
                <CardDescription>Your recently sent messages</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">{mockMessages.length} messages</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
              {mockMessages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors group cursor-default"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{msg.phone}</p>
                        <StatusIcon status={msg.status} />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{msg.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{msg.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {msg.template && (
                        <Badge variant="secondary" className="text-[10px] bg-primary/5 text-primary border-0 gap-1">
                          <FileText className="w-2.5 h-2.5" />
                          {getTemplateLabel(msg.template)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}