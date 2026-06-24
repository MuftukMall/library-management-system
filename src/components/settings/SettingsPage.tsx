'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Building } from 'lucide-react';

interface SettingsData {
  libraryName?: string;
  ownerName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  receiptFooter?: string;
}

const emptyInfo: SettingsData = {
  libraryName: '', ownerName: '', phone: '', whatsapp: '', email: '', address: '', receiptFooter: '',
};

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<SettingsData>(emptyInfo);
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()).then((d) => d.settings),
  });

  // Merge settings with local edits
  const displayInfo = { ...emptyInfo, ...settings, ...info };

  const handleInfoChange = (key: keyof SettingsData, value: string) => {
    setInfo((prev) => ({ ...prev, [key]: value }));
  };

  const saveInfoMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(displayInfo),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      return data;
    },
    onSuccess: () => {
      toast.success('Settings saved successfully');
      setInfo(emptyInfo);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setLoading(false),
  });

  const savePasswordMutation = useMutation({
    mutationFn: async () => {
      if (password.newPassword !== password.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (password.newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      setLoading(true);
      const res = await fetch('/api/auth/password', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: password.currentPassword, newPassword: password.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      return data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setLoading(false),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Settings</h3>
        <p className="text-sm text-muted-foreground">Manage your library settings and preferences</p>
      </div>

      <Tabs defaultValue="library" className="space-y-6">
        <TabsList>
          <TabsTrigger value="library">Library Information</TabsTrigger>
          <TabsTrigger value="admin">Admin Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="library">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-4 w-4" />
                Library Information
              </CardTitle>
              <CardDescription>Update your library details that appear on receipts and communications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Library Name</Label>
                  <Input value={displayInfo.libraryName || ''} onChange={(e) => handleInfoChange('libraryName', e.target.value)} placeholder="My Library" />
                </div>
                <div className="space-y-2">
                  <Label>Owner Name</Label>
                  <Input value={displayInfo.ownerName || ''} onChange={(e) => handleInfoChange('ownerName', e.target.value)} placeholder="Owner name" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={displayInfo.phone || ''} onChange={(e) => handleInfoChange('phone', e.target.value)} placeholder="Phone number" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={displayInfo.whatsapp || ''} onChange={(e) => handleInfoChange('whatsapp', e.target.value)} placeholder="WhatsApp number" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={displayInfo.email || ''} onChange={(e) => handleInfoChange('email', e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={displayInfo.address || ''} onChange={(e) => handleInfoChange('address', e.target.value)} placeholder="Library address" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Receipt Footer</Label>
                <Textarea value={displayInfo.receiptFooter || ''} onChange={(e) => handleInfoChange('receiptFooter', e.target.value)} placeholder="Text that appears at the bottom of receipts" rows={3} className="resize-none" />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => saveInfoMutation.mutate()} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>Update your admin password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={password.currentPassword} onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))} placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={password.newPassword} onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))} placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={password.confirmPassword} onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="Confirm new password" />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => savePasswordMutation.mutate()} disabled={loading || !password.currentPassword || !password.newPassword || !password.confirmPassword}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}