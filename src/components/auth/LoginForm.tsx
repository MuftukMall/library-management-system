'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [libraryName, setLibraryName] = useState('Library Management System');
  const { setAuthenticated } = useAppStore();

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.libraryName) setLibraryName(data.libraryName);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Welcome back!');
        setAuthenticated(true);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 dark:from-emerald-950/50 dark:via-background dark:to-teal-950/50 animated-gradient-bg">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-300/20 dark:bg-emerald-500/10 blur-3xl animate-float" />
        <div className="absolute top-1/4 -right-32 w-80 h-80 rounded-full bg-teal-300/20 dark:bg-teal-500/10 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-cyan-200/20 dark:bg-cyan-500/8 blur-3xl animate-float-slower" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
          backgroundImage: 'radial-gradient(circle, oklch(0.5 0.1 162) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        {/* Abstract geometric shapes */}
        <motion.div
          className="absolute top-20 right-1/4 w-16 h-16 border-2 border-emerald-400/20 dark:border-emerald-400/10 rounded-lg rotate-12"
          animate={{ rotate: [12, 20, 12], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-32 left-1/5 w-12 h-12 border-2 border-teal-400/15 dark:border-teal-400/8 rounded-full"
          animate={{ y: [0, 12, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 left-16 w-8 h-8 bg-emerald-400/10 dark:bg-emerald-400/5 rounded-md"
          animate={{ rotate: [0, 180, 360], y: [0, -8, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-18 h-18 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-xl shadow-primary/25"
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <BookOpen className="w-9 h-9" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">{libraryName}</h1>
          <p className="text-muted-foreground mt-1.5">Sign in to your account</p>
        </div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Card className="shadow-2xl border-0 shadow-emerald-200/40 dark:shadow-emerald-900/30 glass-card bg-white/60 dark:bg-card/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Welcome Back</CardTitle>
                  <CardDescription>Enter your credentials to access the dashboard</CardDescription>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  v1.0
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-medium shadow-lg shadow-primary/20" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Library Management System &copy; {new Date().getFullYear()} &middot; All rights reserved
        </p>
      </motion.div>
    </div>
  );
}