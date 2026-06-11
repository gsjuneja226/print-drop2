'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Printer, Edit2, Play, Power, Download, X, HelpCircle, Check, Copy } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import QRCode from 'qrcode';

export default function AdminKiosks() {
  const router = useRouter();

  const [kiosks, setKiosks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedKiosk, setSelectedKiosk] = useState<any>(null);

  // Add Kiosk Form State
  const [newId, setNewId] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [justAddedKiosk, setJustAddedKiosk] = useState<any>(null); // To show setup instructions

  // Edit Kiosk Form State
  const [editLocationName, setEditLocationName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

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

  useEffect(() => {
    async function loadData() {
      await fetchKiosksList();
      setLoading(false);
    }
    loadData();
  }, []);

  const handleAddKiosk = async () => {
    if (!newId || !newLocationName) {
      setAddError('Kiosk ID and Location Name are required');
      return;
    }

    setAddError(null);
    try {
      const res = await fetch('/api/admin/kiosks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId.trim(),
          location_name: newLocationName.trim(),
          location_addr: newAddress.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create kiosk');
      }

      const created = await res.json();
      setJustAddedKiosk(created);
      
      // Reset form
      setNewId('');
      setNewLocationName('');
      setNewAddress('');
      
      await fetchKiosksList();
    } catch (err: any) {
      setAddError(err.message || 'ID already exists or invalid values entered');
    }
  };

  const handleOpenEditModal = (k: any) => {
    setSelectedKiosk(k);
    setEditLocationName(k.location_name);
    setEditAddress(k.location_addr || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditKiosk = async () => {
    if (!editLocationName) {
      setEditError('Location Name is required');
      return;
    }

    setEditError(null);
    try {
      const res = await fetch(`/api/admin/kiosks/${selectedKiosk.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_name: editLocationName.trim(),
          location_addr: editAddress.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update kiosk');
      }

      setIsEditModalOpen(false);
      setSelectedKiosk(null);
      await fetchKiosksList();
    } catch (err: any) {
      setEditError(err.message || 'Error occurred during edit operation');
    }
  };

  const toggleKioskActiveState = async (k: any) => {
    try {
      const res = await fetch(`/api/admin/kiosks/${k.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !k.is_active,
        }),
      });

      if (res.ok) {
        await fetchKiosksList();
      }
    } catch (e) {
      console.error('Failed to toggle kiosk status:', e);
    }
  };

  const downloadKioskQrPng = async (k: any) => {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const printUrl = `${appUrl}/print/${k.id}`;
      
      // Generate standard large QR PNG
      const qrDataUrl = await QRCode.toDataURL(printUrl, {
        margin: 2,
        width: 800, // High res for printing
        color: {
          dark: '#0C0C0F',
          light: '#F0F0F5',
        },
      });

      const anchor = document.createElement('a');
      anchor.href = qrDataUrl;
      anchor.download = `printdrop_kiosk_${k.id}_qr.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (e) {
      alert('Failed to generate printable QR Code');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-customSecondary">
        <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold">Loading Kiosk Networks database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primaryTxt">Kiosks Database</h1>
          <p className="text-xs text-customSecondary mt-1">Manage and provision physical kiosk terminal installations</p>
        </div>
        <button
          onClick={() => {
            setJustAddedKiosk(null);
            setAddError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brandBlue hover:bg-brandBlue/90 text-xs font-bold text-white rounded transition-all shadow-glow"
        >
          <Plus className="w-4 h-4" />
          Add New Kiosk
        </button>
      </div>

      {/* Database Table */}
      <div className="bg-surface border border-customBorder rounded-lg overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-customBorder text-[10px] font-bold text-customSecondary uppercase bg-ink/30 tracking-wider">
                <th className="p-4 pl-6">Kiosk ID</th>
                <th className="p-4">Location Name</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Last Ping</th>
                <th className="p-4 text-right">Today's Rev</th>
                <th className="p-4 text-center">Today's Jobs</th>
                <th className="p-4 text-right">Total Rev</th>
                <th className="p-4 text-center">Total Jobs</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-customBorder/50 text-xs">
              {kiosks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-customMuted">
                    No kiosks registered. Click "Add New Kiosk" to get started.
                  </td>
                </tr>
              ) : (
                kiosks.map(k => (
                  <tr key={k.id} className="hover:bg-ink/20 transition-colors">
                    <td className="p-4 pl-6 font-bold text-primaryTxt font-mono">{k.id}</td>
                    <td className="p-4">
                      <span className="font-semibold text-primaryTxt block">{k.location_name}</span>
                      <span className="text-[10px] text-customSecondary mt-0.5 block">{k.location_addr || 'No address set'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-ink border border-customBorder px-2.5 py-1 rounded-full">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            k.status === 'online'
                              ? 'bg-brandCyan shadow-[0_0_8px_rgba(0,229,204,0.4)]'
                              : k.status === 'idle'
                              ? 'bg-brandOrange'
                              : k.status === 'inactive'
                              ? 'bg-customMuted'
                              : 'bg-brandRed'
                          }`}
                        />
                        <span className="text-[9px] uppercase font-bold text-customSecondary">{k.status}</span>
                      </div>
                    </td>
                    <td className="p-4 text-customSecondary">{formatDate(k.last_ping)}</td>
                    <td className="p-4 text-right font-semibold text-brandCyan">{formatCurrency(k.todayRevenue)}</td>
                    <td className="p-4 text-center font-semibold text-primaryTxt">{k.todayJobs}</td>
                    <td className="p-4 text-right font-bold text-brandCyan">{formatCurrency(k.totalRevenue)}</td>
                    <td className="p-4 text-center font-bold text-primaryTxt">{k.totalJobs}</td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => router.push(`/admin/kiosks/${k.id}`)}
                          className="px-2.5 py-1.5 bg-ink border border-customBorder hover:bg-elevated rounded text-[10px] font-bold text-primaryTxt transition-all uppercase"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(k)}
                          className="p-1.5 hover:bg-elevated border border-transparent hover:border-customBorder rounded text-customSecondary hover:text-primaryTxt transition-colors"
                          title="Edit Location"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => downloadKioskQrPng(k)}
                          className="p-1.5 hover:bg-elevated border border-transparent hover:border-customBorder rounded text-brandBlue hover:text-brandBlue/90 transition-colors"
                          title="Download QR"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleKioskActiveState(k)}
                          className={`p-1.5 border border-transparent rounded transition-colors ${
                            k.is_active
                              ? 'text-brandRed hover:bg-brandRed/10 hover:border-brandRed/30'
                              : 'text-brandCyan hover:bg-brandCyan/10 hover:border-brandCyan/30'
                          }`}
                          title={k.is_active ? 'Deactivate Kiosk' : 'Activate Kiosk'}
                        >
                          {k.is_active ? <Power className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD KIOSK */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-surface border border-customBorder rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="p-6 border-b border-customBorder flex justify-between items-center bg-ink/30">
              <h2 className="font-display font-semibold text-base text-primaryTxt flex items-center gap-2">
                <Printer className="w-4 h-4 text-brandBlue" />
                Add New Kiosk Terminal
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-customSecondary hover:text-primaryTxt p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {justAddedKiosk ? (
                // Setup Instructions after addition
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-brandCyan/10 border border-brandCyan/30 rounded p-4 text-center">
                    <Check className="w-8 h-8 text-brandCyan mx-auto mb-2" />
                    <h3 className="font-semibold text-sm text-primaryTxt">Kiosk {justAddedKiosk.id} Registered Successfully!</h3>
                    <p className="text-xs text-customSecondary mt-1">Ready for installation and heartbeat linking.</p>
                  </div>

                  <div className="bg-ink border border-customBorder p-4 rounded text-xs space-y-3">
                    <p className="font-bold text-primaryTxt">Setup Instructions:</p>
                    <ol className="list-decimal pl-4 space-y-2 text-customSecondary">
                      <li>Log in to the Kiosk Laptop machine.</li>
                      <li>Run terminal shell command:</li>
                      <pre className="bg-surface border border-customBorder p-2 rounded text-[10px] font-mono text-primaryTxt overflow-x-auto select-all">
                        {`export KIOSK_ID=${justAddedKiosk.id} && ./start-kiosk.sh`}
                      </pre>
                      <li>The printer server will automatically connect and link to this dashboard.</li>
                    </ol>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => downloadKioskQrPng(justAddedKiosk)}
                      className="flex-1 py-3 border border-customBorder bg-ink hover:bg-elevated text-xs font-bold rounded text-primaryTxt transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 text-brandBlue" />
                      Download QR Code
                    </button>
                    <button
                      onClick={() => {
                        setJustAddedKiosk(null);
                        setIsAddModalOpen(false);
                      }}
                      className="flex-1 py-3 bg-brandBlue hover:bg-brandBlue/90 text-xs font-bold rounded text-white transition-all shadow-glow"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                // Input forms
                <div className="space-y-4">
                  {addError && (
                    <div className="bg-brandRed/10 border border-brandRed/30 rounded p-3 text-xs text-brandRed font-medium">
                      {addError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-customSecondary uppercase tracking-wider block">Kiosk ID (Unique)</label>
                    <input
                      type="text"
                      placeholder="e.g., KIOSK_PAU_01"
                      value={newId}
                      onChange={e => setNewId(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                      className="w-full bg-ink border border-customBorder rounded py-2.5 px-3.5 text-xs text-primaryTxt focus:outline-none focus:ring-1 focus:ring-brandBlue placeholder-customMuted font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-customSecondary uppercase tracking-wider block">Location Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Central Library, Floor 2"
                      value={newLocationName}
                      onChange={e => setNewLocationName(e.target.value)}
                      className="w-full bg-ink border border-customBorder rounded py-2.5 px-3.5 text-xs text-primaryTxt focus:outline-none focus:ring-1 focus:ring-brandBlue placeholder-customMuted"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-customSecondary uppercase tracking-wider block">Address Details</label>
                    <input
                      type="text"
                      placeholder="e.g., PAU Campus, Ludhiana, Punjab"
                      value={newAddress}
                      onChange={e => setNewAddress(e.target.value)}
                      className="w-full bg-ink border border-customBorder rounded py-2.5 px-3.5 text-xs text-primaryTxt focus:outline-none focus:ring-1 focus:ring-brandBlue placeholder-customMuted"
                    />
                  </div>

                  <button
                    onClick={handleAddKiosk}
                    className="w-full mt-4 py-3.5 bg-brandBlue hover:bg-brandBlue/90 text-white text-xs font-bold rounded transition-all shadow-glow flex items-center justify-center gap-1.5"
                  >
                    Register Kiosk Node
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT KIOSK */}
      {isEditModalOpen && selectedKiosk && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-surface border border-customBorder rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="p-6 border-b border-customBorder flex justify-between items-center bg-ink/30">
              <h2 className="font-display font-semibold text-base text-primaryTxt flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brandBlue" />
                Edit Kiosk Details ({selectedKiosk.id})
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-customSecondary hover:text-primaryTxt p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {editError && (
                <div className="bg-brandRed/10 border border-brandRed/30 rounded p-3 text-xs text-brandRed font-medium">
                  {editError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-customSecondary uppercase tracking-wider block">Location Name</label>
                <input
                  type="text"
                  value={editLocationName}
                  onChange={e => setEditLocationName(e.target.value)}
                  className="w-full bg-ink border border-customBorder rounded py-2.5 px-3.5 text-xs text-primaryTxt focus:outline-none focus:ring-1 focus:ring-brandBlue"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-customSecondary uppercase tracking-wider block">Address Details</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full bg-ink border border-customBorder rounded py-2.5 px-3.5 text-xs text-primaryTxt focus:outline-none focus:ring-1 focus:ring-brandBlue"
                />
              </div>

              <button
                onClick={handleEditKiosk}
                className="w-full mt-4 py-3.5 bg-brandBlue hover:bg-brandBlue/90 text-white text-xs font-bold rounded transition-all shadow-glow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
