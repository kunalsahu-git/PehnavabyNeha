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
  AlertTriangle,
  ExternalLink,
  Database,
  Images,
  Star,
  Film,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';

const SHOW_SEED_DATA = typeof window !== 'undefined' && window.location.hostname === 'localhost';

const ADMIN_NAV = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { name: 'Products', href: '/admin/products', icon: ShoppingBag },
  { name: 'Categories', href: '/admin/categories', icon: Layers },
  { name: 'Collections', href: '/admin/collections', icon: Tag },
  { name: 'Navigation', href: '/admin/navigation', icon: Navigation },
  { name: 'Hero Slides', href: '/admin/hero-slides', icon: Images },
  { name: 'Featured Product', href: '/admin/featured-product', icon: Star },
  { name: 'Studio Reels', href: '/admin/studio-reels', icon: Film },
  { name: 'Admin Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  ...(SHOW_SEED_DATA ? [{ name: 'Seed Data', href: '/admin/seed', icon: Database }] : []),
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
    // Redirect only when we're sure the user isn't authenticated
    if (!isUserLoading && !user) {
      router.push('/account/login');
    }
  }, [user, isUserLoading, router]);

  // Fix: Radix UI sets pointer-events:none on <body> while a Sheet/Dialog is open.
  // After an async save closes the modal, Radix sometimes fails to clean this up,
  // leaving the entire page unclickable. This MutationObserver fires immediately
  // whenever body's style changes and removes the orphaned pointer-events:none
  // as soon as no Radix overlay is actually open anymore.
  useEffect(() => {
    const releaseBodyLock = () => {
      const hasOpenOverlay = !!document.querySelector(
        '[data-radix-dialog-overlay][data-state="open"], [data-radix-popper-content-wrapper]'
      );
      if (!hasOpenOverlay) {
        if (document.body.style.pointerEvents === 'none') {
          document.body.style.pointerEvents = '';
        }
        document.body.removeAttribute('data-scroll-locked');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };

    const observer = new MutationObserver(releaseBodyLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked'],
    });

    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  // Show loader during initial auth check or while confirming admin privileges
  if (isUserLoading || (user && isAdminChecking)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Authenticating Boutique Admin...</p>
      </div>
    );
  }

  // If no user exists yet, stop rendering to prevent children from running unauthorized queries
  if (!user) {
    return null;
  }

  // DEVELOPMENT BYPASS: If user is logged in but not an admin (no document in roles_admin), 
  // allow access for now but show a warning banner as requested.
  const isDevBypass = !!user && !adminRole;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-white sticky top-0 h-screen overflow-hidden">
        <div className="p-8 shrink-0">
          <Link href="/admin" className="flex flex-col items-start group">
            <span className="text-2xl font-headline font-bold text-white tracking-tighter leading-none">PEHNAVA</span>
            <span className="text-[9px] font-headline font-medium tracking-[0.4em] text-accent -mt-1 uppercase">Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1 sidebar-scrollbar">
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
          
          <Separator className="my-4 bg-white/10" />
          
          <Link 
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium text-accent hover:bg-white/5"
          >
            <ExternalLink className="h-5 w-5" />
            View Website
          </Link>
        </nav>

        <div className="shrink-0 p-6 border-t border-white/5 space-y-4">
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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-[100] border-b border-white/10">
        <Link href="/admin" className="flex flex-col">
          <span className="text-xl font-headline font-bold tracking-tight">PEHNAVA</span>
          <span className="text-[8px] tracking-[0.3em] text-accent uppercase font-bold">Admin Panel</span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hover:bg-white/10 rounded-xl"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Nav Overlay/Drawer */}
      <div 
        className={cn(
          "lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[90] transition-all duration-300",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )} 
        onClick={() => setIsSidebarOpen(false)}
      >
        <aside 
          className={cn(
            "w-[280px] h-full bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-8 border-b border-white/5">
            <Link href="/admin" onClick={() => setIsSidebarOpen(false)} className="flex flex-col">
              <span className="text-2xl font-headline font-bold text-white tracking-tighter">PEHNAVA</span>
              <span className="text-[9px] font-headline font-medium tracking-[0.4em] text-accent uppercase">Boutique Admin</span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1 sidebar-scrollbar mt-4 max-h-[calc(100vh-220px)]">
            {ADMIN_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-sm font-medium",
                    isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-500")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5 bg-slate-900 space-y-4">
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="w-full border-white/10 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 h-12 rounded-xl text-xs font-bold uppercase tracking-widest"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Warning Banner for Bypass (Optional) */}
        {isDevBypass && (
          <div className="bg-amber-50 border-b border-amber-100 px-8 py-3 flex items-center gap-3 shrink-0 mt-16 lg:mt-0">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Development Bypass Active: No role found in `roles_admin`. Permissions limited.
            </p>
          </div>
        )}

        <div className={cn(
          "flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto",
          !isDevBypass && "mt-16 lg:mt-0"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
