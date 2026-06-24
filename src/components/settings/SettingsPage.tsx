'use client';

import { useState, useRef } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Save, Building, Download, Upload, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

  // Database tab state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

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

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/settings/backup');
      if (!res.ok) throw new Error('Backup failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `library-backup-${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Database backup downloaded successfully');
    } catch {
      toast.error('Failed to create backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoreOpen(false);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', restoreFile);
      const res = await fetch('/api/settings/restore', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');
      toast.success('Database restored successfully! Please reload the page.');
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to restore database');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl page-enter">
      {/* Gradient header */}
      <div className="rounded-xl bg-gradient-to-r from-slate-600 to-teal-600 p-3 md:p-4 text-white mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Save className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Settings</h2>
            <p className="text-sm text-white/70">Manage your library settings and preferences</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="library" className="space-y-6">
        <TabsList className="shadow-sm rounded-xl">
          <TabsTrigger value="library">Library Information</TabsTrigger>
          <TabsTrigger value="admin">Admin Settings</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
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

        <TabsContent value="database">
          <div className="space-y-4">
            {/* Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4" />
                  Database Backup
                </CardTitle>
                <CardDescription>Download a backup of your entire database</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleBackup} disabled={backupLoading} variant="outline" className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                  {backupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Backup Database
                </Button>
              </CardContent>
            </Card>

            {/* Restore */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="h-4 w-4" />
                  Restore Database
                </CardTitle>
                <CardDescription>Restore your database from a backup file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    ⚠️ Restoring a backup will replace all current data. This action cannot be undone.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".db"
                    onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={() => setRestoreOpen(true)}
                    disabled={!restoreFile || loading}
                    variant="outline"
                    className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Restore
                  </Button>
                </div>

                {restoreFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Selected: {restoreFile.name} ({(restoreFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Restore Confirmation Dialog */}
          <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Database Restore</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently replace your current database with the backup file &quot;{restoreFile?.name}&quot;. All current data will be lost. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRestore}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Yes, Restore Database
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}