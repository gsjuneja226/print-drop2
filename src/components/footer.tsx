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
      className="bg-[#030303] border-t border-white/5 relative z-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/40">
        
        {/* Left - Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] flex items-center justify-center font-display font-bold text-white text-base shadow-sm">
            PD
          </div>
          <span className="font-display font-bold text-sm tracking-wide text-white">
            PrintDrop
          </span>
        </div>

        {/* Center - Links */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 font-semibold text-white/60">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#features" className="hover:text-white transition-colors">Platform Features</a>
          <a href="/admin" className="hover:text-white transition-colors">Admin Portal</a>
        </div>

        {/* Right - Copyright */}
        <p className="text-center md:text-right font-medium">
          © 2026 PrintDrop. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}
