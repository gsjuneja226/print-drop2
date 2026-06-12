'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-white border-t border-[#E5E7F0] relative z-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#0F0F1A]/60">
        
        {/* Left - Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] flex items-center justify-center font-display font-bold text-white text-base shadow-sm">
            PD
          </div>
          <span className="font-display font-bold text-sm tracking-wide text-[#0F0F1A]">
            PrintDrop
          </span>
        </div>

        {/* Center - Links */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 font-semibold text-[#0F0F1A]/70">
          <a href="#features" className="hover:text-[#4F46E5] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#4F46E5] transition-colors">How It Works</a>
          <a href="#" className="hover:text-[#4F46E5] transition-colors">Pricing</a>
          <a href="#" className="hover:text-[#4F46E5] transition-colors">Docs</a>
        </div>

        {/* Right - Copyright */}
        <p className="text-center md:text-right font-medium">
          © 2026 PrintDrop. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}
