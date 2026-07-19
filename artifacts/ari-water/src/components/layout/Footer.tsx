import React from "react";
import { Link } from "wouter";
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  Droplets,
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

/**
 * NairobiSkyline — SVG city silhouette that creates the footer's top edge.
 * The path traces a stylised Nairobi cityscape with water towers, office blocks,
 * and the KICC-style round tower. Fill matches the footer background so it
 * appears to rise organically from behind the preceding content.
 */
const NairobiSkyline = () => (
  <div className="w-full leading-[0] -mb-px" aria-hidden="true">
    <svg
      viewBox="0 0 1440 110"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="w-full block"
    >
      <path
        fill="#0c1a2e"
        d="
          M0,110 L0,84
          L48,84 L48,72 L62,72 L62,64 L75,64 L75,72 L90,72
          L90,60 L104,60 L104,54 L118,54 L118,60 L132,60
          L132,72 L155,72 L155,78 L175,78
          L175,56 L188,56 L188,50 L202,50 L202,56 L215,56
          L215,78 L240,78
          L240,40 L245,34 L254,26 L264,26 L273,34 L278,40
          L278,78 L308,78
          L308,50 L320,50 L320,42 L334,42 L334,50 L346,50
          L346,62 L368,62 L368,78 L395,78
          L395,62 L406,52 L424,52 L435,62 L435,78 L462,78
          L462,46 L474,46 L474,40 L488,40 L488,46 L500,46
          L500,58 L522,58 L522,78 L548,78
          L548,56 L560,56 L560,48 L572,48 L572,40 L586,40
          L586,48 L598,48 L598,58 L618,58 L618,78 L645,78
          L645,60 L656,60 L656,48 L668,48 L668,60 L680,60
          L680,74 L700,74
          L700,50 L712,50 L712,42 L728,42 L728,50 L742,50
          L742,62 L765,62 L765,78 L792,78
          L792,54 L804,54 L804,46 L818,46 L818,40 L832,40
          L832,46 L844,46 L844,54 L858,54 L858,68 L880,68
          L880,52 L892,44 L908,44 L920,52 L920,68 L944,68
          L944,34 L956,34 L956,28 L968,28 L968,34 L980,34
          L980,52 L1004,52 L1004,68 L1030,68
          L1030,56 L1042,56 L1042,64 L1068,64
          L1068,46 L1080,46 L1080,38 L1094,38 L1094,46 L1106,46
          L1106,58 L1128,58 L1128,74 L1155,74
          L1155,52 L1168,52 L1168,62 L1198,62
          L1198,52 L1210,52 L1210,60 L1238,60
          L1238,70 L1260,70 L1260,60 L1278,60 L1278,70 L1300,70
          L1300,80 L1330,80 L1330,72 L1360,72 L1360,86
          L1440,86 L1440,110 Z
        "
      />
    </svg>
  </div>
);

export function Footer() {
  return (
    <footer className="bg-[#0c1a2e] text-slate-300 relative overflow-hidden">
      {/* Nairobi skyline silhouette — top edge of the footer */}
      <NairobiSkyline />

      {/* Subtle dot-grid background */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative z-10">
        {/* Brand Statement */}
        <div className="border-b border-white/10">
          <div className="container mx-auto px-4 py-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Droplets className="h-8 w-8 text-primary" />
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
                Pure Water. <span className="text-primary">Pure Living.</span>
              </h2>
            </div>
            <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
          </div>
        </div>

        {/* Main Grid */}
        <div className="container mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-3 text-white">
              <WaterDropLogo />
              <span className="font-display font-bold text-xl tracking-tight">
                Ari Water
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Family-founded in Nairobi, Kenya. Water you can trust for your
              home, office, and community.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ari Water on Instagram"
                className="bg-white/5 p-2.5 rounded-full hover:bg-primary/20 hover:text-primary transition-all"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ari Water on Facebook"
                className="bg-white/5 p-2.5 rounded-full hover:bg-primary/20 hover:text-primary transition-all"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/254726432689"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Ari Water"
                className="bg-white/5 p-2.5 rounded-full hover:bg-[#25D366]/20 hover:text-[#25D366] transition-all"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div>
            <h3 className="font-display font-semibold text-white text-base mb-5">
              Shop
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              {[
                { label: "All Products", href: "/shop" },
                { label: "Bottled Water", href: "/shop" },
                { label: "Water Refilling", href: "/shop" },
                { label: "Office Delivery", href: "/shop" },
                { label: "Events Supply", href: "/shop" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-primary transition-colors inline-block hover:translate-x-0.5 transition-transform"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="font-display font-semibold text-white text-base mb-5">
              Company
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              {[
                { label: "About Ari Water", href: "/#story" },
                { label: "Quality Standards", href: "/#quality" },
                { label: "Delivery Info", href: "/#delivery" },
                { label: "Contact Us", href: "/#contact" },
                { label: "Aritwin Limited", href: "/" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="hover:text-primary transition-colors inline-block hover:translate-x-0.5 transition-transform"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-display font-semibold text-white text-base mb-5">
              Get in Touch
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <a href="tel:+254726432689" className="hover:text-primary transition-colors">
                  +254 726 432 689
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a href="mailto:aritwinlimited@gmail.com" className="hover:text-primary transition-colors break-all">
                  aritwinlimited@gmail.com
                </a>
              </li>
            </ul>
            <div className="mt-5">
              <Button
                asChild
                size="sm"
                className="bg-[#25D366] hover:bg-[#20b858] text-white border-none shadow-lg shadow-[#25D366]/20"
              >
                <a
                  href="https://wa.me/254726432689"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp Us
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 text-center sm:text-left">
              &copy; {new Date().getFullYear()} Aritwin Limited. Trading as Ari Water. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">
                Privacy Policy
              </Link>
              <span className="w-px h-3 bg-slate-700" />
              <Link href="/terms" className="hover:text-slate-300 transition-colors">
                Terms of Use
              </Link>
              <span className="w-px h-3 bg-slate-700" />
              <Link href="/cookie-policy" className="hover:text-slate-300 transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
