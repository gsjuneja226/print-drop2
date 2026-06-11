'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Printer, Download, Edit2, Calendar, FileText, ChevronLeft, ChevronRight, Filter, AlertTriangle, ArrowDownToLine, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import QRCode from 'qrcode';

export default function KioskDetailsDashboard({ params }: { params: { kioskId: string } }) {
  const router = useRouter();
  const kioskId = params.kioskId;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [jobsData, setJobsData] = useState<any>({ jobs: [], count: 0, totalPages: 1 });
  const [jobsLoading, setJobsLoading] = useState(false);

  // Re-fetch functions
  const fetchKioskStats = async () => {
    try {
      const res = await fetch(`/api/admin/kiosks/${kioskId}/stats`);
      if (res.ok) {
        const statsData = await res.json();
        setData(statsData);
      }
    } catch (e) {
      console.error('Failed to load kiosk metrics:', e);
    }
  };

  const fetchKioskJobs = async () => {
    setJobsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '20',
        status: statusFilter,
        colorMode: colorFilter,
        dateFrom,
        dateTo
      });
      const res = await fetch(`/api/admin/kiosks/${kioskId}/jobs?${queryParams}`);
      if (res.ok) {
        const jobsList = await res.json();
        setJobsData(jobsList);
      }
    } catch (e) {
      console.error('Failed to load kiosk jobs list:', e);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      await fetchKioskStats();
      await fetchKioskJobs();
      setLoading(false);
    }
    loadData();
  }, [kioskId]);

  // Refetch jobs on page/filter change
  useEffect(() => {
    if (!loading) {
      fetchKioskJobs();
    }
  }, [page, statusFilter, colorFilter, dateFrom, dateTo]);

  const handleExportCsv = () => {
    const queryParams = new URLSearchParams({ dateFrom, dateTo });
    window.open(`/api/admin/export/${kioskId}?${queryParams}`, '_blank');
  };

  const downloadQr = async () => {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const printUrl = `${appUrl}/print/${kioskId}`;
      const qrDataUrl = await QRCode.toDataURL(printUrl, {
        margin: 2,
        width: 800,
        color: { dark: '#0C0C0F', light: '#F0F0F5' }
      });

      const anchor = document.createElement('a');
      anchor.href = qrDataUrl;
      anchor.download = `kiosk_${kioskId}_qrcode.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (e) {
      alert('Failed to generate printable QR Code');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-customSecondary">
        <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold">Loading Kiosk Metrics...</p>
      </div>
    );
  }

  const { kiosk, stats, colorBreakdown, dailyChartData, heatmap } = data;

  // Connection indicator calculations
  let connectionStatus = 'offline';
  if (kiosk.is_active && kiosk.last_ping) {
    const lastPing = new Date(kiosk.last_ping).getTime();
    const diff = (Date.now() - lastPing) / 1000 / 60;
    if (diff < 2) connectionStatus = 'online';
    else if (diff < 10) connectionStatus = 'idle';
  } else if (!kiosk.is_active) {
    connectionStatus = 'inactive';
  }

  // Find max value in heatmap to calculate relative scale opacities
  const maxHeatmapCount = Math.max(...heatmap.flat(), 1);

  const daysLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const colorsPie = ['#3B6EFF', '#00E5CC'];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header breadcrumb & title */}
      <div className="space-y-4">
        <button
          onClick={() => router.push('/admin/kiosks')}
          className="flex items-center gap-1.5 text-xs font-semibold text-customSecondary hover:text-primaryTxt transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Kiosks list
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-brandBlue/10 flex items-center justify-center text-brandBlue">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold text-primaryTxt">{kiosk.id}</h1>
                <div className="inline-flex items-center gap-1.5 bg-ink border border-customBorder px-2.5 py-1 rounded-full">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'online'
                        ? 'bg-brandCyan shadow-[0_0_8px_rgba(0,229,204,0.4)]'
                        : connectionStatus === 'idle'
                        ? 'bg-brandOrange'
                        : 'bg-brandRed'
                    }`}
                  />
                  <span className="text-[9px] uppercase font-bold text-customSecondary">{connectionStatus}</span>
                </div>
              </div>
              <p className="text-xs text-customSecondary mt-0.5">
                {kiosk.location_name} {kiosk.location_addr ? `· ${kiosk.location_addr}` : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={downloadQr}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-surface hover:bg-elevated border border-customBorder text-xs font-bold text-primaryTxt rounded transition-all"
            >
              <Download className="w-4 h-4 text-brandBlue" />
              Download QR
            </button>
            <button
              onClick={handleExportCsv}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-surface hover:bg-elevated border border-customBorder text-xs font-bold text-primaryTxt rounded transition-all"
            >
              <ArrowDownToLine className="w-4 h-4 text-brandCyan" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* STATS ROW (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card">
          <span className="text-[10px] text-customSecondary uppercase font-bold tracking-wider">Revenue Today</span>
          <h3 className="text-2xl font-bold font-display text-primaryTxt mt-1">
            {formatCurrency(stats.revenueToday)}
          </h3>
        </div>
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card">
          <span className="text-[10px] text-customSecondary uppercase font-bold tracking-wider">Revenue This Month</span>
          <h3 className="text-2xl font-bold font-display text-primaryTxt mt-1">
            {formatCurrency(stats.revenueThisMonth)}
          </h3>
        </div>
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card">
          <span className="text-[10px] text-customSecondary uppercase font-bold tracking-wider">Prints Today</span>
          <h3 className="text-2xl font-bold font-display text-primaryTxt mt-1">
            {stats.printsToday}
          </h3>
        </div>
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card">
          <span className="text-[10px] text-customSecondary uppercase font-bold tracking-wider">All-Time Prints</span>
          <h3 className="text-2xl font-bold font-display text-primaryTxt mt-1">
            {stats.allTimePrints}
          </h3>
        </div>
      </div>

      {/* CHARTS LAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Jobs per day bar chart */}
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card space-y-4">
          <div>
            <h3 className="font-display font-semibold text-sm text-primaryTxt">Prints per Day</h3>
            <p className="text-[10px] text-customSecondary mt-0.5">Last 14 days completions count</p>
          </div>
          <div className="h-[200px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 0, right: 0, left: -26, bottom: 0 }}>
                <CartesianGrid stroke="#2c2c36" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#9090A8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#9090A8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  contentStyle={{ backgroundColor: '#1E1E24', border: '1px solid #2C2C36', borderRadius: '8px', fontSize: '11px', color: '#F0F0F5' }}
                />
                <Bar dataKey="jobs" fill="#3B6EFF" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue per day line chart */}
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card space-y-4">
          <div>
            <h3 className="font-display font-semibold text-sm text-primaryTxt">Daily Revenue Trends</h3>
            <p className="text-[10px] text-customSecondary mt-0.5">Earnings graph (INR)</p>
          </div>
          <div className="h-[200px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#2c2c36" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#9090A8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#9090A8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1E24', border: '1px solid #2C2C36', borderRadius: '8px', fontSize: '11px', color: '#F0F0F5' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#00E5CC" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Print Type Donut Chart */}
        <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card space-y-4">
          <div>
            <h3 className="font-display font-semibold text-sm text-primaryTxt">Print Mode distribution</h3>
            <p className="text-[10px] text-customSecondary mt-0.5">Black & White vs Color jobs</p>
          </div>
          <div className="h-[200px] w-full flex items-center justify-center pt-2">
            {colorBreakdown[0].value === 0 && colorBreakdown[1].value === 0 ? (
              <div className="text-xs text-customMuted">No distribution data recorded yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E1E24', border: '1px solid #2C2C36', borderRadius: '8px', fontSize: '11px', color: '#F0F0F5' }}
                  />
                  <Pie
                    data={colorBreakdown}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {colorBreakdown.map((entry: any, index: number) => (
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
              <span>B&W ({colorBreakdown[0].value})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#00E5CC] rounded-full" />
              <span>Color ({colorBreakdown[1].value})</span>
            </div>
          </div>
        </div>
      </div>

      {/* HEATMAP GRID */}
      <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card space-y-4">
        <div>
          <h3 className="font-display font-semibold text-base text-primaryTxt">Peak Hours Heatmap</h3>
          <p className="text-xs text-customSecondary mt-0.5">Distribution of print jobs by Day and Hour</p>
        </div>

        {/* Heatmap Grid in Pure HTML/CSS */}
        <div className="space-y-2 pt-2 overflow-x-auto">
          {/* Hour labels header */}
          <div className="flex min-w-[760px] pb-1.5">
            <div className="w-12 flex-shrink-0" />
            <div className="flex-1 grid grid-cols-24 gap-[2px]">
              {Array.from({ length: 24 }).map((_, hour) => (
                <span key={hour} className="text-[8px] text-customSecondary text-center font-semibold">
                  {hour === 0 ? '12a' : hour === 12 ? '12p' : hour > 12 ? `${hour - 12}p` : `${hour}a`}
                </span>
              ))}
            </div>
          </div>

          {/* Days rows */}
          <div className="space-y-[3px] min-w-[760px]">
            {heatmap.map((row: number[], dayIdx: number) => (
              <div key={dayIdx} className="flex items-center">
                {/* Day label */}
                <div className="w-12 text-[10px] text-customSecondary font-bold text-left">
                  {daysLabel[dayIdx]}
                </div>
                {/* Cells row */}
                <div className="flex-1 grid grid-cols-24 gap-[2px]">
                  {row.map((count: number, hourIdx: number) => {
                    const intensity = count > 0 ? 0.15 + (count / maxHeatmapCount) * 0.85 : 0;
                    return (
                      <div
                        key={hourIdx}
                        className="aspect-square w-full rounded-[2px] border border-customBorder/25 transition-all hover:scale-115 hover:ring-1 hover:ring-white/40 cursor-help relative group"
                        style={{
                          backgroundColor: count > 0 ? `rgba(59, 110, 255, ${intensity})` : 'rgba(20, 20, 24, 0.5)',
                        }}
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-[#1E1E24] border border-customBorder text-[9px] font-bold text-primaryTxt py-1 px-2 rounded whitespace-nowrap z-20 shadow">
                          {daysLabel[dayIdx]} at {hourIdx}:00 — {count} prints
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT JOBS TABLE */}
      <div className="bg-surface border border-customBorder rounded-lg p-6 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-display font-semibold text-base text-primaryTxt">Kiosk Logs Feed</h3>
            <p className="text-[11px] text-customSecondary mt-0.5">Chronological record of transactions</p>
          </div>

          {/* Filtering Tools Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Select */}
            <div className="flex items-center gap-1.5 bg-ink border border-customBorder px-2 py-1 rounded">
              <Filter className="w-3.5 h-3.5 text-customSecondary" />
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-transparent border-0 text-xs font-semibold text-primaryTxt focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-surface">All Statuses</option>
                <option value="completed" className="bg-surface">Completed</option>
                <option value="paid" className="bg-surface">Paid</option>
                <option value="printing" className="bg-surface">Printing</option>
                <option value="expired" className="bg-surface">Expired</option>
                <option value="failed" className="bg-surface">Failed</option>
              </select>
            </div>

            {/* Color Mode Select */}
            <div className="flex items-center gap-1.5 bg-ink border border-customBorder px-2 py-1 rounded">
              <select
                value={colorFilter}
                onChange={e => { setColorFilter(e.target.value); setPage(1); }}
                className="bg-transparent border-0 text-xs font-semibold text-primaryTxt focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-surface">All Colors</option>
                <option value="bw" className="bg-surface">B & W</option>
                <option value="color" className="bg-surface">Color</option>
              </select>
            </div>

            {/* Date pickers */}
            <div className="flex items-center gap-2 bg-ink border border-customBorder px-2 py-1 rounded text-xs">
              <Calendar className="w-3.5 h-3.5 text-customSecondary" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="bg-transparent border-0 focus:outline-none text-[10px] font-semibold text-primaryTxt cursor-pointer"
              />
              <span className="text-customSecondary">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="bg-transparent border-0 focus:outline-none text-[10px] font-semibold text-primaryTxt cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="overflow-x-auto border border-customBorder rounded bg-ink/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-customBorder text-[10px] font-bold text-customSecondary uppercase tracking-wider bg-ink/30">
                <th className="p-3.5 pl-5">Job ID</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Filename</th>
                <th className="p-3.5 text-center">Pages</th>
                <th className="p-3.5 text-center">Mode</th>
                <th className="p-3.5 text-center">Sides</th>
                <th className="p-3.5 text-center">Copies</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 pr-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-customBorder/30">
              {jobsLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-customSecondary">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brandBlue" />
                    Fetching logs...
                  </td>
                </tr>
              ) : jobsData.jobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-customMuted">
                    No transactions matching filter criteria.
                  </td>
                </tr>
              ) : (
                jobsData.jobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-ink/10 transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-[10px] font-bold text-primaryTxt">{job.id.slice(0, 8)}...</td>
                    <td className="p-3.5 text-customSecondary">{formatDate(job.created_at)}</td>
                    <td className="p-3.5 font-medium text-primaryTxt max-w-[150px] truncate">{job.file_name}</td>
                    <td className="p-3.5 text-center text-primaryTxt">{job.page_count}</td>
                    <td className="p-3.5 text-center uppercase text-customSecondary">{job.color_mode}</td>
                    <td className="p-3.5 text-center capitalize text-customSecondary">{job.sides}</td>
                    <td className="p-3.5 text-center text-primaryTxt">× {job.copies}</td>
                    <td className="p-3.5 text-right font-bold text-brandCyan">₹{job.amount}</td>
                    <td className="p-3.5 pr-5 text-right">
                      <span
                        className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          job.status === 'completed'
                            ? 'bg-brandCyan/10 text-brandCyan'
                            : job.status === 'failed'
                            ? 'bg-brandRed/10 text-brandRed'
                            : job.status === 'paid' || job.status === 'printing'
                            ? 'bg-brandBlue/10 text-brandBlue'
                            : 'bg-customBorder/40 text-customSecondary'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {jobsData.totalPages > 1 && (
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-customSecondary">
              Page {page} of {jobsData.totalPages} ({jobsData.count} jobs)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 bg-ink border border-customBorder rounded hover:bg-elevated disabled:opacity-40 disabled:cursor-not-allowed text-primaryTxt transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(jobsData.totalPages, p + 1))}
                disabled={page >= jobsData.totalPages}
                className="p-1 bg-ink border border-customBorder rounded hover:bg-elevated disabled:opacity-40 disabled:cursor-not-allowed text-primaryTxt transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
