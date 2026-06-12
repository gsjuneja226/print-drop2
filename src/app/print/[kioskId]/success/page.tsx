'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RefreshCw, Printer, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import PrintFlowHeader from '@/components/PrintFlowHeader';

export default function PrintSuccess({ params }: { params: { kioskId: string } }) {
  const router = useRouter();
  const kioskId = params.kioskId;

  // Configuration details recap
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [colorMode, setColorMode] = useState('');
  const [copies, setCopies] = useState(1);
  const [amount, setAmount] = useState(0);

  // Status tracking states
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('paid');
  const [simulatedProgress, setSimulatedProgress] = useState(10);

  useEffect(() => {
    const storedJobId = sessionStorage.getItem('printdrop_jobId');
    const storedFileName = sessionStorage.getItem('printdrop_fileName');
    const storedPageCount = sessionStorage.getItem('printdrop_pageCount');
    const storedColorMode = sessionStorage.getItem('printdrop_colorMode');
    const storedCopies = sessionStorage.getItem('printdrop_copies');
    const storedAmount = sessionStorage.getItem('printdrop_amount');

    setFileName(storedFileName || 'Document');
    setPageCount(Number(storedPageCount) || 1);
    setColorMode(storedColorMode || 'bw');
    setCopies(Number(storedCopies) || 1);
    setAmount(Number(storedAmount) || 0);
    setJobId(storedJobId);

    if (!storedJobId) {
      // If we don't have a jobId, fallback to showing 'paid' status
      setStatus('paid');
      return;
    }

    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const checkJobStatus = async () => {
      try {
        const res = await fetch(`/api/job/${storedJobId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch job details');
        }
        const data = await res.json();
        if (isMounted && data && data.status) {
          setStatus(data.status);
          
          // Stop polling once the job reaches a terminal state
          if (['completed', 'failed', 'expired'].includes(data.status)) {
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.error('Error checking job status:', err);
      }
    };

    // Run check immediately
    checkJobStatus();

    // Poll every 2 seconds
    intervalId = setInterval(checkJobStatus, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [kioskId, router]);

  // Simulated printing progress bar when status is 'printing'
  useEffect(() => {
    if (status !== 'printing') {
      if (status === 'completed') {
        setSimulatedProgress(100);
      }
      return;
    }

    const progressTimer = setInterval(() => {
      setSimulatedProgress((prev) => (prev >= 95 ? prev : prev + 5));
    }, 600);

    return () => clearInterval(progressTimer);
  }, [status]);

  const handleReset = () => {
    // Clear storage details
    sessionStorage.removeItem('printdrop_jobId');
    sessionStorage.removeItem('printdrop_fileName');
    sessionStorage.removeItem('printdrop_pageCount');
    sessionStorage.removeItem('printdrop_colorMode');
    sessionStorage.removeItem('printdrop_sides');
    sessionStorage.removeItem('printdrop_copies');
    sessionStorage.removeItem('printdrop_paperSize');
    sessionStorage.removeItem('printdrop_orientation');
    sessionStorage.removeItem('printdrop_pageRange');
    sessionStorage.removeItem('printdrop_amount');
    sessionStorage.removeItem('printdrop_otp');
    sessionStorage.removeItem('printdrop_otp_expiry');

    router.push(`/print/${kioskId}/upload`);
  };

  // Determine card content based on status
  const getStatusCard = () => {
    switch (status) {
      case 'paid':
        return {
          bgClass: 'border-brandCyan/20 bg-brandCyan/5',
          icon: <Printer className="w-10 h-10 text-brandCyan animate-pulse mb-1" />,
          title: 'Spooling to Printer...',
          desc: 'Connecting to kiosk printer. Your files are being prepared for automatic printing. Please wait.',
          extra: null,
        };
      case 'printing':
        return {
          bgClass: 'border-brandBlue/20 bg-brandBlue/5',
          icon: (
            <div className="relative w-12 h-12 mb-1 flex items-center justify-center">
              <Printer className="w-10 h-10 text-brandBlue animate-bounce" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-brandCyan rounded-full animate-ping" />
            </div>
          ),
          title: 'Printing in Progress...',
          desc: 'Your document is currently printing at the kiosk. Please collect it from the output tray.',
          extra: (
            <div className="w-full space-y-1.5 mt-2">
              <div className="w-full bg-customBorder/30 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brandBlue h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${simulatedProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-customSecondary font-medium">
                <span>Spooling & printing</span>
                <span>{simulatedProgress}%</span>
              </div>
            </div>
          ),
        };
      case 'completed':
        return {
          bgClass: 'border-emerald-500/20 bg-emerald-500/5',
          icon: <CheckCircle2 className="w-10 h-10 text-emerald-500 stroke-[2.5] mb-1 animate-[bounce_0.6s_ease-out_1]" />,
          title: 'Printing Completed!',
          desc: 'Your document has printed successfully. Please collect it from the output tray.',
          extra: (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold mt-2 border border-emerald-500/10">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Files deleted from server (Secure)</span>
            </div>
          ),
        };
      case 'failed':
        return {
          bgClass: 'border-brandRed/20 bg-brandRed/5',
          icon: <AlertTriangle className="w-10 h-10 text-brandRed mb-1 animate-pulse" />,
          title: 'Printing Failed',
          desc: 'The printer encountered an issue. Please contact the kiosk administrator or try printing again.',
          extra: null,
        };
      case 'expired':
        return {
          bgClass: 'border-brandOrange/20 bg-brandOrange/5',
          icon: <AlertTriangle className="w-10 h-10 text-brandOrange mb-1" />,
          title: 'Job Expired',
          desc: 'This print job has expired or is no longer available in the print queue.',
          extra: null,
        };
      default:
        return {
          bgClass: 'border-brandCyan/20 bg-brandCyan/5',
          icon: <Printer className="w-10 h-10 text-brandCyan animate-pulse mb-1" />,
          title: 'Spooling to Printer...',
          desc: 'Connecting to kiosk printer. Your files are being prepared for automatic printing. Please wait.',
          extra: null,
        };
    }
  };

  const statusCard = getStatusCard();

  return (
    <div className="min-h-dvh bg-ink flex flex-col max-w-md mx-auto animate-fade-in pb-[calc(3rem+env(safe-area-inset-bottom))]">
      <PrintFlowHeader currentStep="success" />

      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="space-y-6 text-center">
          {/* Animated Green Checkmark */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-brandCyan/15 border border-brandCyan/30 rounded-full flex items-center justify-center text-brandCyan scale-100 transition-transform duration-500 animate-[bounce_0.6s_ease-out_1]">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-display font-semibold text-primaryTxt">Payment Successful</h2>
            <p className="text-xs text-customSecondary mt-1 font-medium">Your document is printing at the kiosk</p>
          </div>

          {/* Printing Alert/Card */}
          <div className={`border rounded-lg p-6 shadow-card space-y-3 relative overflow-hidden flex flex-col items-center transition-all duration-300 ${statusCard.bgClass}`}>
            {statusCard.icon}
            <h3 className="font-display font-bold text-sm text-primaryTxt">{statusCard.title}</h3>
            <p className="text-xs text-customSecondary max-w-[260px] leading-relaxed">
              {statusCard.desc}
            </p>
            {statusCard.extra}
          </div>

          {/* File summary recap */}
          <div className="border border-customBorder/40 bg-surface/20 rounded-md p-4 space-y-3 text-left text-xs">
            <div className="flex items-center gap-2 text-customSecondary font-medium border-b border-customBorder/30 pb-2">
              <FileText className="w-4 h-4 text-brandBlue flex-shrink-0" />
              <span className="truncate text-primaryTxt font-semibold flex-1">{fileName}</span>
            </div>
            <div className="flex justify-between text-customSecondary">
              <span>Color Preferences</span>
              <span className="font-semibold text-primaryTxt capitalize">{colorMode === 'color' ? '🎨 Color' : '⬛ Black & White'}</span>
            </div>
            <div className="flex justify-between text-customSecondary">
              <span>Total printed pages</span>
              <span className="font-semibold text-primaryTxt">{pageCount} pgs × {copies} {copies === 1 ? 'copy' : 'copies'}</span>
            </div>
            <div className="flex justify-between text-customSecondary">
              <span>Amount Paid</span>
              <span className="font-bold text-brandCyan">₹{amount}</span>
            </div>
          </div>

          {/* Deletion reminder */}
          <p className="text-[10px] text-customSecondary">
            🔒 Your file will be permanently deleted from our servers the moment it is printed.
          </p>
        </div>

        {/* Start over button */}
        <div className="mt-8 space-y-4">
          <button
            onClick={handleReset}
            className="w-full bg-surface hover:bg-elevated border border-customBorder text-primaryTxt rounded-md py-4 font-bold flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-brandBlue" />
            Print Another Document
          </button>
        </div>
      </div>
    </div>
  );
}
