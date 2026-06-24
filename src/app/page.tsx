'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { LoginForm } from '@/components/auth/LoginForm';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { MembersPage } from '@/components/members/MembersPage';
import { SeatsPage } from '@/components/seats/SeatsPage';
import { FloorsPage } from '@/components/floors/FloorsPage';
import { SectionsPage } from '@/components/sections/SectionsPage';
import { PaymentsPage } from '@/components/payments/PaymentsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { WhatsAppPage } from '@/components/whatsapp/WhatsAppPage';

export default function Home() {
  const { currentPage, isAuthenticated, setAuthenticated } = useAppStore();

  useEffect(() => {
    fetch('/api/auth/check')
      .then((r) => r.json())
      .then((data) => {
        setAuthenticated(data.authenticated);
      })
      .catch(() => {
        setAuthenticated(false);
      });
  }, [setAuthenticated]);

  if (!isAuthenticated) return <LoginForm />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'members':
        return <MembersPage />;
      case 'seats':
        return <SeatsPage />;
      case 'floors':
        return <FloorsPage />;
      case 'sections':
        return <SectionsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'whatsapp':
        return <WhatsAppPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <AppLayout>{renderPage()}</AppLayout>;
}