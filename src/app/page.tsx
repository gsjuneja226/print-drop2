'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Sliders, CheckCircle, Shield, Trash2, Clock, Activity, CreditCard, ChevronRight, Zap, Database, ArrowRight, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function MarketingLandingPage() {
  const router = useRouter();
  const [kiosks, setKiosks] = React.useState<any[]>([]);
  const [selectedKiosk, setSelectedKiosk] = React.useState<string>('');

  React.useEffect(() => {
    async function loadKiosks() {
      try {
        const res = await fetch('/api/public/kiosks');
        if (res.ok) {
          const data = await res.json();
          setKiosks(data);
          if (data.length > 0) {
            setSelectedKiosk(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load public kiosks:', err);
      }
    }
    loadKiosks();
  }, []);

  const handleStartPrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKiosk) {
      router.push(`/print/${selectedKiosk}`);
    }
  };

  const handleStartKioskNetwork = () => {
    router.push('/admin');
  };

  const steps = [
    {
      icon: Smartphone,
      title: '1. Scan or Select',
      desc: 'Scan the kiosk QR code, or select your kiosk location right here from the home page.',
    },
    {
      icon: Sliders,
      title: '2. Configure',
      desc: 'Upload document, choose options, and pay with UPI in seconds.',
    },
    {
      icon: CheckCircle,
      title: '3. Collect',
      desc: 'Collect your print output immediately from the kiosk printer. No manual code needed.',
    },
  ];

  const features = [
    {
      icon: Clock,
      title: '24/7 Availability',
      desc: 'Completely autonomous self-service printing. No staff. No opening hours.',
    },
    {
      icon: Shield,
      title: 'Encrypted & Auto-Deleted',
      desc: 'Files are transferred via encrypted tunnels and permanently deleted immediately after printing.',
    },
    {
      icon: CreditCard,
      title: 'UPI & Cards Payments',
      desc: 'Seamless Razorpay integration supporting UPI, cards, wallets, and Netbanking.',
    },
    {
      icon: Activity,
      title: 'Real-time Admin Dashboard',
      desc: 'Monitor kiosk heartbeats, revenue analytics, printer logs, and paper stats remotely.',
    },
    {
      icon: Sliders,
      title: 'B&W & Color Printing',
      desc: 'Let users customize pages range, duplex/simplex mode, copies, orientation, and sizes.',
    },
    {
      icon: Database,
      title: 'Scale to 100+ Kiosks',
      desc: 'Stateless serverless backend that supports provisioning unlimited kiosk installations instantly.',
    },
  ];

  return (
    <div className="min-h-screen bg-ink text-primaryTxt relative overflow-hidden select-none font-body">
      {/* Visual Radial Glow in Hero Center */}
      <div className="absolute top-[40vh] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brandBlue/5 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

      {/* HEADER NAVBAR */}
      <header className="border-b border-customBorder bg-surface/40 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brandBlue flex items-center justify-center font-display font-black text-white text-base shadow-glow">
              PD
            </div>
            <span className="font-display font-bold text-lg tracking-wide text-primaryTxt">PrintDrop</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-customSecondary uppercase tracking-wider">
            <a href="#features" className="hover:text-primaryTxt transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primaryTxt transition-colors">How it works</a>
          </nav>

          <button
            onClick={handleStartKioskNetwork}
            className="px-4 py-2 bg-brandBlue hover:bg-brandBlue/90 text-xs font-bold text-white rounded transition-all shadow-glow flex items-center gap-1.5"
          >
            Super Admin
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-73px)] relative z-10">
        <div className="space-y-8 text-left">
          <div className="inline-flex items-center gap-2 bg-brandBlue/10 border border-brandBlue/20 px-3 py-1.5 rounded-full text-xs font-bold text-brandBlue">
            <Zap className="w-3.5 h-3.5" />
            Empowering modern campuses & offices
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-primaryTxt leading-[1.1] tracking-tight">
            Your document.
            <br />
            Printed.
            <span className="text-brandCyan block mt-2">In 60 seconds.</span>
          </h1>

          <p className="text-sm sm:text-base text-customSecondary max-w-lg leading-relaxed font-medium">
            Self-service printing kiosks for colleges, hostels, hospitals, and offices. No staff. No queues. Just scan, pay, and print.
          </p>



          <div className="pt-6 border-t border-customBorder/50 flex items-center gap-4 text-xs font-medium text-customSecondary">
            <span className="w-2.5 h-2.5 bg-brandCyan rounded-full animate-ping" />
            Active printing terminals online in Punjab
          </div>
        </div>

        {/* Hero visual: CSS/SVG kiosk mockup illustration */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-[300px] sm:w-[360px] aspect-[3/4] bg-surface border-4 border-customBorder rounded-xl relative shadow-glow p-5 flex flex-col justify-between overflow-hidden">
            {/* Screen part */}
            <div className="bg-ink border-2 border-customBorder rounded-lg p-4 flex-1 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-brandBlue/[0.02] pointer-events-none" />
              <div className="flex justify-between items-center text-[8px] font-bold text-customSecondary">
                <span>PrintDrop Terminal</span>
                <span className="w-1.5 h-1.5 bg-brandCyan rounded-full" />
              </div>
              
              {/* Fake QR block */}
              <div className="self-center flex flex-col items-center space-y-2">
                <div className="w-24 h-24 bg-primaryTxt rounded p-1.5 flex flex-col justify-between">
                  <div className="flex justify-between w-full"><div className="w-4 h-4 bg-black" /><div className="w-4 h-4 bg-black" /></div>
                  <div className="w-8 h-8 bg-black/5 mx-auto border border-black/10 rounded flex items-center justify-center font-display font-black text-[6px] text-black">PD</div>
                  <div className="flex justify-between w-full"><div className="w-4 h-4 bg-black" /><div className="w-2 h-2 bg-black self-end" /></div>
                </div>
                <span className="text-[7px] font-bold text-primaryTxt uppercase tracking-widest">Scan to Start</span>
              </div>

              {/* Fake Input digits boxes */}
              <div className="flex justify-center gap-2">
                <div className="w-5 h-6 border border-customBorder bg-surface rounded flex items-center justify-center text-[10px] font-bold">2</div>
                <div className="w-5 h-6 border border-customBorder bg-surface rounded flex items-center justify-center text-[10px] font-bold">0</div>
                <div className="w-5 h-6 border border-customBorder bg-surface rounded flex items-center justify-center text-[10px] font-bold">2</div>
                <div className="w-5 h-6 border border-brandBlue bg-brandBlue/5 rounded flex items-center justify-center text-[10px] font-bold text-brandBlue animate-pulse">_</div>
              </div>
            </div>

            {/* Printer output shape below screen */}
            <div className="mt-5 pt-4 border-t border-customBorder/60 flex justify-between items-center">
              <div className="w-14 h-5 bg-ink border border-customBorder rounded flex items-center justify-center text-[6px] font-bold text-customSecondary">Paper slot</div>
              <div className="w-8 h-2 bg-brandBlue/20 rounded-full animate-pulse" />
              <div className="w-10 h-4 bg-ink border border-customBorder rounded flex items-center justify-center text-[7px] font-black text-brandCyan shadow">Spooler</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20 lg:py-32 border-t border-customBorder/40 relative z-10">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-brandBlue uppercase tracking-widest">Self-Service printing</span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-primaryTxt">Three steps. No friction.</h2>
          <p className="text-xs sm:text-sm text-customSecondary leading-relaxed font-medium">
            Retrieve your print configurations and file outputs under 60 seconds without staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="bg-surface border border-customBorder rounded-xl p-8 space-y-4 shadow-card hover:border-brandBlue/30 transition-all">
                <div className="w-12 h-12 rounded-lg bg-brandCyan/10 flex items-center justify-center text-brandCyan">
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
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 lg:py-32 border-t border-customBorder/40 relative z-10">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-brandBlue uppercase tracking-widest">Enterprise scale</span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-primaryTxt">Built for high availability</h2>
          <p className="text-xs sm:text-sm text-customSecondary leading-relaxed font-medium">
            Engineered to handle hundreds of terminals and thousands of documents smoothly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="bg-surface border border-customBorder rounded-xl p-6 space-y-3.5 shadow-card hover:border-brandBlue/20 transition-all">
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
      <footer className="border-t border-customBorder bg-surface/30 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-customSecondary">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-brandBlue flex items-center justify-center font-display font-bold text-white text-sm">
              PD
            </div>
            <span className="font-display font-bold text-sm tracking-wide text-primaryTxt">PrintDrop</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 font-semibold">
            <a href="#features" className="hover:text-primaryTxt transition-colors">Privacy Policy</a>
            <a href="#how-it-works" className="hover:text-primaryTxt transition-colors">Terms of Service</a>
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
