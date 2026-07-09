import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { Droplets, ShoppingCart, User, Menu, X, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [location] = useLocation();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop Water' },
  ];

  if (user?.role === 'customer') {
    navLinks.push({ href: '/orders', label: 'My Orders' });
  }

  const Logo = () => (
    <Link href="/" className="flex items-center gap-2 text-primary">
      <Droplets className="h-6 w-6" />
      <span className="font-display font-bold text-xl tracking-tight text-foreground">Ari <span className="text-primary">Water</span></span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Logo />

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.href ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user?.role !== 'admin' && (
            <Link href="/shop" className="relative text-foreground hover:text-primary transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4 border-l pl-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium leading-none">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
              </div>
              {user.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={logout} title="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/shop">
                <Button>Order Now</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="flex items-center gap-4 md:hidden">
          {user?.role !== 'admin' && (
            <Link href="/shop" className="relative text-foreground">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col">
              <div className="mb-8 mt-4">
                <Logo />
              </div>
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-lg font-medium ${
                      location === link.href ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {user?.role === 'admin' && (
                  <Link href="/admin" className="text-lg font-medium text-foreground">
                    Admin Dashboard
                  </Link>
                )}
              </div>
              
              <div className="mt-auto border-t pt-4 flex flex-col gap-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full justify-start" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" /> Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" className="w-full">Log in</Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full">Create Account</Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
