'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RefreshCw, Printer, FileText } from 'lucide-react';
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

  useEffect(() => {
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
  }, [kioskId, router]);

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

    router.push(`/print/${kioskId}`);
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col max-w-md mx-auto animate-fade-in pb-12">
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
          <div className="border border-brandCyan/20 bg-brandCyan/5 rounded-lg p-6 shadow-card space-y-3 relative overflow-hidden flex flex-col items-center">
            <Printer className="w-10 h-10 text-brandCyan animate-pulse mb-1" />
            <h3 className="font-display font-bold text-sm text-primaryTxt">Spooling to Printer...</h3>
            <p className="text-xs text-customSecondary max-w-[260px] leading-relaxed">
              No code input is required. Your files are printing automatically. Please collect them from the printer output tray.
            </p>
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
