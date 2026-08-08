import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/clerk-auth-wrapper";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useCart } from "@/lib/cart-context";
import {
  ShoppingCart,
  Menu,
  X,
  ArrowRight,
  Package,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const AriWaterLogo = () => (
  <img
    src="/ari-water-logo.png"
    alt="Ari Water"
    className="h-8 w-auto object-contain shrink-0"
  />
);

export function Navbar() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop Water" },
    { href: "/about", label: "About" },
  ];

  return (
    <>
      {/* Floating pill navbar */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 pt-4 pointer-events-none">
        <div className="max-w-6xl mx-auto pointer-events-auto">
          <div className="bg-background/95 backdrop-blur-xl border border-border/60 shadow-lg shadow-black/5 rounded-2xl h-14 flex items-center justify-between px-4 sm:px-5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <AriWaterLogo />
              <span className="font-display font-bold text-lg tracking-tight text-foreground">
                Ari <span className="text-primary">Water</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex flex-1 justify-center items-center gap-6 px-4">
              {navLinks.map((link) => {
                const isActive =
                  location === link.href ||
                  (link.href === "/" && location === "/") ||
                  (link.href !== "/" && link.href !== "/#story" && location.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-sm font-medium transition-colors hover:text-primary py-1 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-underline"
                        className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <Link
                href="/shop"
                className="relative text-muted-foreground hover:text-primary transition-colors p-1.5 mr-1"
                aria-label={`Cart (${totalItems} items)`}
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>

              <SignedIn>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Package className="h-4 w-4" /> Dashboard
                    </Button>
                  </Link>
                )}
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
              </SignedIn>
              
              <SignedOut>
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" /> Sign In
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button size="sm" className="font-medium text-sm h-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                      Order Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </>
              </SignedOut>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 md:hidden">
              <Link href="/shop" className="relative text-muted-foreground p-1.5" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-foreground"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-4 top-[84px] z-40 md:hidden rounded-2xl bg-background/98 backdrop-blur-2xl border border-border/60 shadow-2xl overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <SignedIn>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-accent"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </SignedIn>
            </nav>

            <div className="border-t border-border mx-4 mb-4 mt-2 pt-4">
              <SignedIn>
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserButton 
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: "h-9 w-9",
                          },
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SignedIn>
              
              <SignedOut>
                <div className="space-y-2">
                  <Link href="/login" className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/shop" className="block">
                    <Button size="sm" className="w-full bg-primary text-primary-foreground">
                      Order Now
                    </Button>
                  </Link>
                </div>
              </SignedOut>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
