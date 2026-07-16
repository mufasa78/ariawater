import React from "react";
import { Link } from "wouter";
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const WaterDropLogo = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-primary"
  >
    <path
      d="M12 2.69466C12 2.69466 4.5 9.11728 4.5 15.5C4.5 19.6421 7.85786 23 12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 9.11728 12 2.69466 12 2.69466Z"
      fill="currentColor"
    />
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-[#0c1a2e] text-slate-300 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10">
        {/* Brand Statement Top Section */}
        <div className="border-b border-white/10">
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Pure Water. <span className="text-primary">Pure Living.</span>
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
          </div>
        </div>

        {/* Main Grid */}
        <div className="container mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 text-white">
              <WaterDropLogo />
              <span className="font-display font-bold text-2xl tracking-tight">
                Ari Water
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Family-founded in Nairobi, Kenya. Water you can trust for your
              home, office, and community.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="#"
                aria-label="Instagram"
                className="bg-white/5 p-2 rounded-full hover:bg-primary/20 hover:text-primary transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="bg-white/5 p-2 rounded-full hover:bg-primary/20 hover:text-primary transition-all"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/254726432689"
                aria-label="WhatsApp"
                className="bg-white/5 p-2 rounded-full hover:bg-[#25D366]/20 hover:text-[#25D366] transition-all"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div>
            <h3 className="font-display font-semibold text-white text-lg mb-6">
              Shop
            </h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <Link
                  href="/shop"
                  className="hover:text-primary transition-colors inline-block"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Bottled Water
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Water Refilling
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Office Delivery
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Events Supply
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="font-display font-semibold text-white text-lg mb-6">
              Company
            </h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <Link
                  href="/#story"
                  className="hover:text-primary transition-colors inline-block"
                >
                  About Ari Water
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Quality Standards
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Delivery Info
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary transition-colors inline-block"
                >
                  Aritwin Limited
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-display font-semibold text-white text-lg mb-6">
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <span className="leading-relaxed">Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>+254 726 432 689</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>aritwinlimited@gmail.com</span>
              </li>
            </ul>
            <div className="mt-6">
              <Button
                asChild
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20b858] text-white border-none shadow-lg shadow-[#25D366]/20"
              >
                <a
                  href="https://wa.me/254726432689"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp Us
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Aritwin Limited. Trading as Ari
              Water. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-300 transition-colors">
                Privacy
              </a>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <a href="#" className="hover:text-slate-300 transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
