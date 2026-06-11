'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { CheckCircle, XCircle, RefreshCw, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type KioskState = 'idle' | 'validating' | 'printing' | 'success' | 'error' | 'offline';

export default function KioskScreen({ params }: { params: { kioskId: string } }) {
  const kioskId = params.kioskId;
  const [kiosk, setKiosk] = useState<any>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [kioskState, setKioskState] = useState<KioskState>('idle');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Printing state
  const [printingJob, setPrintingJob] = useState<any>(null);
  const [printProgress, setPrintProgress] = useState(0);

  // Success Reset Timer
  const [resetTimer, setResetTimer] = useState<number>(8);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const kioskStateRef = useRef<KioskState>('idle');

  // Track latest state to prevent stale closure issues in callbacks
  useEffect(() => {
    kioskStateRef.current = kioskState;
  }, [kioskState]);

  useEffect(() => {
    // 1. Fetch initial kiosk details and generate QR code
    async function initKiosk() {
      try {
        const res = await fetch(`/api/kiosk-info/${kioskId}`);
        if (!res.ok) throw new Error('Kiosk configuration not found');
        const data = await res.json();
        setKiosk(data);

        if (data.is_active) {
          // Generate QR code pointing to print flow
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
          const printUrl = `${appUrl}/print/${kioskId}`;
          const qrUrl = await QRCode.toDataURL(printUrl, {
            margin: 1,
            width: 240,
            color: {
              dark: '#0C0C0F',
              light: '#F0F0F5',
            },
          });
          setQrCodeDataUrl(qrUrl);
          setKioskState('idle');
        } else {
          setKioskState('offline');
        }
      } catch (err) {
        console.error('Kiosk initialization error:', err);
        setKioskState('offline');
      } finally {
        setLoading(false);
      }
    }

    initKiosk();

    // 2. Setup kiosk heartbeat ping every 60 seconds
    const triggerPing = async () => {
      try {
        await fetch('/api/kiosk/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kioskId }),
        });
      } catch (e) {
        console.warn('Heartbeat ping failed:', e);
      }
    };
    
    triggerPing(); // Ping immediately on mount
    heartbeatIntervalRef.current = setInterval(triggerPing, 60000);

    // 3. Polling fallback to check for paid jobs
    const pollForPaidJobs = async () => {
      if (kioskStateRef.current !== 'idle') return;
      try {
        const { data: jobs, error } = await supabase
          .from('print_jobs')
          .select('id')
          .eq('kiosk_id', kioskId)
          .eq('status', 'paid')
          .limit(1);

        if (error) throw error;
        if (jobs && jobs.length > 0) {
          processPaidJob(jobs[0].id);
        }
      } catch (err) {
        console.warn('Polling check failed:', err);
      }
    };

    const pollInterval = setInterval(pollForPaidJobs, 4000);

    // 4. Supabase Realtime Broadcast Channel subscription
    const channel = supabase
      .channel(`kiosk:${kioskId}`)
      .on('broadcast', { event: 'new_job' }, (payload) => {
        console.log('Realtime broadcast payload received:', payload);
        if (kioskStateRef.current === 'idle') {
          const { jobId } = payload.payload;
          if (jobId) {
            processPaidJob(jobId);
          }
        }
      })
      .subscribe();

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [kioskId]);

  // Success Reset countdown timer
  useEffect(() => {
    if (kioskState !== 'success') return;
    setResetTimer(8);
    const timer = setInterval(() => {
      setResetTimer(t => {
        if (t <= 1) {
          clearInterval(timer);
          setKioskState('idle');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [kioskState]);

  const processPaidJob = async (jobId: string) => {
    setKioskState('validating');
    setErrorMessage('');

    try {
      const res = await fetch('/api/kiosk/start-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kioskId, jobId }),
      });

      if (!res.ok) {
        const err = await res.json();
        setKioskState('error');
        setErrorMessage(err.error || 'Failed to initialize printing job');
        setTimeout(() => {
          setKioskState('idle');
        }, 4000);
        return;
      }

      const jobData = await res.json();
      setPrintingJob(jobData);
      triggerLocalPrint(jobData);
    } catch (err) {
      setKioskState('error');
      setErrorMessage('Network error during print initialization');
      setTimeout(() => setKioskState('idle'), 4000);
    }
  };

  const triggerLocalPrint = async (job: any) => {
    setKioskState('printing');
    setPrintProgress(10);

    const progressInterval = setInterval(() => {
      setPrintProgress(p => (p >= 90 ? p : p + 8));
    }, 400);

    try {
      // Send command directly to local print agent running on machine
      const localPrintRes = await fetch('http://localhost:3001/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: job.fileUrl,
          jobId: job.jobId,
          fileName: job.fileName, // Pass the original filename to the print server
          options: job.options,
        }),
      });

      clearInterval(progressInterval);
      setPrintProgress(100);

      if (!localPrintRes.ok) {
        const localErr = await localPrintRes.json();
        throw new Error(localErr.error || 'Local printer spooler error');
      }

      // Mark job completed in database
      const completeRes = await fetch('/api/kiosk/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.jobId }),
      });

      if (!completeRes.ok) {
        console.warn('Completed status update warning in DB');
      }

      setKioskState('success');
    } catch (err: any) {
      clearInterval(progressInterval);
      setKioskState('error');
      setErrorMessage(err.message || 'Printing failed. Check printer connection.');
      
      // Update DB to failed
      await fetch(`/api/job/${job.jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'failed' }),
      }).catch(console.warn);

      setTimeout(() => {
        setKioskState('idle');
      }, 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex justify-center items-center text-center text-customSecondary">
        <div className="w-12 h-12 border-4 border-brandBlue border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="font-display font-semibold">Initializing Print Kiosk Node...</p>
      </div>
    );
  }

  // 1. OFFLINE STATE
  if (kioskState === 'offline') {
    return (
      <div className="min-h-screen bg-[#1F2026] flex flex-col justify-center items-center p-8 text-center">
        <XCircle className="w-20 h-20 text-customSecondary mb-6" />
        <h1 className="text-4xl font-display font-bold text-primaryTxt mb-3">Kiosk Offline</h1>
        <p className="text-lg text-customSecondary max-w-lg leading-relaxed">
          This machine is currently disconnected from PrintDrop servers. Please contact campus admin or platform support.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-primaryTxt flex flex-col relative overflow-hidden select-none">
      {/* Dynamic radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brandBlue/5 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* HEADER NAVBAR */}
      <header className="border-b border-customBorder bg-surface/50 backdrop-blur px-8 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-brandBlue flex items-center justify-center font-display font-black text-white text-base">
            PD
          </div>
          <div>
            <span className="font-display font-bold text-lg text-primaryTxt">PrintDrop Terminal</span>
            <span className="bg-brandBlue/10 text-brandBlue text-[10px] px-2 py-0.5 rounded font-semibold ml-2.5">
              v1.0.4
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-primaryTxt">{kiosk?.location_name || 'Terminal Node'}</p>
            <p className="text-xs text-customSecondary">{kiosk?.location_addr || 'Kiosk Location'}</p>
          </div>
          <div className="flex items-center gap-2 bg-ink border border-customBorder px-3.5 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 bg-brandCyan rounded-full shadow-[0_0_10px_rgba(0,229,204,0.5)]" />
            <span className="text-xs font-semibold text-brandCyan">Online</span>
          </div>
        </div>
      </header>

      {/* INTERACTIVE CONTENT LAYER */}
      <main className="flex-1 flex items-center justify-center p-12 z-10">
        {/* A. IDLE STATE */}
        {kioskState === 'idle' && (
          <div className="w-full max-w-2xl flex flex-col items-center text-center space-y-8 animate-fade-in">
            {/* Center QR Card */}
            <div className="p-6 bg-white rounded-2xl shadow-[0_20px_50px_rgba(59,110,255,0.15)] transition-transform hover:scale-[1.02]">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Scan QR" className="w-[260px] h-[260px]" />
              ) : (
                <div className="w-[260px] h-[260px] bg-[#f0f0f5] flex items-center justify-center text-black font-semibold">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-display font-extrabold text-primaryTxt flex items-center gap-3 justify-center animate-[pulse_2s_infinite]">
                <Smartphone className="w-7 h-7 text-brandCyan" />
                Scan QR to Print Instantly
              </h2>
              <p className="text-base text-customSecondary max-w-md mx-auto leading-relaxed">
                Scan with your phone camera to upload, configure layout, and pay. 
                Your files will print **automatically** once payment succeeds.
              </p>
            </div>

            {/* Ready Status Strip */}
            <div className="flex items-center gap-3 bg-brandBlue/10 border border-brandBlue/20 px-6 py-3 rounded-full text-brandBlue text-sm font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Ready for incoming print requests...</span>
            </div>
          </div>
        )}

        {/* B. VALIDATING STATE */}
        {kioskState === 'validating' && (
          <div className="text-center space-y-6 animate-fade-in">
            <RefreshCw className="w-16 h-16 text-brandBlue animate-spin mx-auto" />
            <div>
              <h2 className="text-3xl font-display font-bold text-primaryTxt">Initializing Print...</h2>
              <p className="text-sm text-customSecondary mt-2">Retrieving document parameters from cloud</p>
            </div>
          </div>
        )}

        {/* C. PRINTING STATE */}
        {kioskState === 'printing' && (
          <div className="text-center space-y-8 animate-fade-in w-full max-w-md bg-surface border border-customBorder p-8 rounded-xl shadow-card">
            {/* Custom animated printer SVG */}
            <div className="relative w-32 h-32 mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full text-brandBlue">
                {/* Printer Body */}
                <path d="M25 45h50v25H25z" fill="none" stroke="currentColor" strokeWidth="4" />
                <path d="M35 45V30h30v15" fill="none" stroke="currentColor" strokeWidth="4" />
                {/* Paper Output Slot */}
                <path d="M30 60h40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                {/* Printing Paper (animated) */}
                <g className="animate-print-head">
                  <path d="M35 60v15h30V60" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path d="M40 67h20M40 71h15" stroke="currentColor" strokeWidth="2" />
                </g>
              </svg>
            </div>

            <div>
              <h2 className="text-3xl font-display font-bold text-primaryTxt">Printing Document</h2>
              <p className="text-sm text-brandCyan font-semibold mt-1.5">Please wait, printing your files...</p>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-ink rounded-full h-2 overflow-hidden border border-customBorder">
                <div
                  className="bg-brandBlue h-full rounded-full transition-all duration-300"
                  style={{ width: `${printProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-customSecondary uppercase font-bold tracking-wide block">
                Spooling queue: {printProgress}%
              </span>
            </div>

            {printingJob && (
              <div className="bg-ink border border-customBorder/60 rounded p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-customSecondary">Document:</span>
                  <span className="font-semibold text-primaryTxt truncate max-w-[200px]">{printingJob.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-customSecondary">Page count:</span>
                  <span className="font-semibold text-primaryTxt">{printingJob.options.pageRange === 'all' ? 'All pages' : printingJob.options.pageRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-customSecondary">Details:</span>
                  <span className="font-semibold text-brandCyan uppercase">{printingJob.options.colorMode === 'color' ? '🎨 Color' : '⬛ B&W'} · {printingJob.options.copies} copies</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* D. SUCCESS STATE */}
        {kioskState === 'success' && (
          <div className="text-center space-y-6 animate-fade-in max-w-sm bg-surface border border-customBorder p-8 rounded-xl shadow-card">
            <CheckCircle className="w-20 h-20 text-brandCyan mx-auto" />
            <div>
              <h2 className="text-3xl font-display font-bold text-primaryTxt">Print Successful</h2>
              <p className="text-sm text-customSecondary mt-2">Please collect your print documents from the printer tray.</p>
            </div>
            <div className="pt-4 border-t border-customBorder/50 text-xs text-customMuted">
              Auto-resetting kiosk display in <span className="text-brandCyan font-bold">{resetTimer}s</span>...
            </div>
          </div>
        )}

        {/* E. ERROR STATE */}
        {kioskState === 'error' && (
          <div className="text-center space-y-6 animate-fade-in max-w-md bg-surface border border-customBorder p-8 rounded-xl shadow-card">
            <XCircle className="w-20 h-20 text-brandRed mx-auto" />
            
            <div>
              <h2 className="text-3xl font-display font-bold text-brandRed">
                Printing Error
              </h2>
              <p className="text-sm text-primaryTxt font-medium mt-2">{errorMessage}</p>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER STRIP */}
      <footer className="border-t border-customBorder bg-surface/20 px-8 py-4 flex items-center justify-between text-xs text-customMuted font-medium z-10">
        <span>© 2024 PrintDrop platform. All rights reserved.</span>
        <span>Secure document transmission channel.</span>
      </footer>
    </div>
  );
}
