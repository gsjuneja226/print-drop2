'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertTriangle, Printer, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Incorrect password entered');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Incorrect password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col justify-center items-center p-6 relative">
      {/* Background soft glow */}
      <div className="absolute w-[400px] h-[400px] bg-brandBlue/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-surface border border-customBorder rounded-xl p-8 shadow-card space-y-6 z-10">
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-brandBlue/10 flex items-center justify-center text-brandBlue mx-auto mb-2">
            <Printer className="w-6 h-6" />
          </div>
          <h1 className="font-display font-bold text-2xl text-primaryTxt">PrintDrop Portal</h1>
          <p className="text-xs text-customSecondary font-medium">Administrator Control Panel login</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-brandRed/10 border border-brandRed/35 rounded-md p-4 flex gap-3 text-brandRed">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        )}

        {/* Form controls */}
        <div className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-customSecondary uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-ink border border-customBorder rounded-md py-3 pl-10 pr-4 text-sm text-primaryTxt focus:outline-none focus:ring-1 focus:ring-brandBlue placeholder-customMuted"
              />
              <Lock className="w-4 h-4 text-customSecondary absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-brandBlue hover:bg-brandBlue/90 disabled:bg-customBorder text-white rounded-md py-3.5 font-bold flex items-center justify-center gap-1.5 transition-all shadow-glow"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      <footer className="text-center text-[10px] text-customMuted mt-12 font-medium">
        © 2024 PrintDrop platform. Protected administration environment.
      </footer>
    </div>
  );
}
