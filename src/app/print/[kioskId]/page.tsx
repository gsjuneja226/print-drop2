'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KioskEntry({ params }: { params: { kioskId: string } }) {
  const router = useRouter();
  const kioskId = params.kioskId;

  useEffect(() => {
    // Directly go to upload page after scanning the link
    router.replace(`/print/${kioskId}/upload`);
  }, [kioskId, router]);

  return (
    <div className="min-h-dvh bg-ink flex flex-col justify-center items-center p-6 text-center">
      <div className="w-12 h-12 border-4 border-brandBlue border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-customSecondary text-sm font-medium animate-pulse">
        Connecting to kiosk, opening upload...
      </p>
    </div>
  );
}

