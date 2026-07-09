import React from 'react';
import { Link } from 'wouter';
import { Droplets, MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 md:py-16">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-4 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 text-white">
            <Droplets className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl tracking-tight">Ari <span className="text-primary">Water</span></span>
          </Link>
          <p className="text-sm text-slate-400">
            Pure Water. Pure Living. Family-founded and community-rooted in the heart of Kenya.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4">Shop</h3>
          <ul className="space-y-3 text-sm">
            <li><Link href="/shop" className="hover:text-primary transition-colors">All Products</Link></li>
            <li><Link href="/shop?category=bottles" className="hover:text-primary transition-colors">Bottled Water</Link></li>
            <li><Link href="/shop?category=dispensers" className="hover:text-primary transition-colors">Dispensers & Refills</Link></li>
            <li><Link href="/shop?category=accessories" className="hover:text-primary transition-colors">Accessories</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4">Company</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Quality Standards</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Delivery Info</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Industrial Area, Nairobi<br />Kenya</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span>+254 700 000 000</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span>hello@ariwater.co.ke</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Aritwin Limited. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <a href="#" className="hover:text-slate-300">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
