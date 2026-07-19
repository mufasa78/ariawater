import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { getInitials } from "@/lib/utils";
import {
  ShoppingCart,
  Menu,
  X,
  LogOut,
  ArrowRight,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const WaterDropLogo = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-primary h-5 w-5 shrink-0"
  >
    <path
      d="M12 2.69466C12 2.69466 4.5 9.11728 4.5 15.5C4.5 19.6421 7.85786 23 12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 9.11728 12 2.69466 12 2.69466Z"
      fill="currentColor"
    />
  </svg>
);

export function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop Water" },
    { href: "/#story", label: "About" },
  ];

  if (user?.role === "customer") {
    navLinks.push({ href: "/orders", label: "My Orders" });
  }

  const handleLogout = async () => {
    await logout();
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  return (
    <>
      {/* Floating pill navbar */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 pt-4 pointer-events-none">
        <div className="max-w-6xl mx-auto pointer-events-auto">
          <div className="bg-background/95 backdrop-blur-xl border border-border/60 shadow-lg shadow-black/5 rounded-2xl h-14 flex items-center justify-between px-4 sm:px-5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <WaterDropLogo />
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
              {user?.role !== "admin" && (
                <Link
                  href="/shop"
                  className="relative text-muted-foreground hover:text-primary transition-colors p-1.5"
                  aria-label={`Cart (${totalItems} items)`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-colors focus:outline-none ring-2 ring-transparent focus:ring-primary/30">
                      {getInitials(user?.name)}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm font-medium text-foreground truncate">
                      {user.name}
                    </div>
                    <DropdownMenuSeparator />
                    {user.role === "admin" ? (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="w-full cursor-pointer flex items-center">
                          <Package className="mr-2 h-4 w-4" /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/orders" className="w-full cursor-pointer flex items-center">
                          <Package className="mr-2 h-4 w-4" /> My Orders
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="font-medium text-sm h-8">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button size="sm" className="font-medium text-sm h-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                      Order Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 md:hidden">
              {user?.role !== "admin" && (
                <Link href="/shop" className="relative text-muted-foreground p-1.5" aria-label="Cart">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
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
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-accent"
                >
                  Admin Dashboard
                </Link>
              )}
            </nav>

            <div className="border-t border-border mx-4 mb-4 mt-2 pt-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {getInitials(user?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">Log in</Button>
                  </Link>
                  <Link href="/shop" className="flex-1">
                    <Button size="sm" className="w-full bg-primary text-primary-foreground">
                      Order Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
