'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  ExternalLink,
  Images,
  Star,
  Film,
  Navigation,
  BarChart3,
  RotateCcw,
  IndianRupee,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';


type NavItem = { name: string; href: string; icon: React.ElementType };
type NavGroup = { label: string; icon: React.ElementType; items: NavItem[] };

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    icon: ClipboardList,
    items: [
      { name: 'Overview',      href: '/admin',           icon: LayoutDashboard },
      { name: 'Analytics',     href: '/admin/analytics', icon: BarChart3 },
      { name: 'Orders',        href: '/admin/orders',    icon: ClipboardList },
      { name: 'Returns',       href: '/admin/returns',   icon: RotateCcw },
      { name: 'Refund Ledger', href: '/admin/refunds',   icon: IndianRupee },
      { name: 'Reviews',       href: '/admin/reviews',   icon: MessageSquare },
      { name: 'Messages',      href: '/admin/messages',  icon: Mail },
    ],
  },
  {
    label: 'Catalogue',
    icon: ShoppingBag,
    items: [
      { name: 'Products',    href: '/admin/products',    icon: ShoppingBag },
      { name: 'Categories',  href: '/admin/categories',  icon: Layers },
      { name: 'Collections', href: '/admin/collections', icon: Tag },
      { name: 'Coupons',     href: '/admin/coupons',     icon: Tag },
    ],
  },
  {
    label: 'Storefront',
    icon: Images,
    items: [
      { name: 'Navigation',        href: '/admin/navigation',       icon: Navigation },
      { name: 'Hero Slides',       href: '/admin/hero-slides',      icon: Images },
      { name: 'Featured Product',  href: '/admin/featured-product', icon: Star },
      { name: 'Studio Reels',      href: '/admin/studio-reels',     icon: Film },
    ],
  },
  {
    label: 'Configuration',
    icon: Settings,
    items: [
      { name: 'Admin Users', href: '/admin/users',    icon: Users },
      { name: 'Settings',    href: '/admin/settings', icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Groups whose active child is matched are auto-expanded; others start collapsed
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    ADMIN_NAV_GROUPS.forEach(g => {
      if (g.items.some(i => i.href === pathname || (i.href !== '/admin' && pathname.startsWith(i.href)))) {
        initial.add(g.label);
      }
    });
    // Default: open Operations so the sidebar doesn't look empty on first load
    initial.add('Operations');
    return initial;
  });

  const toggleGroup = (label: string) =>
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });

  const isItemActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  // Security Check: Verify Admin Role
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user?.uid]);

  const { data: adminRole, isLoading: isAdminChecking } = useDoc(adminRoleRef);

  // useDoc initializes isLoading:false — on the first render after adminRoleRef becomes
  // non-null, isAdminChecking is still false before the effect inside useDoc has run.
  // We track whether the check has ever been in-flight so we only redirect after the
  // Firestore snapshot has actually returned (not prematurely on that one-render gap).
  const roleCheckStarted = React.useRef(false);
  if (isAdminChecking) roleCheckStarted.current = true;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/account/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    // Guard: only redirect once the Firestore check has started AND finished with no role.
    if (!isUserLoading && roleCheckStarted.current && adminRoleRef && !isAdminChecking && user && !adminRole) {
      router.push('/');
    }
  }, [user, isUserLoading, adminRoleRef, isAdminChecking, adminRole, router]);

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

  // Show loader while: auth is resolving, db/uid not ready yet, check not started yet, or role fetch in progress
  if (isUserLoading || !user || !adminRoleRef || !roleCheckStarted.current || isAdminChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Authenticating Boutique Admin...</p>
      </div>
    );
  }

  // Role check is complete — if no role document found, render nothing (redirect effect handles it)
  if (!adminRole) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-white sticky top-0 h-screen overflow-hidden">
        <div className="p-8 shrink-0">
          <Link href="/admin" className="flex items-center gap-3 group">
            <Image src="/images/logo.svg" alt="Pehnava" width={36} height={36} className="h-9 w-9 object-contain brightness-0 invert" />
            <div className="flex flex-col leading-none">
              <span className="text-xl font-headline font-bold text-white tracking-tighter">PEHNAVA</span>
              <span className="text-[8px] font-headline font-medium tracking-[0.35em] text-accent uppercase">Admin Panel</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-0.5 sidebar-scrollbar">
          {ADMIN_NAV_GROUPS.map((group) => {
            const isOpen = openGroups.has(group.label);
            const hasActive = group.items.some(i => isItemActive(i.href));
            return (
              <div key={group.label}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest",
                    hasActive
                      ? "text-white/90 bg-white/8"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  )}
                >
                  <group.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronRight className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200 shrink-0",
                    isOpen ? "rotate-90" : ""
                  )} />
                </button>

                {/* Child items */}
                {isOpen && (
                  <div className="ml-3 pl-3 border-l border-white/8 mt-0.5 mb-1 space-y-0.5">
                    {group.items.map((item) => {
                      const active = isItemActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                            active
                              ? "bg-primary text-white shadow-md shadow-primary/25"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-500")} />
                          {item.name}
                          {active && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <Separator className="my-3 bg-white/10" />

          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-accent hover:bg-white/5"
          >
            <ExternalLink className="h-4 w-4" />
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
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image src="/images/logo.svg" alt="Pehnava" width={30} height={30} className="h-7 w-7 object-contain brightness-0 invert" />
          <div className="flex flex-col leading-none">
            <span className="text-base font-headline font-bold tracking-tighter">PEHNAVA</span>
            <span className="text-[7px] tracking-[0.3em] text-accent uppercase font-bold">Admin Panel</span>
          </div>
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
            <Link href="/admin" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3">
              <Image src="/images/logo.svg" alt="Pehnava" width={34} height={34} className="h-8 w-8 object-contain brightness-0 invert" />
              <div className="flex flex-col leading-none">
                <span className="text-xl font-headline font-bold text-white tracking-tighter">PEHNAVA</span>
                <span className="text-[8px] font-headline font-medium tracking-[0.35em] text-accent uppercase">Admin Panel</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 sidebar-scrollbar mt-2 max-h-[calc(100vh-180px)]">
            {ADMIN_NAV_GROUPS.map((group) => {
              const isOpen = openGroups.has(group.label);
              const hasActive = group.items.some(i => isItemActive(i.href));
              return (
                <div key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest",
                      hasActive ? "text-white/90" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                    )}
                  >
                    <group.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200 shrink-0", isOpen ? "rotate-90" : "")} />
                  </button>
                  {isOpen && (
                    <div className="ml-3 pl-3 border-l border-white/8 mt-0.5 mb-1 space-y-0.5">
                      {group.items.map((item) => {
                        const active = isItemActive(item.href);
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                              active ? "bg-primary text-white shadow-md shadow-primary/25" : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-500")} />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
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
        <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto mt-16 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
