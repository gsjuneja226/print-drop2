'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Landmark, PiggyBank, RefreshCw, BarChart2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminRevenue() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchRevenueData = async () => {
    try {
      const res = await fetch('/api/admin/revenue');
      if (res.ok) {
        const revData = await res.json();
        setData(revData);
      }
    } catch (e) {
      console.error('Failed to load revenue metrics:', e);
    }
  };

  useEffect(() => {
    async function load() {
      await fetchRevenueData();
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-customSecondary">
        <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold">Compiling revenue analytics...</p>
      </div>
    );
  }

  const { monthlyRevenue, kioskBreakdown, printTypeBreakdown, topKiosks } = data;

  const colorsPie = ['#3B6EFF', '#00E5CC'];

  // Calculate cumulative lifetime sales of active configurations
  const lifetimeRevenue = kioskBreakdown.reduce((acc: number, curr: any) => acc + curr.revenue, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primaryTxt">Revenue Analytics</h1>
          <p className="text-xs text-customSecondary mt-1">Audit earnings performance and kiosk monetization metrics</p>
        </div>
        <button
          onClick={fetchRevenueData}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-elevated border border-customBorder text-xs text-primaryTxt rounded font-semibold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* MONTHLY HISTORICAL METRICS (last 6 months stream) */}
      <div className="space-y-3.5">
        <h3 className="font-display font-semibold text-sm text-primaryTxt">Monthly Revenue Stream</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {monthlyRevenue.map((item: any, idx: number) => (
            <div key={idx} className="bg-surface border border-customBorder rounded p-4 text-center space-y-1 shadow-card relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-brandBlue/30" />
              <span className="text-[10px] text-customSecondary font-bold uppercase tracking-wider block">{item.month}</span>
              <p className="text-lg font-bold font-display text-primaryTxt mt-1">{formatCurrency(item.revenue)}</p>
              <span className="text-[9px] text-customSecondary block">{item.jobsCount} print jobs</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KIOSK COMPARATIVE SALES (Horizontal Bars Chart) */}
        <div className="lg:col-span-2 bg-surface border border-customBorder rounded-lg p-6 shadow-card space-y-4">
          <div>
            <h3 className="font-display font-semibold text-sm text-primaryTxt">Monetization by Kiosk Terminal</h3>
            <p className="text-[10px] text-customSecondary mt-0.5">Comparative performance breakdown (INR)</p>
          </div>
          <div className="h-[280px] w-full pt-2">
            {kioskBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-customMuted">
                No kiosk earnings logs recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={kioskBreakdown}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid stroke="#2c2c36" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#9090A8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#9090A8" fontSize={9} tickLine={false} axisLine={false} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E1E24', border: '1px solid #2C2C36', borderRadius: '8px', fontSize: '11px', color: '#F0F0F5' }}
                    formatter={(val: any) => [`₹${val}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#3B6EFF" radius={[0, 4, 4, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* PRINT CONFIG MODE DONUT */}
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card space-y-4">
          <div>
            <h3 className="font-display font-semibold text-sm text-primaryTxt">Sales Share by Print Mode</h3>
            <p className="text-[10px] text-customSecondary mt-0.5">Earnings slice: B&W vs Color</p>
          </div>
          <div className="h-[220px] w-full flex items-center justify-center pt-2">
            {printTypeBreakdown[0].value === 0 && printTypeBreakdown[1].value === 0 ? (
              <div className="text-xs text-customMuted">No sales share logs recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E1E24', border: '1px solid #2C2C36', borderRadius: '8px', fontSize: '11px', color: '#F0F0F5' }}
                    formatter={(val: any) => [`₹${val}`, 'Sales']}
                  />
                  <Pie
                    data={printTypeBreakdown}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {printTypeBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={colorsPie[index % colorsPie.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-6 text-[10px] font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#3B6EFF] rounded-full" />
              <span>B&W ({formatCurrency(printTypeBreakdown[0].value)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#00E5CC] rounded-full" />
              <span>Color ({formatCurrency(printTypeBreakdown[1].value)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP KIOSKS LEADERBOARD */}
      <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card space-y-5">
        <div>
          <h3 className="font-display font-semibold text-base text-primaryTxt">Top Kiosks Leaderboard</h3>
          <p className="text-xs text-customSecondary mt-0.5">Highest earning terminal nodes ranked by revenue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {topKiosks.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-customMuted">
              No kiosk monetization logs recorded yet.
            </div>
          ) : (
            topKiosks.map((k: any, index: number) => {
              const rankColor = index === 0 ? 'text-brandCyan border-brandCyan' : index === 1 ? 'text-brandOrange border-brandOrange' : 'text-customSecondary border-customBorder';
              
              // Calculate percent contribution of this kiosk
              const percentContribution = lifetimeRevenue > 0 ? ((k.revenue / lifetimeRevenue) * 100).toFixed(1) : '0';

              return (
                <div key={k.kioskId} className="bg-ink border border-customBorder rounded-lg p-5 flex flex-col justify-between space-y-4 relative overflow-hidden shadow-card">
                  <div className="absolute top-2.5 right-3 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono bg-surface/30 z-10">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-primaryTxt font-mono truncate mr-8">{k.kioskId}</h4>
                    <p className="text-[10px] text-customSecondary mt-0.5 truncate">{k.name}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-customSecondary tracking-wider">Total Sales</span>
                    <h3 className="text-xl font-bold font-display text-primaryTxt mt-0.5">{formatCurrency(k.revenue)}</h3>
                    <p className="text-[9px] text-brandCyan mt-1 font-bold">
                      {percentContribution}% contribution
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
