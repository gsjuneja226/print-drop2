'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Play, Search, MapPin, X, ChevronRight, Activity, Globe, RefreshCw } from 'lucide-react';

export default function Hero() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      setLoading(true);
      fetch('/api/public/kiosks')
        .then((res) => res.json())
        .then((data) => {
          setKiosks(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error loading kiosks:', err);
          setLoading(false);
        });
    }
  }, [isModalOpen]);

  // Click outside to close modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    }
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModalOpen]);

  const filteredKiosks = kiosks.filter((k) =>
    k.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (k.location_addr && k.location_addr.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#030303] px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      {/* Subtle Dot Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
        {/* Left Column - Content */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 bg-[#4F46E5]/10 border border-[#4F46E5]/20 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-indigo-400"
          >
            <span className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full animate-ping" />
            ✦ Self-Service Printing Platform
          </motion.div>

          {/* Heading */}
          <div className="overflow-hidden">
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight font-display"
            >
              Print Anything.
              <br />
              Anywhere.
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent block mt-1">
                Instantly.
              </span>
            </motion.h1>
          </div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm sm:text-base md:text-lg text-white/70 max-w-xl leading-relaxed font-medium"
          >
            Deploy kiosks in minutes. No staff. Scan, upload, pay, and print in under 60 seconds. High-speed, secure, and hassle-free.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 pt-2"
          >
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[#4F46E5]/20 hover:shadow-xl hover:shadow-[#4F46E5]/30 transform active:scale-95 flex items-center justify-center gap-2"
            >
              Get Started Free
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <a
              href="#how-it-works"
              className="px-8 py-4 border border-white/10 hover:border-white/30 text-white/80 hover:bg-white/5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Demo
            </a>
          </motion.div>
        </div>

        {/* Right Column - Kiosk Demo Loop Video */}
        <div className="lg:col-span-5 w-full flex justify-center items-center relative mt-10 lg:mt-0 px-2 sm:px-0">
          
          {/* Radial Glow Blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] bg-gradient-to-r from-[#4F46E5]/15 to-[#7C3AED]/15 rounded-full blur-[90px] pointer-events-none" />

          {/* Levitating Video Frame */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: 'easeInOut',
            }}
            className="w-full max-w-[420px] aspect-[16/10] bg-[#0E0E15]/50 border border-white/10 rounded-3xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <video
              src="/PrintDrop_kiosk_platform_202606120659.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover rounded-[1.25rem] bg-black"
            />
          </motion.div>
        </div>
      </div>

      {/* Kiosk Finder Modal (Stunning Dark Slide-in overlay) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#0D0D12] rounded-3xl border border-white/10 shadow-2xl w-full max-w-lg p-6 relative overflow-hidden flex flex-col max-h-[85vh] z-10 text-white"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Find a Printing Kiosk</h3>
                  <p className="text-xs text-white/60">Select an online kiosk to start document upload</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Type location (e.g. library, hostel)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-sm font-semibold text-white focus:outline-none focus:border-[#4F46E5] transition-all bg-[#030303]"
                />
              </div>

              {/* Kiosk List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loading ? (
                  <div className="flex flex-col items-center py-12 space-y-3">
                    <div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-white/60 font-medium">Fetching online terminals...</p>
                  </div>
                ) : filteredKiosks.length > 0 ? (
                  filteredKiosks.map((kiosk) => {
                    const isOnline = kiosk.status === 'online';
                    return (
                      <button
                        key={kiosk.id}
                        onClick={() => {
                          setIsModalOpen(false);
                          router.push(`/print/${kiosk.id}/upload`);
                        }}
                        className="w-full p-4 text-left border border-white/5 hover:border-[#4F46E5]/40 hover:bg-[#4F46E5]/10 rounded-2xl transition-all flex items-center justify-between group shadow-sm bg-[#030303]/50"
                      >
                        <div className="space-y-1 max-w-[80%]">
                          <p className="font-semibold text-sm text-white flex items-center gap-1.5">
                            {kiosk.location_name}
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'
                              }`}
                            />
                          </p>
                          {kiosk.location_addr && (
                            <p className="text-xs text-white/60 truncate font-medium flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-white/40" />
                              {kiosk.location_addr}
                            </p>
                          )}
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-[#4F46E5] group-hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-12 space-y-2">
                    <p className="text-sm text-white/60 font-semibold">No kiosks found</p>
                    <p className="text-xs text-white/40 font-medium">Try typing another location query</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
