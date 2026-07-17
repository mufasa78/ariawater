import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LayoutDashboard, Package, ShoppingBag, Droplets, LogOut, Megaphone, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center">Unauthorized. Redirecting...</div>;
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
    { href: '/admin/accounting', label: 'Accounting', icon: Calculator },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 md:h-screen md:sticky top-0 flex flex-col shadow-xl z-20">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-white">
            <Droplets className="h-8 w-8 text-primary" />
            <span className="font-display font-bold text-2xl tracking-tight">Ari <span className="text-primary">Admin</span></span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/20 text-primary font-medium' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800" onClick={logout}>
            <LogOut className="mr-3 h-5 w-5" /> Log out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-x-hidden w-full">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
