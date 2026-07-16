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
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-primary h-6 w-6"
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const Logo = () => (
    <Link href="/" className="flex items-center gap-2 relative z-50">
      <WaterDropLogo />
      <span className="font-display font-bold text-xl tracking-tight text-foreground">
        Ari <span className="text-primary">Water</span>
      </span>
    </Link>
  );

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 relative z-50">
          <WaterDropLogo />
          <span className={`font-display font-bold text-xl tracking-tight transition-colors ${isScrolled ? "text-foreground" : "text-white"}`}>
            Ari <span className="text-primary">Water</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-8">
          {navLinks.map((link) => {
            const isActive =
              location === link.href ||
              (link.href === "/#story" && location === "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium transition-colors hover:text-primary py-2 ${
                  isActive
                    ? "text-primary"
                    : isScrolled
                      ? "text-muted-foreground"
                      : "text-white/85 hover:text-white"
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions Desktop */}
        <div className="hidden md:flex items-center gap-5">
          {user?.role !== "admin" && (
            <Link
              href="/shop"
              className={`relative transition-colors flex items-center justify-center p-2 ${isScrolled ? "text-foreground hover:text-primary" : "text-white/85 hover:text-white"}`}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors focus:outline-none ring-2 ring-transparent focus:ring-primary/30">
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
                    <Link
                      href="/admin"
                      className="w-full cursor-pointer flex items-center"
                    >
                      <Package className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/orders"
                      className="w-full cursor-pointer flex items-center"
                    >
                      <Package className="mr-2 h-4 w-4" /> My Orders
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className={`font-medium ${!isScrolled ? "text-white/85 hover:text-white hover:bg-white/10" : ""}`}>
                  Log in
                </Button>
              </Link>
              <Link href="/shop">
                <Button className="font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                  Order Now <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Nav Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          {user?.role !== "admin" && (
            <Link href="/shop" className="relative text-foreground p-2 z-50">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 z-50 text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl md:hidden flex flex-col pt-20 px-6 pb-6"
          >
            <nav className="flex flex-col gap-6 flex-1 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-3xl font-display font-medium ${
                    location === link.href ? "text-primary" : "text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-3xl font-display font-medium text-foreground"
                >
                  Admin Dashboard
                </Link>
              )}
            </nav>

            <div className="mt-auto border-t border-border pt-6 flex flex-col gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                      {getInitials(user?.name)}
                    </div>
                    <div>
                      <p className="font-medium text-lg">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start text-base"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-5 w-5" /> Log out
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full text-base"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button
                      size="lg"
                      className="w-full text-base bg-primary text-primary-foreground"
                    >
                      Order Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
