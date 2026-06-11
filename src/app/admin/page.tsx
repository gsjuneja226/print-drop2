'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, Printer, Activity, Clock, ChevronRight, RefreshCw, Layers } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function AdminOverview() {
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'daily' | 'weekly'>('daily');
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  const fetchOverviewStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setRecentJobs(data.recentJobs || []);
      }
    } catch (e) {
      console.error('Failed to reload admin statistics:', e);
    }
  };

  useEffect(() => {
    async function loadData() {
      await fetchOverviewStats();
      setLoading(false);
    }
    loadData();

    // Setup Supabase Realtime subscription for live jobs feed
    const channel = supabase
      .channel('admin_overview_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'print_jobs' },
        () => {
          fetchOverviewStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-customSecondary">
        <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold">Gathering dashboard statistics...</p>
      </div>
    );
  }

  const { overview, kiosks, dailyChartData } = stats;

  // Prepare weekly chart data by grouping daily data
  const getWeeklyChartData = () => {
    // Aggregates 14 days of data into 2 chunks representing Week 1 and Week 2
    const week1 = dailyChartData.slice(0, 7);
    const week2 = dailyChartData.slice(7, 14);

    const week1Rev = week1.reduce((acc: number, curr: any) => acc + curr.revenue, 0);
    const week1Jobs = week1.reduce((acc: number, curr: any) => acc + curr.jobsCount, 0);

    const week2Rev = week2.reduce((acc: number, curr: any) => acc + curr.revenue, 0);
    const week2Jobs = week2.reduce((acc: number, curr: any) => acc + curr.jobsCount, 0);

    return [
      { date: 'Week 1 (Earlier)', revenue: week1Rev, jobsCount: week1Jobs },
      { date: 'Week 2 (Recent)', revenue: week2Rev, jobsCount: week2Jobs },
    ];
  };

  const chartData = chartView === 'daily' ? dailyChartData : getWeeklyChartData();

  // Create a map for kiosk location names
  const kioskLocations = kiosks.reduce((acc: any, curr: any) => {
    acc[curr.id] = curr.location_name;
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primaryTxt">Dashboard Overview</h1>
          <p className="text-xs text-customSecondary mt-1">Real-time status updates of your kiosk printing network</p>
        </div>
        <button
          onClick={fetchOverviewStats}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-elevated border border-customBorder text-xs text-primaryTxt rounded font-semibold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Data
        </button>
      </div>

      {/* STATS ROW (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Revenue Today */}
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-customSecondary uppercase font-bold tracking-wider">Revenue Today</span>
            <h3 className="text-2xl font-bold font-display text-primaryTxt">
              {formatCurrency(overview.revenueToday)}
            </h3>
            <span className="text-[10px] text-brandCyan font-semibold flex items-center gap-1">
              +{overview.revenueGrowthPercent}% vs yesterday
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-brandBlue/10 text-brandBlue flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Revenue This Month */}
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-customSecondary uppercase font-bold tracking-wider">Revenue This Month</span>
            <h3 className="text-2xl font-bold font-display text-primaryTxt">
              {formatCurrency(overview.revenueThisMonth)}
            </h3>
            <span className="text-[10px] text-brandCyan font-semibold flex items-center gap-1">
              +{overview.revenueMonthGrowthPercent}% vs last month
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-brandCyan/10 text-brandCyan flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Prints Today */}
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-customSecondary uppercase font-bold tracking-wider">Prints Today</span>
            <h3 className="text-2xl font-bold font-display text-primaryTxt">
              {overview.printsToday}
            </h3>
            <span className="text-[10px] text-customSecondary font-medium">completed print jobs</span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-brandOrange/10 text-brandOrange flex items-center justify-center">
            <Printer className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Active Kiosks */}
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-customSecondary uppercase font-bold tracking-wider">Active Kiosks</span>
            <h3 className="text-2xl font-bold font-display text-primaryTxt">
              {overview.activeKiosks}
            </h3>
            <span className="text-[10px] text-customSecondary font-medium">
              {overview.onlineCount} online kiosks
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-brandBlue/10 text-brandBlue flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CHART AREA (Columns Span 2) */}
        <div className="lg:col-span-2 bg-surface border border-customBorder rounded-lg p-6 shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-semibold text-base text-primaryTxt">Earnings History</h3>
              <p className="text-[11px] text-customSecondary mt-0.5">Aggregate revenue logs</p>
            </div>
            <div className="flex bg-ink border border-customBorder p-1 rounded">
              <button
                onClick={() => setChartView('daily')}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                  chartView === 'daily' ? 'bg-brandBlue text-white shadow' : 'text-customSecondary hover:text-primaryTxt'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setChartView('weekly')}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                  chartView === 'weekly' ? 'bg-brandBlue text-white shadow' : 'text-customSecondary hover:text-primaryTxt'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="#2c2c36" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#9090A8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#9090A8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  contentStyle={{
                    backgroundColor: '#1E1E24',
                    border: '1px solid #2C2C36',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F0F0F5',
                  }}
                  formatter={(val: any) => [`₹${val}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#3B6EFF" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT JOBS FEED (Column Span 1) */}
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card flex flex-col h-[384px]">
          <div className="pb-3 border-b border-customBorder/60">
            <h3 className="font-display font-semibold text-base text-primaryTxt">Live Activity</h3>
            <p className="text-[11px] text-customSecondary mt-0.5">Real-time print logs queue</p>
          </div>

          <div className="flex-1 overflow-y-auto pt-3 space-y-3.5 pr-1">
            {recentJobs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-customMuted">
                Awaiting incoming print requests...
              </div>
            ) : (
              recentJobs.map(job => (
                <div key={job.id} className="flex gap-3 text-xs border-b border-customBorder/30 pb-3 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded bg-ink border border-customBorder/50 flex flex-col items-center justify-center text-center flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-customSecondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primaryTxt truncate">{job.file_name}</p>
                    <p className="text-[10px] text-customSecondary mt-0.5 truncate">
                      {kioskLocations[job.kiosk_id] || 'Loading...'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brandCyan">₹{job.amount}</p>
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
                        job.status === 'completed'
                          ? 'bg-brandCyan/10 text-brandCyan'
                          : job.status === 'failed'
                          ? 'bg-brandRed/10 text-brandRed'
                          : job.status === 'paid' || job.status === 'printing'
                          ? 'bg-brandBlue/10 text-brandBlue animate-pulse'
                          : 'bg-customBorder/40 text-customSecondary'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* KIOSK STATUS GRID */}
      <div className="space-y-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-primaryTxt">Kiosk Status Grid</h3>
          <p className="text-xs text-customSecondary mt-0.5">Performance statistics of active terminal nodes</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kiosks.map((k: any) => {
            // Re-calculate live status
            let isOnline = false;
            let isIdle = false;
            if (k.is_active && k.last_ping) {
              const lastPing = new Date(k.last_ping).getTime();
              const diff = (Date.now() - lastPing) / 1000 / 60;
              isOnline = diff < 2;
              isIdle = diff >= 2 && diff < 10;
            }

            return (
              <div
                key={k.id}
                className="bg-surface border border-customBorder rounded-lg p-5 shadow-card flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-primaryTxt">{k.id}</h4>
                      <p className="text-xs text-customSecondary mt-0.5">{k.location_name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOnline
                            ? 'bg-brandCyan shadow-[0_0_8px_rgba(0,229,204,0.4)]'
                            : isIdle
                            ? 'bg-brandOrange'
                            : 'bg-brandRed'
                        }`}
                      />
                      <span className="text-[10px] font-semibold text-customSecondary capitalize">
                        {isOnline ? 'online' : isIdle ? 'idle' : 'offline'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-ink/50 border border-customBorder/50 rounded p-3 text-xs">
                    <div>
                      <span className="text-[10px] text-customSecondary">Today's prints</span>
                      <p className="font-bold text-primaryTxt mt-0.5">
                        {/* We fetch individual kiosk statistics on card later or display overall from fetch, but since 
                            stats returns total and today's print aggregates in `/api/admin/kiosks` let's keep details clear */}
                        -
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-customSecondary">Today's Revenue</span>
                      <p className="font-bold text-brandCyan mt-0.5">
                        -
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/admin/kiosks/${k.id}`)}
                  className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 border border-customBorder bg-ink hover:bg-elevated text-xs font-bold rounded text-primaryTxt transition-all"
                >
                  View deep stats
                  <ChevronRight className="w-4 h-4 text-brandBlue" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
