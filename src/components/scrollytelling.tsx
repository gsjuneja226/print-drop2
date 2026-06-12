'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { QrCode, Upload, CreditCard, Printer, Cpu } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Cpu,
    title: 'Modular Hardware Assembly',
    desc: 'Watch the kiosk plug-and-play modules fall into place. Connect a secure laptop interface, integration terminal, and high-volume printer in under 5 minutes.',
  },
  {
    number: '02',
    icon: QrCode,
    title: 'Scan QR to Bridge',
    desc: 'Scan the active QR code generated on the kiosk screen. Instantly opens the secure browser page on your mobile device with zero app installations required.',
  },
  {
    number: '03',
    icon: Upload,
    title: 'Drag, Drop & Configure',
    desc: 'Upload PDF files, images, or Word documents up to 25MB securely. Custom page-parsing engines extract parameters and let you configure layout options instantly.',
  },
  {
    number: '04',
    icon: Printer,
    title: 'Pay UPI & Auto Spool',
    desc: 'Complete payment securely via UPI or Card. Once authorized by Razorpay, the local print queue spools immediately, prints, and automatically purges the files.',
  },
];

export default function Scrollytelling() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // useScroll targetting the scroll track container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll progress to image frame indexes (1 to 200)
  const frameIndex = useTransform(scrollYProgress, [0, 1], [1, 200]);
  
  // Transform scroll progress to vertical track indicator percentage
  const scrollIndicatorHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // Preload frames in memory
  useEffect(() => {
    let loaded = 0;
    const total = 200;
    const tempImages: HTMLImageElement[] = [];

    for (let i = 1; i <= total; i++) {
      const img = new Image();
      img.src = `/resources/ezgif-31835ef6e46e5766-jpg/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
      
      const handleLoad = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === total) {
          setIsLoading(false);
        }
      };

      img.onload = handleLoad;
      img.onerror = handleLoad; // Continue even if single frame fails
      tempImages.push(img);
    }
    imagesRef.current = tempImages;
  }, []);

  // Responsive drawing logic
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[index - 1];
    if (!img || !img.complete) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scaling to contain the image nicely
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    // Fits the image in a letterbox/contain format
    if (canvasRatio > imgRatio) {
      drawWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
    } else {
      drawHeight = canvasWidth / imgRatio;
      offsetY = (canvasHeight - drawHeight) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  // Canvas scaling & resizing logic
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const dpr = window.devicePixelRatio || 1;
      const width = parent.clientWidth;
      const height = parent.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Draw the current frame immediately
      const currentFrame = Math.round(frameIndex.get());
      drawFrame(currentFrame);
    };

    if (!isLoading) {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoading]);

  // Update frames and active narration index on scroll
  useMotionValueEvent(frameIndex, 'change', (latest) => {
    const frame = Math.round(latest);
    drawFrame(frame);
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    let index = 0;
    if (latest < 0.25) {
      index = 0;
    } else if (latest < 0.50) {
      index = 1;
    } else if (latest < 0.75) {
      index = 2;
    } else {
      index = 3;
    }
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  });

  const percentLoaded = Math.round((loadedCount / 200) * 100);

  return (
    <div className="relative">
      
      {/* 1. Preloader Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 bg-[#0F0F1A] z-50 flex flex-col justify-center items-center px-6"
          >
            {/* Pulsing glow background blob */}
            <div className="absolute w-[300px] h-[300px] bg-[#4F46E5]/15 rounded-full blur-[80px] animate-pulse" />

            <div className="relative z-10 text-center space-y-6 max-w-sm w-full">
              <div className="inline-flex p-3.5 bg-white/5 border border-white/10 rounded-2xl text-indigo-400 mb-2">
                <Cpu className="w-8 h-8 animate-spin" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-2xl text-white">Assembling Kiosk Assets</h3>
                <p className="text-xs text-white/50 font-medium">Preloading scrollytelling hardware frames</p>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-2">
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] h-full rounded-full"
                    style={{ width: `${percentLoaded}%` }}
                    transition={{ type: 'spring', stiffness: 80 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  <span>Loading frames</span>
                  <span>{percentLoaded}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Scrollytelling Scroll Track Container */}
      <div ref={containerRef} className="relative h-[400vh] bg-white">
        
        {/* Sticky viewport frame */}
        <div className="sticky top-0 h-screen w-full flex flex-col lg:flex-row items-center justify-between overflow-hidden">
          
          {/* Left Column: Vertical Step Narratives */}
          <div className="w-full lg:w-1/2 h-[50vh] lg:h-full flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-6 lg:py-0 relative z-20">
            <div className="max-w-md w-full mx-auto">
              
              <div className="flex gap-6 sm:gap-8 relative">
                
                {/* Vertical Progress Bar Track */}
                <div className="w-1 bg-[#E5E7F0] rounded-full relative overflow-hidden self-stretch my-2">
                  <motion.div
                    className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[#4F46E5] to-[#7C3AED] rounded-full"
                    style={{ height: scrollIndicatorHeight }}
                  />
                </div>
                
                {/* Steps List */}
                <div className="flex-1 space-y-8 lg:space-y-12 py-2">
                  {steps.map((step, idx) => {
                    const isActive = idx === activeIndex;
                    const Icon = step.icon;

                    return (
                      <div
                        key={idx}
                        className={`space-y-2.5 transition-all duration-500 transform ${
                          isActive
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-30 -translate-x-1 filter blur-[0.5px]'
                        }`}
                      >
                        {/* Number badge and Icon */}
                        <div className="flex items-center gap-3">
                          <span className={`font-display font-extrabold text-sm ${
                            isActive ? 'text-[#4F46E5]' : 'text-[#0F0F1A]/50'
                          }`}>
                            {step.number}
                          </span>
                          <div className={`p-1.5 rounded-lg border transition-colors ${
                            isActive 
                              ? 'bg-[#4F46E5]/10 border-[#4F46E5]/20 text-[#4F46E5]' 
                              : 'bg-transparent border-[#E5E7F0] text-[#0F0F1A]/40'
                          }`}>
                            <Icon className="w-4 h-4 stroke-[2.2]" />
                          </div>
                        </div>

                        {/* Title and Collapsible Details */}
                        <h4 className="font-display font-extrabold text-lg sm:text-xl text-[#0F0F1A]">
                          {step.title}
                        </h4>
                        
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-xs sm:text-sm text-[#0F0F1A]/65 leading-relaxed font-medium"
                          >
                            {step.desc}
                          </motion.p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: HTML5 Canvas Kiosk Assembler */}
          <div className="w-full lg:w-1/2 h-[50vh] lg:h-full bg-[#F8F9FF] border-t lg:border-t-0 lg:border-l border-[#E5E7F0] flex items-center justify-center p-6 sm:p-12 relative z-10">
            {/* Radiant glow behind the Canvas */}
            <div className="absolute w-[280px] sm:w-[360px] h-[280px] sm:h-[360px] bg-gradient-to-tr from-[#4F46E5]/10 to-[#7C3AED]/10 rounded-full blur-[70px] pointer-events-none" />

            <div className="w-full h-full max-h-[85%] flex items-center justify-center relative">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_15px_40px_rgba(79,70,229,0.06)] bg-white border border-[#E5E7F0] overflow-hidden"
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
