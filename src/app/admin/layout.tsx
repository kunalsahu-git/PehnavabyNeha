'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ClipboardList, 
  Layers, 
  Settings, 
  Users, 
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Loader2,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { name: 'Products', href: '/admin/products', icon: ShoppingBag },
  { name: 'Categories', href: '/admin/categories', icon: Layers },
  { name: 'Collections', href: '/admin/collections', icon: Tag },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Security Check: Verify Admin Role
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user?.uid]);

  const { data: adminRole, isLoading: isAdminChecking } = useDoc(adminRoleRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/account/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (isUserLoading || isAdminChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Authenticating Boutique Admin...</p>
      </div>
    );
  }

  // DEVELOPMENT BYPASS: If user is logged in but not an admin (no document in roles_admin), 
  // allow access for now but show a warning banner as requested.
  const isDevBypass = !!user && !adminRole;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-white sticky top-0 h-screen">
        <div className="p-8">
          <Link href="/admin" className="flex flex-col items-start group">
            <span className="text-2xl font-headline font-bold text-white tracking-tighter leading-none">PEHNAVA</span>
            <span className="text-[9px] font-headline font-medium tracking-[0.4em] text-accent -mt-1 uppercase">Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-500")} />
                {item.name}
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center font-bold text-slate-900">
              {user?.displayName?.[0] || user?.email?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.displayName || 'Administrator'}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Master Access</p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-[100]">
        <Link href="/admin" className="flex flex-col">
          <span className="text-xl font-headline font-bold">PEHNAVA</span>
          <span className="text-[8px] tracking-[0.3em] text-accent uppercase">Admin</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-16 lg:pt-0">
        {isDevBypass && (
          <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center justify-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
              Development Mode: Admin Access Granted without Firestore Role Verification
            </span>
          </div>
        )}
        <div className="p-4 md:p-8 lg:p-12">
          {children}
        </div>
      </main>

      {/* Mobile Nav Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" onClick={() => setIsSidebarOpen(false)}>
          <div className="w-[80vw] h-full bg-slate-900 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
             <nav className="flex-1 space-y-2 mt-12">
                {ADMIN_NAV.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl text-lg font-headline",
                      pathname === item.href ? "bg-primary text-white" : "text-slate-400"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    {item.name}
                  </Link>
                ))}
             </nav>
             <Button 
              onClick={handleLogout}
              variant="outline" 
              className="mt-auto border-white/10 text-white rounded-2xl h-14"
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
