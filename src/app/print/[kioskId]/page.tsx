'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Trash2, Clock, AlertTriangle, Printer, ArrowRight } from 'lucide-react';

export default function KioskEntry({ params }: { params: { kioskId: string } }) {
  const router = useRouter();
  const kioskId = params.kioskId;
  const [kiosk, setKiosk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKiosk() {
      try {
        const res = await fetch(`/api/kiosk-info/${kioskId}`);
        if (!res.ok) {
          throw new Error('Kiosk not found or inactive');
        }
        const data = await res.json();
        setKiosk(data);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to kiosk');
      } finally {
        setLoading(false);
      }
    }
    fetchKiosk();
  }, [kioskId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex flex-col justify-center items-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-brandBlue border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-customSecondary text-sm font-medium">Connecting to kiosk...</p>
      </div>
    );
  }

  if (error || !kiosk) {
    return (
      <div className="min-h-screen bg-ink flex flex-col justify-center items-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-brandRed/10 rounded-full flex items-center justify-center text-brandRed mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-semibold mb-2 font-display text-primaryTxt">Kiosk Unavailable</h1>
        <p className="text-customSecondary text-sm mb-6">
          {error || 'This kiosk is not configured or has been deactivated.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-surface border border-customBorder rounded-md text-sm font-semibold hover:bg-elevated transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isOffline = kiosk.status === 'offline' || kiosk.status === 'inactive';

  return (
    <div className="min-h-screen bg-ink flex flex-col max-w-md mx-auto relative animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 pb-4 border-b border-customBorder flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brandBlue/10 flex items-center justify-center text-brandBlue">
          <Printer className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg text-primaryTxt">PrintDrop</h1>
          <p className="text-xs text-customSecondary">Instant Self-Service Kiosk</p>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Offline Banner */}
          {isOffline && (
            <div className="bg-brandRed/10 border border-brandRed/30 rounded-md p-4 flex gap-3 text-brandRed animate-fade-in">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Kiosk is Currently Offline</h3>
                <p className="text-xs text-brandRed/80 mt-0.5">
                  You can still upload and configure your documents, but you won't be able to retrieve prints until the machine reconnects.
                </p>
              </div>
            </div>
          )}

          {/* Kiosk Identity Card */}
          <div className="bg-surface border border-customBorder rounded-md p-5 shadow-card">
            <span className="text-[10px] uppercase font-bold text-brandBlue tracking-wider">Current Kiosk</span>
            <h2 className="text-xl font-display font-semibold text-primaryTxt mt-1">
              {kiosk.location_name}
            </h2>
            {kiosk.location_addr && (
              <p className="text-xs text-customSecondary mt-1">{kiosk.location_addr}</p>
            )}
            <div className="mt-4 pt-4 border-t border-customBorder/50 flex justify-between items-center text-xs">
              <span className="text-customSecondary">Connection</span>
              <div className="flex items-center gap-1.5 font-medium">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    kiosk.status === 'online'
                      ? 'bg-brandCyan shadow-[0_0_10px_rgba(0,229,204,0.4)]'
                      : kiosk.status === 'idle'
                      ? 'bg-brandOrange'
                      : 'bg-brandRed'
                  }`}
                />
                <span className="capitalize">{kiosk.status}</span>
              </div>
            </div>
          </div>

          {/* Pricing Info Card */}
          <div className="bg-surface border border-customBorder rounded-md p-5 shadow-card">
            <h3 className="font-display font-semibold text-sm text-primaryTxt mb-3">Print Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-ink border border-customBorder/55 rounded-md p-3.5 text-center">
                <span className="text-[10px] text-customSecondary uppercase font-semibold">Black & White</span>
                <p className="text-2xl font-bold font-display text-primaryTxt mt-1">₹2</p>
                <span className="text-[10px] text-customSecondary mt-0.5 block">per page</span>
              </div>
              <div className="bg-ink border border-customBorder/55 rounded-md p-3.5 text-center">
                <span className="text-[10px] text-customSecondary uppercase font-semibold">Color</span>
                <p className="text-2xl font-bold font-display text-brandCyan mt-1">₹8</p>
                <span className="text-[10px] text-customSecondary mt-0.5 block">per page</span>
              </div>
            </div>
          </div>

          {/* Value Chips */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-customBorder/40 rounded-md p-3 flex flex-col items-center justify-center text-center gap-1.5 shadow-card">
              <Shield className="w-4 h-4 text-brandCyan" />
              <span className="text-[10px] font-semibold text-primaryTxt">Secure Files</span>
            </div>
            <div className="bg-surface border border-customBorder/40 rounded-md p-3 flex flex-col items-center justify-center text-center gap-1.5 shadow-card">
              <Trash2 className="w-4 h-4 text-brandOrange" />
              <span className="text-[10px] font-semibold text-primaryTxt">Auto-Purged</span>
            </div>
            <div className="bg-surface border border-customBorder/40 rounded-md p-3 flex flex-col items-center justify-center text-center gap-1.5 shadow-card">
              <Clock className="w-4 h-4 text-brandBlue" />
              <span className="text-[10px] font-semibold text-primaryTxt">Fast Collect</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push(`/print/${kioskId}/upload`)}
            className="w-full bg-brandBlue hover:bg-brandBlue/90 text-white rounded-md py-4 font-bold flex items-center justify-center gap-2 transition-all shadow-glow"
          >
            Start Printing
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
