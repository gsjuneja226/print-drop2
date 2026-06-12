'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Hero from '@/components/hero';
import HowItWorks from '@/components/how-it-works';
import Features from '@/components/features';
import Footer from '@/components/footer';

export default function MarketingLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#030303] text-[#FAFAFB] select-none font-body antialiased">
      
      {/* HEADER NAVBAR */}
      <header className="border-b border-white/5 bg-[#030303]/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] flex items-center justify-center font-display font-bold text-white text-base shadow-sm">
              PD
            </div>
            <span className="font-display font-bold text-lg tracking-wide text-white">
              PrintDrop
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-white/60">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white transition-colors">Platform Features</a>
          </nav>

          {/* CTA */}
          <button
            onClick={() => router.push('/admin')}
            className="px-5 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-xs font-semibold text-white rounded-xl transition-all shadow-md shadow-[#4F46E5]/10 hover:shadow-lg hover:shadow-[#4F46E5]/20 flex items-center gap-1.5"
          >
            Super Admin
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <Hero />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Features Section */}
      <Features />

      {/* Footer */}
      <Footer />
    </div>
  );
}
