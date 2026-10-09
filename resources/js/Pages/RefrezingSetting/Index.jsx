import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Settings, Save, RotateCcw, CheckCircle2, AlertCircle, Calculator, Info, Zap, Flame, ShieldAlert } from 'lucide-react';

export default function Index({ settings }) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('metode2'); // 'metode2' or 'metode1'

    const { data, setData, post, processing, errors } = useForm({
        // Metode 1
        siomay_multiplier: settings?.siomay_multiplier ?? 290,
        siomay_divider_loyang: settings?.siomay_divider_loyang ?? 22,
        siomay_divider_min: settings?.siomay_divider_min ?? 60,

        pentol_multiplier: settings?.pentol_multiplier ?? 290,
        pentol_divider_loyang: settings?.pentol_divider_loyang ?? 22,
        pentol_divider_min: settings?.pentol_divider_min ?? 60,

        lumpia_multiplier: settings?.lumpia_multiplier ?? 1.5,

        adonan_multiplier: settings?.adonan_multiplier ?? 71,
        adonan_divider_min: settings?.adonan_divider_min ?? 60,

        // Metode 2 (Refrezing Time 74 & 80)
        metode2_active_refrezing_time: settings?.metode2_active_refrezing_time ?? 74,
        m2_74_pentol_siomay_min: settings?.m2_74_pentol_siomay_min ?? 4,
        m2_74_pentol_siomay_loyang: settings?.m2_74_pentol_siomay_loyang ?? 22,
        m2_74_lumpia_min: settings?.m2_74_lumpia_min ?? 1.25,
        m2_74_adonan_min: settings?.m2_74_adonan_min ?? 1.25,

        m2_80_pentol_siomay_min: settings?.m2_80_pentol_siomay_min ?? 5,
        m2_80_pentol_siomay_loyang: settings?.m2_80_pentol_siomay_loyang ?? 22,
        m2_80_lumpia_min: settings?.m2_80_lumpia_min ?? 1.5,
        m2_80_adonan_min: settings?.m2_80_adonan_min ?? 1.5,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/refrezing/settings');
    };

    const handleResetDefaults = () => {
        if (confirm('Apakah Anda yakin ingin mengembalikan seluruh rumus ke setelan standar pabrik (74 & 80)?')) {
            setData({
                siomay_multiplier: 290,
                siomay_divider_loyang: 22,
                siomay_divider_min: 60,

                pentol_multiplier: 290,
                pentol_divider_loyang: 22,
                pentol_divider_min: 60,

                lumpia_multiplier: 1.5,

                adonan_multiplier: 71,
                adonan_divider_min: 60,

                metode2_active_refrezing_time: 74,
                m2_74_pentol_siomay_min: 4,
                m2_74_pentol_siomay_loyang: 22,
                m2_74_lumpia_min: 1.25,
                m2_74_adonan_min: 1.25,

                m2_80_pentol_siomay_min: 5,
                m2_80_pentol_siomay_loyang: 22,
                m2_80_lumpia_min: 1.5,
                m2_80_adonan_min: 1.5,
            });
        }
    };

    return (
        <AppLayout title="Setting Rumus">
            <Head title="Setting Rumus Deteksi LossTime" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-sky-800 via-cyan-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
                                <Settings className="w-8 h-8 text-cyan-200" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Setting Rumus Deteksi LossTime</h1>
                                <p className="text-cyan-100 text-xs sm:text-sm font-medium mt-1">
                                    Konfigurasi parameter Metode 1 & Metode 2 (Refrezing Time 74 & 80)
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleResetDefaults}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 backdrop-blur-md cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset Default
                        </button>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-xs">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Main Settings Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Method Tabs Selector */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-3xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('metode2')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                                    activeTab === 'metode2'
                                        ? 'bg-[#0284c7] text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Zap className="w-4 h-4 text-amber-300" />
                                <span>Metode 2 (Real Resep Refrezing Time 74 / 80)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('metode1')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                                    activeTab === 'metode1'
                                        ? 'bg-[#0284c7] text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Calculator className="w-4 h-4 text-cyan-200" />
                                <span>Metode 1 (Standard Formula)</span>
                            </button>
                        </div>

                        {/* Direct Reference Selector for Metode 2 */}
                        <div className="flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-amber-50 border border-amber-200/70 text-xs font-extrabold text-amber-900">
                            <span>Acuan Utama Metode 2:</span>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metode2_active_refrezing_time"
                                        value={74}
                                        checked={Number(data.metode2_active_refrezing_time) === 74}
                                        onChange={() => setData('metode2_active_refrezing_time', 74)}
                                        className="text-amber-600 focus:ring-amber-500"
                                    />
                                    <span>Refrezing Time 74</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metode2_active_refrezing_time"
                                        value={80}
                                        checked={Number(data.metode2_active_refrezing_time) === 80}
                                        onChange={() => setData('metode2_active_refrezing_time', 80)}
                                        className="text-amber-600 focus:ring-amber-500"
                                    />
                                    <span>Refrezing Time 80</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* METODE 2 SETTINGS VIEW */}
                    {activeTab === 'metode2' && (
                        <div className="space-y-6">
                            {/* SECTION 1: REFREZING TIME 74 */}
                            <div className="bg-white rounded-3xl border border-sky-200/80 shadow-xs p-6 space-y-5 relative overflow-hidden">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-sky-100 pb-4 gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                                            74
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-slate-900 text-base">Rumus Real Resep — Refrezing Time 74</h3>
                                                {Number(data.metode2_active_refrezing_time) === 74 && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                                                        ACUAN AKTIF
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">Acuan kapasitas real resep untuk suhu refrezing time 74</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {/* 74: PENTOL & SIOMAY */}
                                    <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-sky-900 text-xs">1. Pentol & Siomay</span>
                                            <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-md">Satuan: Loyang</span>
                                        </div>
                                        <div className="p-2.5 bg-white rounded-xl border border-sky-200 text-[11px] font-mono font-bold text-sky-900">
                                            Per {data.m2_74_pentol_siomay_min} menit menghasilkan {data.m2_74_pentol_siomay_loyang} loyang
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-600 mb-1">Durasi (Menit)</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={data.m2_74_pentol_siomay_min}
                                                    onChange={(e) => setData('m2_74_pentol_siomay_min', e.target.value)}
                                                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 text-slate-800"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-600 mb-1">Hasil (Loyang)</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={data.m2_74_pentol_siomay_loyang}
                                                    onChange={(e) => setData('m2_74_pentol_siomay_loyang', e.target.value)}
                                                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 text-slate-800"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 74: LUMPIA */}
                                    <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-teal-900 text-xs">2. Lumpia</span>
                                            <span className="text-[10px] font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-md">Satuan: Keranjang</span>
                                        </div>
                                        <div className="p-2.5 bg-white rounded-xl border border-teal-200 text-[11px] font-mono font-bold text-teal-900">
                                            {data.m2_74_lumpia_min} menit menghasilkan 1 keranjang
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Menit / Keranjang</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={data.m2_74_lumpia_min}
                                                onChange={(e) => setData('m2_74_lumpia_min', e.target.value)}
                                                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-800"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* 74: ADONAN PANGSIT */}
                                    <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-purple-900 text-xs">3. Adonan Pangsit</span>
                                            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">Satuan: Solid</span>
                                        </div>
                                        <div className="p-2.5 bg-white rounded-xl border border-purple-200 text-[11px] font-mono font-bold text-purple-900">
                                            {data.m2_74_adonan_min} menit menghasilkan 1 solid
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Menit / Solid</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={data.m2_74_adonan_min}
                                                onChange={(e) => setData('m2_74_adonan_min', e.target.value)}
                                                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 text-slate-800"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: REFREZING TIME 80 */}
                            <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs p-6 space-y-5 relative overflow-hidden">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-amber-100 pb-4 gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                                            80
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-slate-900 text-base">Rumus Real Resep — Refrezing Time 80</h3>
                                                {Number(data.metode2_active_refrezing_time) === 80 && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                                                        ACUAN AKTIF
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">Acuan kapasitas real resep untuk suhu refrezing time 80</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {/* 80: PENTOL & SIOMAY */}
                                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-amber-900 text-xs">1. Pentol & Siomay</span>
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">Satuan: Loyang</span>
                                        </div>
                                        <div className="p-2.5 bg-white rounded-xl border border-amber-200 text-[11px] font-mono font-bold text-amber-900">
                                            Per {data.m2_80_pentol_siomay_min} menit menghasilkan {data.m2_80_pentol_siomay_loyang} loyang
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-600 mb-1">Durasi (Menit)</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={data.m2_80_pentol_siomay_min}
                                                    onChange={(e) => setData('m2_80_pentol_siomay_min', e.target.value)}
                                                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-800"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-600 mb-1">Hasil (Loyang)</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={data.m2_80_pentol_siomay_loyang}
                                                    onChange={(e) => setData('m2_80_pentol_siomay_loyang', e.target.value)}
                                                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-800"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 80: LUMPIA */}
                                    <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-teal-900 text-xs">2. Lumpia</span>
                                            <span className="text-[10px] font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-md">Satuan: Keranjang</span>
                                        </div>
                                        <div className="p-2.5 bg-white rounded-xl border border-teal-200 text-[11px] font-mono font-bold text-teal-900">
                                            {data.m2_80_lumpia_min} menit menghasilkan 1 keranjang
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Menit / Keranjang</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={data.m2_80_lumpia_min}
                                                onChange={(e) => setData('m2_80_lumpia_min', e.target.value)}
                                                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-800"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* 80: ADONAN PANGSIT */}
                                    <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-purple-900 text-xs">3. Adonan Pangsit</span>
                                            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">Satuan: Solid</span>
                                        </div>
                                        <div className="p-2.5 bg-white rounded-xl border border-purple-200 text-[11px] font-mono font-bold text-purple-900">
                                            {data.m2_80_adonan_min} menit menghasilkan 1 solid
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Menit / Solid</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={data.m2_80_adonan_min}
                                                onChange={(e) => setData('m2_80_adonan_min', e.target.value)}
                                                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 text-slate-800"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* METODE 1 SETTINGS VIEW */}
                    {activeTab === 'metode1' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* CARD 1: SIOMAY */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 relative overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-sm">
                                            S
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 text-sm">Rumus Siomay (Metode 1)</h3>
                                            <span className="text-[11px] font-bold text-slate-400">Satuan Input: Loyang</span>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200/60">
                                        Formula Standard
                                    </span>
                                </div>

                                <div className="p-3 bg-sky-50/60 rounded-2xl border border-sky-100 text-xs font-mono text-sky-900 leading-relaxed">
                                    <div className="flex items-center gap-1.5 font-bold text-sky-800 mb-1">
                                        <Calculator className="w-3.5 h-3.5" /> Preview Rumus:
                                    </div>
                                    <code>(Jumlah Loyang × ({data.siomay_multiplier} / {data.siomay_divider_loyang})) / {data.siomay_divider_min}</code>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Multiplier (Faktor)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.siomay_multiplier}
                                            onChange={(e) => setData('siomay_multiplier', e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Pembagi Loyang</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.siomay_divider_loyang}
                                            onChange={(e) => setData('siomay_divider_loyang', e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Pembagi Menit</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.siomay_divider_min}
                                            onChange={(e) => setData('siomay_divider_min', e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* CARD 2: PENTOL */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 relative overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
                                            P
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 text-sm">Rumus Pentol (Metode 1)</h3>
                                            <span className="text-[11px] font-bold text-slate-400">Satuan Input: Loyang</span>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200/60">
                                        Formula Standard
                                    </span>
                                </div>

                                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 text-xs font-mono text-amber-900 leading-relaxed">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                                        <Calculator className="w-3.5 h-3.5" /> Preview Rumus:
                                    </div>
                                    <code>(Jumlah Loyang × ({data.pentol_multiplier} / {data.pentol_divider_loyang})) / {data.pentol_divider_min}</code>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Multiplier (Faktor)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.pentol_multiplier}
                                            onChange={(e) => setData('pentol_multiplier', e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Pembagi Loyang</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.pentol_divider_loyang}
                                            onChange={(e) => setData('pentol_divider_loyang', e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Pembagi Menit</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.pentol_divider_min}
                                            onChange={(e) => setData('pentol_divider_min', e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* CARD 3: LUMPIA */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 relative overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-sm">
                                            L
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 text-sm">Rumus Lumpia (Metode 1)</h3>
                                            <span className="text-[11px] font-bold text-slate-400">Satuan Input: Keranjang</span>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-50 text-teal-700 border border-teal-200/60">
                                        Formula Standard
                                    </span>
                                </div>

                                <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 text-xs font-mono text-teal-900 leading-relaxed">
                                    <div className="flex items-center gap-1.5 font-bold text-teal-800 mb-1">
                                        <Calculator className="w-3.5 h-3.5" /> Preview Rumus:
                                    </div>
                                    <code>Jumlah Keranjang × {data.lumpia_multiplier}</code>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Multiplier (Faktor Pengali)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={data.lumpia_multiplier}
                                        onChange={(e) => setData('lumpia_multiplier', e.target.value)}
                                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            {/* CARD 4: ADONAN PANGSIT */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 relative overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                                            A
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 text-sm">Rumus Adonan Pangsit (Metode 1)</h3>
                                            <span className="text-[11px] font-bold text-slate-400">Satuan Input: Solid</span>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200/60">
                                        Formula Standard
                                    </span>
                                </div>

                                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs font-mono text-purple-900 leading-relaxed">
                                    <div className="flex items-center gap-1.5 font-bold text-purple-800 mb-1">
                                        <Calculator className="w-3.5 h-3.5" /> Preview Rumus:
                                    </div>
                                    <code>(Jumlah Solid × {data.adonan_multiplier}) / {data.adonan_divider_min}</code>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Multiplier (Faktor Pengali)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.adonan_multiplier}
                                            onChange={(e) => setData('adonan_multiplier', e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Pembagi Menit</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.adonan_divider_min}
                                            onChange={(e) => setData('adonan_divider_min', e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-800"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 font-medium leading-relaxed">
                            <p className="font-bold text-amber-950">Informasi Penggunaan Rumus:</p>
                            <p>Perubahan rumus di atas akan langsung diterapkan secara real-time pada perhitungan <strong>Estimasi Waktu Resep</strong> dan <strong>Deteksi Loss Time</strong> di seluruh halaman sistem Refrezing.</p>
                        </div>
                    </div>

                    {/* Form Submit Footer */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#0284c7] hover:bg-sky-700 text-white font-black text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Setting Rumus'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
