'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Upload, CreditCard, Printer } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: QrCode,
    title: 'Scan Kiosk QR',
    desc: 'Point your phone camera at the kiosk station QR code to instantly launch the connection.',
  },
  {
    number: '02',
    icon: Upload,
    title: 'Upload Documents',
    desc: 'Select PDFs, Word files, or images from your device. Custom print settings extract instantly.',
  },
  {
    number: '03',
    icon: CreditCard,
    title: 'Pay Securely',
    desc: 'Checkout instantly with Razorpay via UPI, debit/credit cards, or net banking.',
  },
  {
    number: '04',
    icon: Printer,
    title: 'Collect Output',
    desc: 'Collect printed documents immediately from the physical tray. No code entries needed.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 bg-[#08080C] overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#7C3AED]/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#4F46E5]/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-20">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="text-xs uppercase font-bold tracking-widest text-indigo-400"
          >
            Workflow Overview
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-white font-display"
          >
            How It Works
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-white/70 font-medium"
          >
            From upload to physical copy in under 60 seconds. Learn the quick self-service printing process.
          </motion.p>
        </div>

        {/* Steps Grid / Timeline */}
        <div className="relative">
          {/* Connector Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-white/10 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 15,
                    delay: idx * 0.15,
                  }}
                  className="bg-[#0E0E16]/80 rounded-2xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.25)] border border-white/5 border-l-4 border-l-[#4F46E5] flex flex-col justify-between hover:border-white/10 hover:shadow-[0_10px_30px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-300 group min-h-[260px]"
                >
                  <div className="space-y-4">
                    {/* Circle Header & Icon */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-full bg-[#4F46E5]/15 border border-[#4F46E5]/30 flex items-center justify-center font-display font-bold text-xs text-indigo-400 group-hover:bg-[#4F46E5] group-hover:text-white transition-all duration-300">
                        {step.number}
                      </div>
                      
                      <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/5 border border-white/5 flex items-center justify-center text-[#7C3AED] group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-base text-white">
                        {step.title}
                      </h3>
                      <p className="text-xs text-white/60 leading-relaxed font-medium">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
