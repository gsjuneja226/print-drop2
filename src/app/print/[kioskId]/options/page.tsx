'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sliders, Plus, Minus, FileText, CheckCircle2, ChevronRight, CornerDownRight, AlertTriangle } from 'lucide-react';
import PrintFlowHeader from '@/components/PrintFlowHeader';
import { parsePageRange } from '@/lib/utils';

export default function PrintOptions({ params }: { params: { kioskId: string } }) {
  const router = useRouter();
  const kioskId = params.kioskId;

  // Retrieve job details from sessionStorage
  const [jobId, setJobId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [docPageCount, setDocPageCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Print Settings Options
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const sides = 'single';
  const [copies, setCopies] = useState<number>(1);
  const paperSize = 'A4';
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageRangeType, setPageRangeType] = useState<'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<string>('');
  const [rangeError, setRangeError] = useState<string | null>(null);

  // Stepper typing state
  const [isTypingCopies, setIsTypingCopies] = useState(false);

  useEffect(() => {
    const storedJobId = sessionStorage.getItem('printdrop_jobId');
    const storedFileName = sessionStorage.getItem('printdrop_fileName');
    const storedPageCount = sessionStorage.getItem('printdrop_pageCount');

    if (!storedJobId) {
      router.push(`/print/${kioskId}/upload`);
      return;
    }

    setJobId(storedJobId);
    setFileName(storedFileName || 'Document');
    setDocPageCount(Number(storedPageCount) || 1);
    setLoading(false);
  }, [kioskId, router]);

  // Recalculate price in real time
  const selectedPagesCount = pageRangeType === 'all' 
    ? docPageCount 
    : parsePageRange(customRange, docPageCount);

  const physicalSheetsCount = selectedPagesCount;

  const totalSheetsToPrint = physicalSheetsCount * copies;
  const pricePerPage = colorMode === 'color' ? 8 : 2;
  const totalAmount = totalSheetsToPrint * pricePerPage;

  // Real-time custom page range parser validation
  const handleRangeChange = (val: string) => {
    setCustomRange(val);
    if (!val.trim()) {
      setRangeError('Page range cannot be empty');
      return;
    }

    // Clean whitespace and check format
    const clean = val.replace(/\s+/g, '');
    const regex = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;
    if (!regex.test(clean)) {
      setRangeError('Invalid format. Use numbers, dashes, and commas (e.g., 1-3,5)');
      return;
    }

    // Validate boundaries
    const parts = clean.split(',');
    for (const part of parts) {
      if (part.includes('-')) {
        const [s, e] = part.split('-').map(Number);
        if (s > e) {
          setRangeError(`Start page ${s} cannot be greater than end page ${e}`);
          return;
        }
        if (s < 1 || e > docPageCount) {
          setRangeError(`Pages must be between 1 and ${docPageCount}`);
          return;
        }
      } else {
        const num = Number(part);
        if (num < 1 || num > docPageCount) {
          setRangeError(`Page number ${num} is out of document range (1-${docPageCount})`);
          return;
        }
      }
    }
    setRangeError(null);
  };

  const handleContinue = () => {
    if (pageRangeType === 'custom' && rangeError) return;

    // Save final settings
    sessionStorage.setItem('printdrop_colorMode', colorMode);
    sessionStorage.setItem('printdrop_sides', sides);
    sessionStorage.setItem('printdrop_copies', String(copies));
    sessionStorage.setItem('printdrop_paperSize', paperSize);
    sessionStorage.setItem('printdrop_orientation', orientation);
    sessionStorage.setItem('printdrop_pageRange', pageRangeType === 'all' ? 'all' : customRange);
    sessionStorage.setItem('printdrop_amount', String(totalAmount));

    router.push(`/print/${kioskId}/payment`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ink flex flex-col max-w-md mx-auto animate-fade-in pb-32">
      <PrintFlowHeader currentStep="options" />

      <div className="flex-1 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-display font-semibold text-primaryTxt flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brandBlue" />
            Configure Print Job
          </h2>
          <p className="text-xs text-customSecondary mt-1">Select preferences for {fileName}</p>
        </div>

        {/* 1. COLOR MODE */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-customSecondary uppercase tracking-wider">Color Mode</label>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setColorMode('bw')}
              className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${
                colorMode === 'bw'
                  ? 'border-brandBlue bg-brandBlue/5 ring-1 ring-brandBlue shadow-glow'
                  : 'border-customBorder bg-surface hover:bg-elevated'
              }`}
            >
              <span className="text-2xl block">⬛</span>
              <span className="text-sm font-bold block mt-1.5 text-primaryTxt">B & W</span>
              <span className="text-[10px] text-customSecondary block mt-0.5">₹2 / page</span>
            </div>
            <div
              onClick={() => setColorMode('color')}
              className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${
                colorMode === 'color'
                  ? 'border-brandBlue bg-brandBlue/5 ring-1 ring-brandBlue shadow-glow'
                  : 'border-customBorder bg-surface hover:bg-elevated'
              }`}
            >
              <span className="text-2xl block">🎨</span>
              <span className="text-sm font-bold block mt-1.5 text-primaryTxt">Color</span>
              <span className="text-[10px] text-brandCyan block mt-0.5">₹8 / page</span>
            </div>
          </div>
        </div>



        {/* 3. COPIES STEPPER */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-customSecondary uppercase tracking-wider block">Copies</label>
          <div className="flex items-center justify-between bg-surface border border-customBorder rounded-lg p-3 shadow-card">
            <button
              onClick={() => setCopies(c => Math.max(1, c - 1))}
              disabled={copies <= 1}
              className={`w-11 h-11 rounded-md bg-ink border border-customBorder flex items-center justify-center text-primaryTxt transition-all ${
                copies <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-elevated active:scale-95'
              }`}
            >
              <Minus className="w-5 h-5" />
            </button>

            {isTypingCopies ? (
              <input
                type="number"
                value={copies}
                autoFocus
                onBlur={() => {
                  setIsTypingCopies(false);
                  if (isNaN(copies) || copies < 1) setCopies(1);
                  if (copies > 50) setCopies(50);
                }}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  setCopies(isNaN(val) ? 0 : val);
                }}
                className="w-20 bg-ink border border-brandBlue rounded-md py-2 text-center text-lg font-bold text-primaryTxt focus:outline-none focus:ring-1 focus:ring-brandBlue"
              />
            ) : (
              <span
                onClick={() => setIsTypingCopies(true)}
                className="text-xl font-bold font-display text-primaryTxt min-w-[60px] text-center cursor-pointer py-1 px-4 rounded hover:bg-ink transition-colors"
              >
                {copies}
              </span>
            )}

            <button
              onClick={() => setCopies(c => Math.min(50, c + 1))}
              disabled={copies >= 50}
              className={`w-11 h-11 rounded-md bg-ink border border-customBorder flex items-center justify-center text-primaryTxt transition-all ${
                copies >= 50 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-elevated active:scale-95'
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>



        {/* 5. ORIENTATION */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-customSecondary uppercase tracking-wider">Orientation</label>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setOrientation('portrait')}
              className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${
                orientation === 'portrait'
                  ? 'border-brandBlue bg-brandBlue/5 ring-1 ring-brandBlue shadow-glow'
                  : 'border-customBorder bg-surface hover:bg-elevated'
              }`}
            >
              <div className="w-8 h-10 border border-customSecondary rounded mx-auto bg-ink flex flex-col justify-between p-1">
                <div className="w-full h-1 bg-customSecondary/30 rounded" />
                <div className="w-full h-1 bg-customSecondary/30 rounded" />
                <div className="w-full h-1 bg-customSecondary/30 rounded" />
              </div>
              <span className="text-xs font-bold block mt-2 text-primaryTxt">Portrait</span>
            </div>
            <div
              onClick={() => setOrientation('landscape')}
              className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${
                orientation === 'landscape'
                  ? 'border-brandBlue bg-brandBlue/5 ring-1 ring-brandBlue shadow-glow'
                  : 'border-customBorder bg-surface hover:bg-elevated'
              }`}
            >
              <div className="w-11 h-8 border border-customSecondary rounded mx-auto bg-ink flex flex-col justify-between p-1">
                <div className="w-full h-1 bg-customSecondary/30 rounded" />
                <div className="w-full h-1 bg-customSecondary/30 rounded" />
                <div className="w-full h-1 bg-customSecondary/30 rounded" />
              </div>
              <span className="text-xs font-bold block mt-2 text-primaryTxt">Landscape</span>
            </div>
          </div>
        </div>

        {/* 6. PAGE RANGE */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-customSecondary uppercase tracking-wider block">Page Range</label>
          <div className="border border-customBorder bg-surface rounded-lg p-4 space-y-4 shadow-card">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="radio"
                  checked={pageRangeType === 'all'}
                  onChange={() => {
                    setPageRangeType('all');
                    setRangeError(null);
                  }}
                  className="accent-brandBlue w-4 h-4"
                />
                <div className="text-left">
                  <span className="text-xs font-bold text-primaryTxt block">All Pages</span>
                  <span className="text-[10px] text-customSecondary mt-0.5 block">Total {docPageCount} {docPageCount === 1 ? 'page' : 'pages'}</span>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="radio"
                  checked={pageRangeType === 'custom'}
                  onChange={() => setPageRangeType('custom')}
                  className="accent-brandBlue w-4 h-4"
                />
                <div className="text-left">
                  <span className="text-xs font-bold text-primaryTxt block">Custom Range</span>
                  <span className="text-[10px] text-customSecondary mt-0.5 block">Specify selected range</span>
                </div>
              </label>
            </div>

            {pageRangeType === 'custom' && (
              <div className="space-y-1.5 animate-fade-in">
                <input
                  type="text"
                  placeholder="e.g. 1-3, 5, 8-10"
                  value={customRange}
                  onChange={e => handleRangeChange(e.target.value)}
                  className={`w-full bg-ink border rounded-md py-2.5 px-3.5 text-xs text-primaryTxt focus:outline-none focus:ring-1 ${
                    rangeError ? 'border-brandRed focus:ring-brandRed' : 'border-customBorder focus:ring-brandBlue'
                  }`}
                />
                {rangeError ? (
                  <p className="text-[10px] text-brandRed font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    {rangeError}
                  </p>
                ) : (
                  <p className="text-[10px] text-customSecondary flex items-center gap-1">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    Selected: {selectedPagesCount} {selectedPagesCount === 1 ? 'page' : 'pages'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface border-t border-customBorder p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.4)] z-40">
        <div className="flex items-center justify-between mb-3.5">
          <div className="min-w-0">
            <span className="text-xs font-bold text-primaryTxt truncate block max-w-[180px]">
              {fileName}
            </span>
            <span className="text-[10px] text-customSecondary font-medium block mt-0.5 uppercase">
              {selectedPagesCount} Pgs · {colorMode === 'color' ? 'Color' : 'B&W'} · {copies} {copies === 1 ? 'Copy' : 'Copies'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-customSecondary block font-semibold uppercase">Total Price</span>
            <span className="text-2xl font-bold font-display text-brandCyan block">
              ₹{totalAmount}
            </span>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={pageRangeType === 'custom' && !!rangeError}
          className={`w-full rounded-md py-4 font-bold flex items-center justify-center gap-1.5 transition-all ${
            pageRangeType === 'custom' && rangeError
              ? 'bg-customBorder text-customMuted cursor-not-allowed'
              : 'bg-brandBlue hover:bg-brandBlue/90 text-white shadow-glow'
          }`}
        >
          Continue to Payment
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
