'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Topbar } from '@/components/layout/topbar';
import { useAuthStore } from '@/stores/auth-store';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSuperAdmin = !!user?.systemRoles?.some(
    (r) => r.toLowerCase() === 'super_admin',
  );

  // Defense-in-depth: the middleware already gates /admin on the super_admin
  // role, but guard client-side too so a non-operator never sees the console.
  useEffect(() => {
    if (isAuthenticated && user && !isSuperAdmin) {
      router.replace('/');
    }
  }, [isAuthenticated, user, isSuperAdmin, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null; // redirecting via the effect above
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
