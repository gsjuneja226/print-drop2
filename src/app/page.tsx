'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Smartphone, 
  Sliders, 
  CheckCircle, 
  Shield, 
  Trash2, 
  Clock, 
  Activity, 
  CreditCard, 
  ChevronRight, 
  Zap, 
  Database, 
  ArrowRight, 
  Printer, 
  Search, 
  MapPin, 
  Sparkles, 
  Globe 
} from 'lucide-react';

export default function MarketingLandingPage() {
  const router = useRouter();
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [selectedKiosk, setSelectedKiosk] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadKiosks() {
      try {
        const res = await fetch('/api/public/kiosks');
        if (res.ok) {
          const data = await res.json();
          setKiosks(data);
          if (data.length > 0) {
            setSelectedKiosk(data[0]);
            setSearchQuery(data[0].location_name);
          }
        }
      } catch (err) {
        console.error('Failed to load public kiosks:', err);
      }
    }
    loadKiosks();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartPrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKiosk) {
      router.push(`/print/${selectedKiosk.id}`);
    }
  };

  const handleStartKioskNetwork = () => {
    router.push('/admin');
  };

  const filteredKiosks = kiosks.filter(k => 
    k.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (k.location_addr && k.location_addr.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const steps = [
    {
      icon: Smartphone,
      title: 'Select Kiosk',
      desc: 'Pick your nearby campus or office kiosk from our interactive selector.',
    },
    {
      icon: Sliders,
      title: 'Configure Document',
      desc: 'Upload files (PDF, Word, Images), select colors and copies in seconds.',
    },
    {
      icon: CheckCircle,
      title: 'Collect Instantly',
      desc: 'Pay securely via UPI and collect your printout immediately at the machine.',
    },
  ];

  const features = [
    {
      icon: Clock,
      title: '24/7 Autopilot Printing',
      desc: 'Completely autonomous printing loops without manual queues or operators.',
    },
    {
      icon: Shield,
      title: 'Military-Grade Security',
      desc: 'Encrypted tunnels transfer files directly. Automatic wipe-outs immediately after print.',
    },
    {
      icon: CreditCard,
      title: 'Instant UPI Checkout',
      desc: 'Pay in one tap with GPay, PhonePe, Paytm, or Card using standard Razorpay gateway.',
    },
    {
      icon: Activity,
      title: 'Admin Command Center',
      desc: 'Track network health, telemetry logs, revenue reports, and tray status in real-time.',
    },
    {
      icon: Sliders,
      title: 'Optimized Customization',
      desc: 'Easily define page numbers range, color layouts, and copy configurations on mobile.',
    },
    {
      icon: Database,
      title: 'Unlimited Kiosk Scale',
      desc: 'Stateless backend architecture built to orchestrate hundreds of remote nodes smoothly.',
    },
  ];

  return (
    <div className="min-h-screen bg-ink text-primaryTxt relative overflow-hidden select-none font-body">
      {/* Background Radial Glow */}
      <div className="absolute top-[20vh] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brandBlue/5 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

      {/* HEADER NAVBAR */}
      <header className="border-b border-customBorder bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brandBlue flex items-center justify-center font-display font-black text-white text-lg shadow-glow">
              PD
            </div>
            <span className="font-display font-bold text-xl tracking-wide text-primaryTxt">PrintDrop</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-customSecondary uppercase tracking-wider">
            <a href="#how-it-works" className="hover:text-primaryTxt transition-colors">How It Works</a>
            <a href="#features" className="hover:text-primaryTxt transition-colors">Platform Features</a>
          </nav>

          <button
            onClick={handleStartKioskNetwork}
            className="px-4 py-2 bg-brandBlue hover:bg-brandBlue/90 text-xs font-bold text-white rounded-lg transition-all shadow-glow flex items-center gap-1.5"
          >
            Super Admin
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="space-y-8 lg:col-span-7 text-left">
          <div className="inline-flex items-center gap-2 bg-brandBlue/10 border border-brandBlue/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-brandBlue">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            Empowering campuses, hospitals & offices
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-primaryTxt leading-[1.15] tracking-tight">
            Your document.
            <br />
            Printed.
            <span className="text-brandCyan block mt-2">In 60 seconds.</span>
          </h1>

          <p className="text-sm sm:text-base text-customSecondary max-w-xl leading-relaxed font-medium">
            Self-service printing kiosks for student hostels, libraries, and corporate workspaces. Just select a kiosk, upload, pay via UPI, and grab your papers.
          </p>

          {/* DYNAMIC KIOSK SELECT WIDGET */}
          <div className="max-w-md bg-surface border border-customBorder rounded-xl p-5 shadow-card space-y-4">
            <h3 className="text-xs font-bold text-customSecondary uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brandBlue" />
              Find & Start Printing
            </h3>
            
            <form onSubmit={handleStartPrint} className="space-y-3.5">
              <div ref={dropdownRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-customSecondary" />
                  <input
                    type="text"
                    placeholder="Search kiosk location..."
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    className="w-full bg-ink border border-customBorder rounded-lg py-3 pl-10 pr-4 text-sm font-semibold text-primaryTxt focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all"
                  />
                </div>

                {/* Dropdown Options */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-56 bg-surface border border-customBorder rounded-lg shadow-lg overflow-y-auto z-30 divide-y divide-customBorder/50">
                    {filteredKiosks.length > 0 ? (
                      filteredKiosks.map((k) => (
                        <div
                          key={k.id}
                          onClick={() => {
                            setSelectedKiosk(k);
                            setSearchQuery(k.location_name);
                            setIsDropdownOpen(false);
                          }}
                          className={`p-3.5 text-left cursor-pointer hover:bg-elevated transition-colors ${
                            selectedKiosk?.id === k.id ? 'bg-brandBlue/5 font-bold' : ''
                          }`}
                        >
                          <p className="text-sm text-primaryTxt flex items-center gap-1.5">
                            {k.location_name}
                            <span className="w-1.5 h-1.5 bg-brandCyan rounded-full shadow-[0_0_8px_rgba(0,229,204,0.6)]" />
                          </p>
                          {k.location_addr && (
                            <p className="text-xs text-customSecondary truncate mt-0.5">{k.location_addr}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-customMuted font-medium">
                        No online kiosks found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!selectedKiosk}
                className={`w-full py-3.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all ${
                  selectedKiosk
                    ? 'bg-brandBlue hover:bg-brandBlue/90 shadow-glow active:scale-[0.99]'
                    : 'bg-customBorder text-customMuted cursor-not-allowed'
                }`}
              >
                <span>Start Printing Here</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-2 flex items-center gap-3 text-xs font-semibold text-customSecondary">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brandCyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brandCyan"></span>
            </span>
            <span>{kiosks.length} Terminals Online</span>
          </div>
        </div>

        {/* HERO RIGHT COLUMN: METRIC DISPLAY (REPLACING SCAN DIAGRAM) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-sm bg-surface border border-customBorder rounded-2xl p-6 shadow-glow space-y-6">
            <div className="flex items-center justify-between border-b border-customBorder/60 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brandBlue/10 flex items-center justify-center text-brandBlue">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="font-display font-bold text-sm text-primaryTxt">Terminal Activity</span>
              </div>
              <span className="text-[10px] font-bold text-brandCyan bg-brandCyan/10 px-2 py-0.5 rounded-full border border-brandCyan/20 uppercase tracking-wider">
                Live Stats
              </span>
            </div>

            {/* Simulated Live Printer Telemetry */}
            <div className="space-y-4">
              <div className="bg-ink border border-customBorder/50 rounded-lg p-3.5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-customSecondary uppercase font-bold block">Total Pages Printed</span>
                  <span className="text-xl font-bold font-display text-primaryTxt mt-1 block">42,892+</span>
                </div>
                <Globe className="w-6 h-6 text-customSecondary/40" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-ink border border-customBorder/50 rounded-lg p-3.5">
                  <span className="text-[10px] text-customSecondary uppercase font-bold block">Avg Speed</span>
                  <span className="text-base font-bold font-display text-primaryTxt mt-1 block">3.2 sec/page</span>
                </div>
                <div className="bg-ink border border-customBorder/50 rounded-lg p-3.5">
                  <span className="text-[10px] text-customSecondary uppercase font-bold block">Uptime SLA</span>
                  <span className="text-base font-bold font-display text-brandCyan mt-1 block">99.98%</span>
                </div>
              </div>

              {/* Steps recap cards layout (interactive flow preview) */}
              <div className="border border-customBorder/60 bg-ink/50 rounded-lg p-4 space-y-3">
                <span className="text-[10px] text-customSecondary uppercase font-bold tracking-wider block">Simplified Process</span>
                
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-brandBlue text-white text-[10px] flex items-center justify-center font-bold">1</div>
                  <span className="text-xs font-semibold text-primaryTxt">Choose kiosk on campus</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-brandBlue text-white text-[10px] flex items-center justify-center font-bold">2</div>
                  <span className="text-xs font-semibold text-primaryTxt">Select single-sided A4 documents</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-brandBlue text-white text-[10px] flex items-center justify-center font-bold">3</div>
                  <span className="text-xs font-semibold text-primaryTxt">Scan UPI QR to retrieve prints</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-customBorder/50 relative z-10">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-brandBlue uppercase tracking-widest">Self-Service printing</span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-primaryTxt">Three Simple Steps</h2>
          <p className="text-xs sm:text-sm text-customSecondary leading-relaxed font-medium">
            Retrieve your documents securely and quickly without waiting in line or dealing with staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="bg-surface border border-customBorder rounded-xl p-8 space-y-4 shadow-card hover:border-brandBlue/30 hover:scale-[1.01] transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brandCyan/10 flex items-center justify-center text-brandCyan">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-bold text-primaryTxt">{step.title}</h3>
                <p className="text-xs text-customSecondary leading-relaxed font-medium">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-customBorder/50 relative z-10">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-brandBlue uppercase tracking-widest">Enterprise scale</span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-primaryTxt">Robust Campus Framework</h2>
          <p className="text-xs sm:text-sm text-customSecondary leading-relaxed font-medium">
            Engineered to coordinate high volume document printing securely and reliably.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="bg-surface border border-customBorder rounded-xl p-6 space-y-3.5 shadow-card hover:border-brandBlue/20 hover:scale-[1.01] transition-all">
                <div className="w-10 h-10 rounded bg-brandBlue/10 flex items-center justify-center text-brandBlue">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-base text-primaryTxt">{feat.title}</h3>
                <p className="text-xs text-customSecondary leading-relaxed font-medium">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-customBorder bg-surface/50 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-customSecondary">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brandBlue flex items-center justify-center font-display font-bold text-white text-base">
              PD
            </div>
            <span className="font-display font-bold text-sm tracking-wide text-primaryTxt">PrintDrop</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 font-semibold">
            <a href="#" className="hover:text-primaryTxt transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primaryTxt transition-colors">Terms of Service</a>
            <a href="mailto:support@printdrop.com" className="hover:text-primaryTxt transition-colors">Contact Support</a>
          </div>

          <p className="text-center md:text-right font-medium">
            © 2024 PrintDrop platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
