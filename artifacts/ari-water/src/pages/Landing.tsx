import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Truck, Droplet, Star, User } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/40 mix-blend-multiply z-10" />
          <img 
            src="/hero.jpg" 
            alt="Ari Water bottles on table" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-3xl">
            <span className="inline-block py-1 px-3 rounded-full bg-primary/20 text-primary-foreground backdrop-blur-md border border-primary/30 text-sm font-medium mb-6 animate-in slide-in-from-bottom-4 duration-700">
              Kenyan Family Founded. Premium Quality.
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight leading-[1.1] mb-6 animate-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
              Quench your thirst with <span className="text-primary-foreground">Ari Water.</span>
            </h1>
            <p className="text-xl text-slate-200 mb-10 max-w-2xl animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
              Pure Water. Pure Living. We deliver crisp, refreshing, deeply purified water straight to your doorstep, office, or event in Nairobi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-500 fill-mode-both">
              <Link href="/shop">
                <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto shadow-xl shadow-primary/30 hover:scale-105 transition-transform">
                  Order Delivery <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Quality Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">Why choose Ari Water?</h2>
            <p className="text-lg text-slate-600">
              We don't just package water. We obsess over the purification process to ensure every drop meets the highest standards of clarity and taste.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center group">
              <div className="h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                <Droplet className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">7-Step Purification</h3>
              <p className="text-slate-600">Reverse osmosis, UV treatment, and micron filtration guarantee absolute purity and a crisp taste.</p>
            </div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">KEBS Certified</h3>
              <p className="text-slate-600">Fully compliant with Kenya Bureau of Standards. Safe for your family, your employees, and your guests.</p>
            </div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                <Truck className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Reliable Delivery</h3>
              <p className="text-slate-600">Order online and track your delivery. We bring water directly to your home or office, right when you need it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">Our Products</h2>
              <p className="text-lg text-slate-600">Sized for every need, from personal hydration to office dispensers.</p>
            </div>
            <Link href="/shop" className="hidden md:flex text-primary font-semibold items-center hover:underline">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { id: 1, name: 'Personal Bottle', size: '500ml', image: '/bottle-500ml.png', desc: 'Perfect for on-the-go hydration, meetings, and events.' },
              { id: 2, name: 'Family Bottle', size: '1 Litre', image: '/bottle-1l.png', desc: 'Ideal for your desk, gym session, or daily hydration goal.' },
              { id: 3, name: 'Home Dispenser', size: '5 Litres', image: '/bottle-5l.png', desc: 'The economical choice for families and small offices.' },
            ].map((product) => (
              <div key={product.id} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-64 mb-8 flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img src={product.image} alt={product.name} className="h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                  <span className="bg-secondary text-primary text-sm font-bold px-3 py-1 rounded-full">{product.size}</span>
                </div>
                <p className="text-slate-600 mb-6">{product.desc}</p>
                <Link href={`/shop?size=${product.size}`}>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                    Order Now
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/shop">
              <Button variant="ghost" className="text-primary font-semibold">
                View All Products <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Story / Community Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img src="/trust-delivery.jpg" alt="Ari Water Delivery" className="w-full h-auto object-cover" />
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/10"></div>
              </div>
            </div>
            
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900">
                Rooted in Nairobi. Built for you.
              </h2>
              <p className="text-lg text-slate-600">
                Ari Water started as a family business with a simple mission: to provide our community with water they could trust implicitly. The name "Ari" comes from the founders' twin daughters—a constant reminder that what we produce must be pure enough for our own family.
              </p>
              <p className="text-lg text-slate-600">
                Today, we've graduated from taking WhatsApp orders to serving hundreds of homes and offices across the city, but our commitment to quality and personal service hasn't changed.
              </p>
              
              <div className="pt-6 border-t border-slate-100 flex items-center gap-6">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center overflow-hidden">
                      <User className="h-6 w-6 text-slate-400" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex text-accent mb-1">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
                  </div>
                  <p className="text-sm font-medium text-slate-900">Loved by 500+ households</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to taste the difference?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Order your first batch of Ari Water today and experience the crisp, pure taste of quality hydration.
          </p>
          <Link href="/shop">
            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg shadow-xl hover:scale-105 transition-transform text-primary font-bold">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
