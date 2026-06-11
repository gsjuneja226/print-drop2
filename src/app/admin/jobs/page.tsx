'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, Calendar, Filter, ChevronLeft, ChevronRight, RefreshCw, ArrowDownToLine } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminJobs() {
  const [loading, setLoading] = useState(true);
  const [jobsData, setJobsData] = useState<any>({ jobs: [], count: 0, totalPages: 1 });
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [kioskFilter, setKioskFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchKiosksList = async () => {
    try {
      const res = await fetch('/api/admin/kiosks');
      if (res.ok) {
        const data = await res.json();
        setKiosks(data);
      }
    } catch (e) {
      console.error('Failed to load kiosks list:', e);
    }
  };

  const fetchJobsList = async () => {
    setJobsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '20',
        status: statusFilter,
        colorMode: colorFilter,
        kioskId: kioskFilter,
        dateFrom,
        dateTo
      });
      const res = await fetch(`/api/admin/jobs?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setJobsData(data);
      }
    } catch (e) {
      console.error('Failed to fetch jobs list:', e);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      await fetchKiosksList();
      await fetchJobsList();
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchJobsList();
    }
  }, [page, statusFilter, colorFilter, kioskFilter, dateFrom, dateTo]);

  // Client-side CSV compiler that downloads all filtered matching rows
  const handleExportFilteredCsv = async () => {
    try {
      // Query database for all matches up to 2000 lines
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '2000',
        status: statusFilter,
        colorMode: colorFilter,
        kioskId: kioskFilter,
        dateFrom,
        dateTo
      });
      const res = await fetch(`/api/admin/jobs?${queryParams}`);
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();
      const exportJobs = data.jobs || [];

      const headers = [
        'Job ID',
        'Kiosk ID',
        'Kiosk Location',
        'Filename',
        'Pages',
        'Color Mode',
        'Sides',
        'Copies',
        'Paper Size',
        'Orientation',
        'Page Range',
        'Amount (INR)',
        'Status',
        'Payment ID',
        'Created At'
      ];

      const rows = exportJobs.map((j: any) => [
        j.id,
        j.kiosk_id,
        `"${(j.location_name || '').replace(/"/g, '""')}"`,
        `"${j.file_name.replace(/"/g, '""')}"`,
        j.page_count,
        j.color_mode,
        j.sides,
        j.copies,
        j.paper_size,
        j.orientation,
        j.page_range,
        j.amount,
        j.status,
        j.payment_id || '',
        j.created_at
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((r: any) => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `printdrop_filtered_jobs_export.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Failed to export jobs database to CSV file');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-customSecondary">
        <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold">Loading Print Jobs database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primaryTxt">All Print Jobs</h1>
          <p className="text-xs text-customSecondary mt-1">Audit and search logs across the platform</p>
        </div>
        <button
          onClick={handleExportFilteredCsv}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface hover:bg-elevated border border-customBorder text-xs font-bold text-primaryTxt rounded transition-all w-full sm:w-auto justify-center"
        >
          <ArrowDownToLine className="w-4 h-4 text-brandCyan" />
          Export Filtered CSV
        </button>
      </div>

      {/* Filtering Control Bar */}
      <div className="bg-surface border border-customBorder p-4 rounded-lg flex flex-wrap gap-4 shadow-card items-center">
        {/* Status */}
        <div className="flex flex-col space-y-1">
          <span className="text-[9px] uppercase font-bold text-customSecondary tracking-wider">Status</span>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-ink border border-customBorder rounded text-xs py-1.5 px-3 focus:outline-none text-primaryTxt cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="paid">Paid</option>
            <option value="printing">Printing</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Color Mode */}
        <div className="flex flex-col space-y-1">
          <span className="text-[9px] uppercase font-bold text-customSecondary tracking-wider">Color Mode</span>
          <select
            value={colorFilter}
            onChange={e => { setColorFilter(e.target.value); setPage(1); }}
            className="bg-ink border border-customBorder rounded text-xs py-1.5 px-3 focus:outline-none text-primaryTxt cursor-pointer"
          >
            <option value="all">All Modes</option>
            <option value="bw">Black & White</option>
            <option value="color">Color</option>
          </select>
        </div>

        {/* Kiosk Location */}
        <div className="flex flex-col space-y-1">
          <span className="text-[9px] uppercase font-bold text-customSecondary tracking-wider">Kiosk Terminal</span>
          <select
            value={kioskFilter}
            onChange={e => { setKioskFilter(e.target.value); setPage(1); }}
            className="bg-ink border border-customBorder rounded text-xs py-1.5 px-3 focus:outline-none text-primaryTxt cursor-pointer max-w-[200px]"
          >
            <option value="all">All Kiosks</option>
            {kiosks.map(k => (
              <option key={k.id} value={k.id}>
                {k.id} — {k.location_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="flex flex-col space-y-1">
          <span className="text-[9px] uppercase font-bold text-customSecondary tracking-wider">From Date</span>
          <div className="flex items-center gap-2 bg-ink border border-customBorder rounded py-1 px-2.5 text-xs text-primaryTxt">
            <Calendar className="w-3.5 h-3.5 text-customSecondary" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="bg-transparent border-0 focus:outline-none text-[10px] cursor-pointer"
            />
          </div>
        </div>

        {/* Date To */}
        <div className="flex flex-col space-y-1">
          <span className="text-[9px] uppercase font-bold text-customSecondary tracking-wider">To Date</span>
          <div className="flex items-center gap-2 bg-ink border border-customBorder rounded py-1 px-2.5 text-xs text-primaryTxt">
            <Calendar className="w-3.5 h-3.5 text-customSecondary" />
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="bg-transparent border-0 focus:outline-none text-[10px] cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={fetchJobsList}
          className="self-end p-2 bg-ink hover:bg-elevated border border-customBorder rounded text-xs font-bold text-primaryTxt transition-colors"
          title="Refresh List"
        >
          <RefreshCw className="w-4 h-4 text-brandBlue" />
        </button>
      </div>

      {/* Table grid */}
      <div className="bg-surface border border-customBorder rounded-lg p-5 shadow-card space-y-5">
        <div className="overflow-x-auto border border-customBorder rounded bg-ink/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-customBorder text-[10px] font-bold text-customSecondary uppercase tracking-wider bg-ink/30">
                <th className="p-3.5 pl-5">Job ID</th>
                <th className="p-3.5">Kiosk Node</th>
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
                  <td colSpan={10} className="p-8 text-center text-customSecondary">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brandBlue" />
                    Fetching database...
                  </td>
                </tr>
              ) : jobsData.jobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-customMuted">
                    No transactions registered matching filters.
                  </td>
                </tr>
              ) : (
                jobsData.jobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-ink/10 transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-[10px] font-bold text-primaryTxt">{job.id.slice(0, 8)}...</td>
                    <td className="p-3.5">
                      <span className="font-semibold text-primaryTxt block font-mono text-[10px]">{job.kiosk_id}</span>
                      <span className="text-[9px] text-customSecondary block mt-0.5 max-w-[120px] truncate">
                        {job.location_name}
                      </span>
                    </td>
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

        {/* Pagination */}
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
