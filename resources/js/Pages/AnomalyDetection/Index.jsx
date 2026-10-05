import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import AnomalyDetectionSection from '@/components/AnomalyDetectionSection';
import { AlertCircle, Calendar, Clock, Filter, Layers, RefreshCw, Snowflake, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Index({ filters, iqfAnomaly, iqfAnomalyByMachine, refrezingAnomaly, iqfUnplannedStops, refrezingUnplannedStops }) {
    const [selectedDate, setSelectedDate] = useState(filters?.date || new Date().toISOString().split('T')[0]);
    const [selectedShift, setSelectedShift] = useState(filters?.shift || 1);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'iqf' | 'refrezing'
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleFilterSubmit = (e) => {
        if (e) e.preventDefault();
        setIsRefreshing(true);
        router.get(
            '/deteksi-anomali',
            { date: selectedDate, shift: selectedShift },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsRefreshing(false),
            }
        );
    };

    // Calculate total loss time
    const totalIqfLossTime = iqfAnomaly?.unaccounted_minutes || 0;
    const totalRefrezingLossTime = refrezingAnomaly?.unaccounted_minutes || 0;
    const grandTotalLossTime = totalIqfLossTime + totalRefrezingLossTime;

    // Check status
    const hasIqfAnomaly = iqfAnomaly?.status === 'anomaly';
    const hasRefrezingAnomaly = refrezingAnomaly?.status === 'anomaly';
    const isOverallAnomaly = hasIqfAnomaly || hasRefrezingAnomaly;

    return (
        <AppLayout>
            <Head title="Deteksi Anomali & LossTime" />

            <div className="space-y-6 pb-12">
                {/* ── Page Header & Controls ─────────────────────────────────── */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                Deteksi LossTime & Anomali Sistem
                                {isOverallAnomaly ? (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold border border-rose-200 animate-pulse">
                                        Perhatian Perlunya Tindakan
                                    </span>
                                ) : (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                                        Sistem Normal
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                Pusat pemantauan real-time selisih jam kerja, kendala produksi, dan anomali loss time (IQF & Refrezing).
                            </p>
                        </div>
                    </div>

                    {/* Filter Form */}
                    <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:ring-0 p-0"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <select
                                value={selectedShift}
                                onChange={(e) => setSelectedShift(Number(e.target.value))}
                                className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:ring-0 p-0 pr-6"
                            >
                                <option value={1}>Shift 1 (07:00 - 15:00)</option>
                                <option value={2}>Shift 2 (15:00 - 23:00)</option>
                                <option value={3}>Shift 3 (23:00 - 07:00)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isRefreshing}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Terapkan Filter
                        </button>
                    </form>
                </div>

                {/* ── Summary KPI Cards ──────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Loss Time Hari Ini</span>
                            <h3 className={`text-2xl font-black mt-1 ${grandTotalLossTime > 30 ? 'text-rose-600' : 'text-slate-800'}`}>
                                {grandTotalLossTime} <span className="text-xs font-bold text-slate-400">menit</span>
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                                IQF: {totalIqfLossTime}m | Refrezing: {totalRefrezingLossTime}m
                            </span>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${grandTotalLossTime > 30 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Anomali IQF</span>
                            <h3 className="text-lg font-black text-slate-800 mt-1 capitalize flex items-center gap-2">
                                {hasIqfAnomaly ? (
                                    <span className="text-rose-600 flex items-center gap-1">
                                        <AlertTriangle className="w-4 h-4" /> Ada LossTime
                                    </span>
                                ) : (
                                    <span className="text-emerald-600 flex items-center gap-1">
                                        <ShieldCheck className="w-4 h-4" /> Sesuai Target
                                    </span>
                                )}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                                IQF 1 & IQF 2 Machine Monitoring
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Anomali Refrezing</span>
                            <h3 className="text-lg font-black text-slate-800 mt-1 capitalize flex items-center gap-2">
                                {hasRefrezingAnomaly ? (
                                    <span className="text-rose-600 flex items-center gap-1">
                                        <AlertTriangle className="w-4 h-4" /> Ada LossTime
                                    </span>
                                ) : (
                                    <span className="text-emerald-600 flex items-center gap-1">
                                        <ShieldCheck className="w-4 h-4" /> Sesuai Target
                                    </span>
                                )}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                                Refrezing System Monitoring
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Snowflake className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* ── System Selector Tabs ────────────────────────────────────── */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'all'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        Semua Sistem (IQF & Refrezing)
                    </button>
                    <button
                        onClick={() => setActiveTab('iqf')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            activeTab === 'iqf'
                                ? 'bg-[#0284c7] text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Sistem Produksi IQF
                    </button>
                    <button
                        onClick={() => setActiveTab('refrezing')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            activeTab === 'refrezing'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <Snowflake className="w-3.5 h-3.5" />
                        Refrezing System
                    </button>
                </div>

                {/* ── Detailed Anomaly Sections ───────────────────────────────── */}
                {(activeTab === 'all' || activeTab === 'iqf') && (
                    <div className="space-y-4">
                        <AnomalyDetectionSection
                            anomalyData={iqfAnomaly}
                            title="Deteksi LossTime & Anomali Sistem IQF (Mesin 1 & Mesin 2)"
                        />
                    </div>
                )}

                {(activeTab === 'all' || activeTab === 'refrezing') && (
                    <div className="space-y-4">
                        <AnomalyDetectionSection
                            anomalyData={refrezingAnomaly}
                            title="Deteksi LossTime & Anomali Refrezing System"
                            apiEndpoint="/refrezing/dashboard/stats"
                        />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
