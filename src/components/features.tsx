'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  Smartphone, 
  RefreshCw 
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: '60-Second Prints',
    desc: 'From upload to physical output takes under a minute.',
    colorClass: 'bg-[#4F46E5]/10 text-indigo-400 border-[#4F46E5]/20',
  },
  {
    icon: Shield,
    title: 'Razorpay Payments',
    desc: 'UPI checkout, cards, and wallets supported securely.',
    colorClass: 'bg-[#7C3AED]/10 text-violet-400 border-[#7C3AED]/20',
  },
  {
    icon: Smartphone,
    title: 'QR-First Flow',
    desc: 'Just scan the kiosk QR code and print from browser.',
    colorClass: 'bg-[#4F46E5]/10 text-indigo-400 border-[#4F46E5]/20',
  },
  {
    icon: RefreshCw,
    title: 'Auto Print Queue',
    desc: 'Spooler spool queue retries automatically on printer issues.',
    colorClass: 'bg-[#7C3AED]/10 text-violet-400 border-[#7C3AED]/20',
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 90,
      damping: 14,
    }
  },
};

export default function Features() {
  return (
    <section id="features" className="py-8 sm:py-16 lg:py-20 bg-[#030303] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[20%] left-[5%] w-[300px] h-[300px] bg-[#4F46E5]/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-6 sm:mb-12">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="text-xs uppercase font-bold tracking-widest text-indigo-400"
          >
            Engineered Excellence
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-white font-display"
          >
            Platform Features
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xs sm:text-base text-white/70 font-medium"
          >
            Robust features to keep your self-service printing network running on autopilot 24/7.
          </motion.p>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                variants={cardVariants}
                className="bg-[#0E0E16] border border-white/5 rounded-2xl p-3 sm:p-6 hover:border-[#4F46E5]/40 hover:shadow-2xl hover:shadow-[#4F46E5]/5 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-3 sm:space-y-4">
                  {/* Icon Square */}
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${feat.colorClass}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="font-display font-bold text-xs sm:text-base text-white">
                      {feat.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-white/60 leading-relaxed font-medium">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
