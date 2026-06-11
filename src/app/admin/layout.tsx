'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Printer, FileText, BarChart3, Settings, LogOut, Menu, X, User } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function verifySession() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.status === 401) {
          if (pathname !== '/admin/login') {
            router.push('/admin/login');
          } else {
            setLoading(false);
          }
        } else {
          if (pathname === '/admin/login') {
            router.push('/admin');
          } else {
            setLoading(false);
          }
        }
      } catch (e) {
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        } else {
          setLoading(false);
        }
      }
    }
    verifySession();
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (e) {
      console.error('Logout failed');
    }
  };

  const menuItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'All Kiosks', href: '/admin/kiosks', icon: Printer },
    { label: 'Print Jobs', href: '/admin/jobs', icon: FileText },
    { label: 'Revenue', href: '/admin/revenue', icon: BarChart3 },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-ink text-primaryTxt flex flex-col md:flex-row relative">
      {/* MOBILE NAVBAR */}
      <div className="md:hidden flex items-center justify-between bg-surface border-b border-customBorder px-5 py-4 w-full z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-brandBlue flex items-center justify-center font-display font-bold text-white text-sm">
            PD
          </div>
          <span className="font-display font-bold text-sm tracking-wide">PrintDrop Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-primaryTxt p-1 hover:bg-ink rounded"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-[240px] bg-surface border-r border-customBorder flex flex-col justify-between z-40 transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-customBorder flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-brandBlue flex items-center justify-center font-display font-black text-white text-base shadow-glow">
              PD
            </div>
            <div>
              <h2 className="font-display font-bold text-sm tracking-wide text-primaryTxt">PrintDrop</h2>
              <span className="text-[10px] text-customSecondary uppercase font-bold tracking-wider">Super Admin</span>
            </div>
          </div>

          {/* Menu */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-md text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-brandBlue text-white shadow-glow'
                      : 'text-customSecondary hover:bg-elevated hover:text-primaryTxt'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-customBorder space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-ink border border-customBorder flex items-center justify-center text-brandBlue">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-primaryTxt truncate">System Admin</p>
              <p className="text-[9px] text-customSecondary uppercase font-bold tracking-wider">Full Rights</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-ink hover:bg-brandRed/10 border border-customBorder hover:border-brandRed/30 text-customSecondary hover:text-brandRed text-xs font-bold rounded-md transition-all uppercase"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-fade-in"
        />
      )}

      {/* Content */}
      <main className="flex-1 min-w-0 min-h-screen overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
