'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, FileText, CheckCircle2, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import PrintFlowHeader from '@/components/PrintFlowHeader';
import { formatCurrency } from '@/lib/utils';

export default function PrintPayment({ params }: { params: { kioskId: string } }) {
  const router = useRouter();
  const kioskId = params.kioskId;

  // Configuration options state
  const [jobId, setJobId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [colorMode, setColorMode] = useState<string>('bw');
  const [sides, setSides] = useState<string>('single');
  const [copies, setCopies] = useState<number>(1);
  const [paperSize, setPaperSize] = useState<string>('A4');
  const [orientation, setOrientation] = useState<string>('portrait');
  const [pageRange, setPageRange] = useState<string>('all');
  const [amount, setAmount] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);

  useEffect(() => {
    const storedJobId = sessionStorage.getItem('printdrop_jobId');
    const storedFileName = sessionStorage.getItem('printdrop_fileName');
    const storedPageCount = sessionStorage.getItem('printdrop_pageCount');
    const storedColorMode = sessionStorage.getItem('printdrop_colorMode');
    const storedSides = sessionStorage.getItem('printdrop_sides');
    const storedCopies = sessionStorage.getItem('printdrop_copies');
    const storedPaperSize = sessionStorage.getItem('printdrop_paperSize');
    const storedOrientation = sessionStorage.getItem('printdrop_orientation');
    const storedPageRange = sessionStorage.getItem('printdrop_pageRange');
    const storedAmount = sessionStorage.getItem('printdrop_amount');

    if (!storedJobId || !storedAmount) {
      router.push(`/print/${kioskId}/upload`);
      return;
    }

    setJobId(storedJobId);
    setFileName(storedFileName || 'Document');
    setPageCount(Number(storedPageCount) || 1);
    setColorMode(storedColorMode || 'bw');
    setSides(storedSides || 'single');
    setCopies(Number(storedCopies) || 1);
    setPaperSize(storedPaperSize || 'A4');
    setOrientation(storedOrientation || 'portrait');
    setPageRange(storedPageRange || 'all');
    setAmount(Number(storedAmount));

    // Pre-create the Razorpay order
    createPaymentOrder(storedJobId, {
      colorMode: storedColorMode,
      sides: storedSides,
      copies: storedCopies,
      paperSize: storedPaperSize,
      orientation: storedOrientation,
      pageRange: storedPageRange,
    });
  }, [kioskId, router]);

  const createPaymentOrder = async (id: string, opts: any) => {
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: id,
          colorMode: opts.colorMode,
          sides: opts.sides,
          copies: opts.copies,
          paperSize: opts.paperSize,
          orientation: opts.orientation,
          pageRange: opts.pageRange,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create order');
      }

      const orderData = await res.json();
      setRazorpayOrder(orderData);
    } catch (err: any) {
      setOrderError(err.message || 'Failed to initialize payment systems');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (!razorpayOrder) return;
    setProcessingPayment(true);

    const isMock = razorpayOrder.orderId.startsWith('order_mock_');

    if (isMock) {
      // Direct mock pathway for testing environment without API keys
      setTimeout(() => {
        simulatePaymentSuccess();
      }, 800);
      return;
    }

    // Load Razorpay Checkout JS dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      const options = {
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'PrintDrop Kiosk',
        description: `Document Print: ${fileName}`,
        order_id: razorpayOrder.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                jobId: jobId,
              }),
            });

            if (!verifyRes.ok) {
              const errVal = await verifyRes.json();
              throw new Error(errVal.error || 'Payment verification failed');
            }

            const verifiedData = await verifyRes.json();
            // Cache OTP
            sessionStorage.setItem('printdrop_otp', verifiedData.otp);
            sessionStorage.setItem('printdrop_otp_expiry', String(Date.now() + 10 * 60 * 1000));
            
            router.push(`/print/${kioskId}/success`);
          } catch (e: any) {
            alert(e.message || 'Payment verification failed');
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          },
        },
        theme: {
          color: '#3B6EFF',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };
    script.onerror = () => {
      alert('Failed to load Razorpay checkout script. Check connection.');
      setProcessingPayment(false);
    };
    document.body.appendChild(script);
  };

  const simulatePaymentSuccess = async () => {
    // For local evaluation purposes when Razorpay environment keys are not configured
    try {
      const mockPayId = 'pay_mock_' + crypto.randomUUID().split('-')[0];
      const mockOrderId = razorpayOrder?.orderId || 'order_mock_123';

      const verifyRes = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: mockPayId,
          razorpay_order_id: mockOrderId,
          razorpay_signature: 'mock_sig',
          jobId: jobId,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error('Verification failed');
      }

      const verifiedData = await verifyRes.json();
      sessionStorage.setItem('printdrop_otp', verifiedData.otp);
      sessionStorage.setItem('printdrop_otp_expiry', String(Date.now() + 10 * 60 * 1000));
      
      router.push(`/print/${kioskId}/success`);
    } catch (e) {
      alert('Mock payment simulation error');
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex flex-col justify-center items-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-brandBlue border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-customSecondary text-sm">Preparing payment details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col max-w-md mx-auto animate-fade-in pb-12">
      <PrintFlowHeader currentStep="payment" />

      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-display font-semibold text-primaryTxt flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5 text-brandBlue" />
              Checkout Summary
            </h2>
            <p className="text-xs text-customSecondary mt-1">Review parameters and initiate payment</p>
          </div>

          {orderError && (
            <div className="bg-brandRed/10 border border-brandRed/30 rounded-md p-4 flex gap-3 text-brandRed">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-medium">{orderError}</p>
            </div>
          )}

          {/* Configuration Summary Card */}
          <div className="border border-customBorder bg-surface rounded-lg p-5 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-brandBlue/10 flex items-center justify-center text-brandBlue">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs text-customSecondary uppercase font-bold tracking-wider">Document name</h4>
                <h3 className="text-sm font-semibold text-primaryTxt truncate mt-0.5">{fileName}</h3>
              </div>
            </div>

            <div className="pt-3 border-t border-customBorder/50">
              <span className="text-[10px] uppercase font-bold text-customSecondary tracking-wider block mb-2">Selected Options</span>
              <div className="flex flex-wrap gap-2">
                <span className="bg-ink border border-customBorder/60 px-2.5 py-1 text-[10px] font-semibold rounded text-primaryTxt capitalize">
                  {colorMode === 'color' ? '🎨 Color' : '⬛ Black & White'}
                </span>
                <span className="bg-ink border border-customBorder/60 px-2.5 py-1 text-[10px] font-semibold rounded text-primaryTxt capitalize">
                  {sides === 'double' ? '📋 Double-sided' : '📄 Single-sided'}
                </span>
                <span className="bg-ink border border-customBorder/60 px-2.5 py-1 text-[10px] font-semibold rounded text-primaryTxt capitalize">
                  {copies} {copies === 1 ? 'Copy' : 'Copies'}
                </span>
                <span className="bg-ink border border-customBorder/60 px-2.5 py-1 text-[10px] font-semibold rounded text-primaryTxt uppercase">
                  {paperSize} Size
                </span>
                <span className="bg-ink border border-customBorder/60 px-2.5 py-1 text-[10px] font-semibold rounded text-primaryTxt capitalize">
                  {orientation}
                </span>
                <span className="bg-ink border border-customBorder/60 px-2.5 py-1 text-[10px] font-semibold rounded text-primaryTxt">
                  Range: {pageRange}
                </span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-customBorder/55 space-y-2 text-xs">
              <div className="flex justify-between text-customSecondary">
                <span>Selected Pages count</span>
                <span className="font-semibold text-primaryTxt">{pageCount}</span>
              </div>
              {sides === 'double' && (
                <div className="flex justify-between text-customSecondary">
                  <span>Physical Sheets layout</span>
                  <span className="font-semibold text-primaryTxt">{Math.ceil(pageCount / 2)} sheets</span>
                </div>
              )}
              <div className="flex justify-between text-customSecondary">
                <span>Copies factor</span>
                <span className="font-semibold text-primaryTxt">× {copies}</span>
              </div>
              <div className="flex justify-between text-customSecondary">
                <span>Pricing rate</span>
                <span className="font-semibold text-primaryTxt">₹{colorMode === 'color' ? '8' : '2'} / page</span>
              </div>

              <div className="pt-3 border-t border-customBorder/40 flex justify-between items-center text-sm">
                <span className="font-semibold text-primaryTxt">Total Amount Due</span>
                <span className="text-xl font-bold font-display text-brandCyan">₹{amount}</span>
              </div>
            </div>
          </div>

          {/* Secure details strip */}
          <div className="bg-surface border border-customBorder/30 rounded p-3.5 flex gap-2.5 items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-brandCyan" />
            <span className="text-[10px] text-customSecondary font-medium">
              🔒 256-bit SSL secure payment · Files auto-purged on kiosk retrieval.
            </span>
          </div>
        </div>

        {/* Action Button Section */}
        <div className="space-y-3.5 mt-8">
          <button
            onClick={handlePayment}
            disabled={processingPayment || !!orderError || !razorpayOrder}
            className={`w-full rounded-md py-4 font-bold flex items-center justify-center gap-2 transition-all ${
              processingPayment || !!orderError || !razorpayOrder
                ? 'bg-customBorder text-customMuted cursor-not-allowed'
                : 'bg-brandBlue hover:bg-brandBlue/90 text-white shadow-glow'
            }`}
          >
            {processingPayment ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>Pay ₹{amount} →</>
            )}
          </button>

          {/* Fallback Simulator button for Testing purposes */}
          {razorpayOrder && !processingPayment && (
            <button
              onClick={simulatePaymentSuccess}
              className="w-full py-2.5 border border-dashed border-brandCyan/40 bg-brandCyan/5 hover:bg-brandCyan/10 text-brandCyan text-[11px] font-bold rounded transition-colors"
            >
              🛠️ Simulate Success (Testing bypass)
            </button>
          )}

          {/* Payments strip logos */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-customMuted font-bold uppercase tracking-widest pt-2">
            <span>UPI</span>
            <span>·</span>
            <span>Visa</span>
            <span>·</span>
            <span>Mastercard</span>
            <span>·</span>
            <span>RuPay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
