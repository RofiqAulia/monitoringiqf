import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, ShieldAlert, Clock, Layers, Printer, Activity, CalendarDays, RefreshCw, Loader2 } from 'lucide-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import 'primereact/resources/primereact.min.css';
import axios from 'axios';

/** Mapping shift ke time range */
const SHIFT_MAP = {
    '1': { from: '08:00', to: '16:00', label: 'Shift 1 (08:00–16:00)' },
    '2': { from: '16:00', to: '00:00', label: 'Shift 2 (16:00–00:00)' },
    '3': { from: '00:00', to: '08:00', label: 'Shift 3 (00:00–08:00)' },
    'all': { from: '00:00', to: '23:59', label: 'Semua Shift' },
};

/** Deteksi shift aktif berdasarkan jam WIB */
function detectCurrentShift() {
    const now = new Date();
    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const hour = wib.getHours();
    if (hour >= 8 && hour < 16) return '1';
    if (hour >= 16) return '2';
    return '3';
}

/** Format tanggal WIB hari ini sebagai YYYY-MM-DD */
function getTodayWib() {
    const now = new Date();
    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    return wib.getFullYear() + '-' + String(wib.getMonth() + 1).padStart(2, '0') + '-' + String(wib.getDate()).padStart(2, '0');
}

/** Komponen jam real-time untuk footer & cetak */
function LiveClockFooter({ className = "text-xs font-bold text-slate-700 tracking-tight" }) {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const dateStr = wib.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = wib.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return (
        <span className={className}>
            {dateStr}, {timeStr} WIB
        </span>
    );
}

/** Hitung elapsed minutes dari awal shift sampai sekarang (WIB) */
function calcLiveElapsedMinutes(shift) {
    const shiftStart = SHIFT_MAP[shift];
    if (!shiftStart) return null;
    const now = new Date();
    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const nowMins = wib.getHours() * 60 + wib.getMinutes();
    const [fH, fM] = shiftStart.from.split(':').map(Number);
    const fromMins = fH * 60 + fM;
    const [tH, tM] = shiftStart.to.split(':').map(Number);
    let toMins = tH * 60 + tM;
    if (shiftStart.to === '00:00' && shiftStart.from !== '00:00') toMins = 1440;
    const totalShift = toMins > fromMins ? toMins - fromMins : toMins + 1440 - fromMins;
    let elapsed = nowMins >= fromMins ? nowMins - fromMins : nowMins + 1440 - fromMins;
    elapsed = Math.max(0, Math.min(totalShift, elapsed));
    return elapsed;
}

export default function AnomalyDetectionSection({ anomalyData, refrezingSettings, title = "Deteksi LossTime & Rekap Shift IQF", apiEndpoint = "/dashboard/stats" }) {
    const [selectedTab, setSelectedTab] = useState('ALL'); // 'ALL', 'IQF 1', 'IQF 2'
    const [selectedMethod, setSelectedMethod] = useState('METODE_2'); // 'METODE_2', 'METODE_1', 'KOMPARASI'
    const [selectedRefTime, setSelectedRefTime] = useState(null); // null (use db default), 74, 80
    const [printingMachine, setPrintingMachine] = useState(null); // null, 'IQF 1', 'IQF 2'

    // ── Filter Histori ──
    const todayStr = getTodayWib();
    const currentShift = detectCurrentShift();
    const [filterDate, setFilterDate] = useState(todayStr);
    const [filterShift, setFilterShift] = useState(currentShift);
    const [localAnomalyData, setLocalAnomalyData] = useState(null);
    const [filterLoading, setFilterLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Live elapsed minutes (updates every second)
    const [liveElapsed, setLiveElapsed] = useState(() => calcLiveElapsedMinutes(currentShift));

    /** Cek apakah filter sesuai dengan data default (hari ini + shift aktif) */
    const isDefaultFilter = filterDate === todayStr && filterShift === currentShift;

    /** Fetch data anomali berdasarkan filter tanggal & shift */
    const fetchAnomalyData = useCallback(async (date, shift) => {
        const shiftConfig = SHIFT_MAP[shift] || SHIFT_MAP['all'];
        setFilterLoading(true);
        try {
            const res = await axios.get(apiEndpoint, {
                params: {
                    date: date,
                    shift: shift,
                    from_time: shiftConfig.from,
                    to_time: shiftConfig.to,
                },
            });
            setLocalAnomalyData(res.data?.anomaly_detection || null);
        } catch (e) {
            console.error('Gagal memuat data:', e);
            setLocalAnomalyData(null);
        } finally {
            setFilterLoading(false);
            setLastRefreshed(new Date());
        }
    }, [apiEndpoint]);

    /** Auto-fetch ketika filter berubah — selalu fetch untuk data akurat */
    useEffect(() => {
        fetchAnomalyData(filterDate, filterShift);
    }, [filterDate, filterShift]); // eslint-disable-line react-hooks/exhaustive-deps

    /** Auto-polling: refetch setiap 30 detik jika menampilkan data hari ini */
    useEffect(() => {
        const isToday = filterDate === todayStr;
        if (!isToday) return;
        const interval = setInterval(() => {
            fetchAnomalyData(filterDate, filterShift);
        }, 30000);
        return () => clearInterval(interval);
    }, [filterDate, filterShift, todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

    /** Live elapsed minutes ticker — update setiap detik untuk shift aktif hari ini */
    useEffect(() => {
        const isToday = filterDate === todayStr;
        if (!isToday || filterShift === 'all') return;
        const tick = () => setLiveElapsed(calcLiveElapsedMinutes(filterShift));
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [filterDate, filterShift, todayStr]);

    /** Data efektif: dari fetch lokal jika tersedia, atau dari prop parent */
    const effectiveData = localAnomalyData || anomalyData;

    /** Flag untuk menandai apakah sedang menampilkan data live hari ini */
    const isLiveToday = filterDate === todayStr && filterShift !== 'all';

    if (!effectiveData && !filterLoading) {
        return null;
    }

    // Extract per-machine data if available
    const machineDataMap = effectiveData?.by_machine || effectiveData?.anomaly_detection_by_machine || {};
    const iqf1Data = machineDataMap['IQF 1'] || null;
    const iqf2Data = machineDataMap['IQF 2'] || null;

    const handlePrintAnomaly = () => {
        setPrintingMachine(null);
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handlePrintMachine = (mName) => {
        setPrintingMachine(mName);
        setTimeout(() => {
            window.print();
            setTimeout(() => setPrintingMachine(null), 500);
        }, 150);
    };

    const renderMachineCard = (mName, mData) => {
        if (!mData) {
            return (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 text-center text-slate-400 text-xs font-semibold">
                    Tidak ada data untuk {mName}
                </div>
            );
        }

        const {
            active_minutes_by_product = {},
            total_active_dimsum_mins: total_active_dimsum_mins_raw = 0,
            downtime_minutes: downtime_minutes_raw = 0,
            total_recorded_minutes: total_recorded_minutes_raw = 0,
            target_shift_minutes = 480,
            elapsed_shift_minutes: serverElapsedMins = target_shift_minutes,
            unaccounted_minutes: serverUnaccounted = 0,
            status: serverStatus = 'normal',
            downtime_entries = [],
            matrix_rows = [],
        } = mData;

        // Override elapsed dengan live elapsed jika menampilkan data hari ini
        const elapsed_shift_minutes = (isLiveToday && liveElapsed !== null) ? liveElapsed : serverElapsedMins;
        // Alias nama untuk kompatibilitas
        const total_active_dimsum_mins = total_active_dimsum_mins_raw;
        const downtime_minutes = downtime_minutes_raw;
        const total_recorded_minutes = total_recorded_minutes_raw;
        // Recalculate unaccounted based on live elapsed
        const unaccounted_minutes = (isLiveToday && liveElapsed !== null)
            ? Math.max(0, elapsed_shift_minutes - total_active_dimsum_mins - downtime_minutes)
            : serverUnaccounted;
        const status = (unaccounted_minutes > 30) ? 'anomaly' : (unaccounted_minutes > 0 ? 'warning' : serverStatus);

        const pentolMins = active_minutes_by_product.pentol ?? 0;
        const siomayMins = active_minutes_by_product.siomay ?? 0;
        const lumpiaMins = active_minutes_by_product.lumpia ?? 0;
        const adonanMins = active_minutes_by_product.adonan_pangsit ?? 0;

        let pentolRows = [...matrix_rows.filter(r => r.product_type === 'pentol')];
        let siomayRows = [...matrix_rows.filter(r => r.product_type === 'siomay')];
        let lumpiaRows = [...matrix_rows.filter(r => r.product_type === 'lumpia')];
        let adonanRows = [...matrix_rows.filter(r => r.product_type === 'adonan_pangsit')];
        let sortedDowntime = [...downtime_entries];

        const maxRowsCount = Math.max(
            siomayRows.length,
            pentolRows.length,
            lumpiaRows.length,
            adonanRows.length,
            sortedDowntime.length,
            1
        );

        const isAnomaly = status === 'anomaly' || unaccounted_minutes > 30;
        const isWarning = status === 'warning' || (unaccounted_minutes > 0 && unaccounted_minutes <= 30);

        // Prepare structured table data array for PrimeReact DataTable
        const tableValue = Array.from({ length: maxRowsCount }).map((_, idx) => {
            const siomayItem  = siomayRows[idx];
            const pentolItem  = pentolRows[idx];
            const lumpiaItem  = lumpiaRows[idx];
            const adonanItem  = adonanRows[idx];
            const dtItem      = sortedDowntime[idx];

            return {
                id: idx + 1,
                index: idx + 1,
                siomay: siomayItem ? `${siomayItem.time} (${siomayItem.tray_count ?? 0} L)` : '-',
                pentol: pentolItem ? `${pentolItem.time} (${pentolItem.tray_count ?? 0} L)` : '-',
                lumpia: lumpiaItem ? `${lumpiaItem.time} (${lumpiaItem.tray_count ?? 0} K)` : '-',
                adonan: adonanItem ? `${adonanItem.time} (${adonanItem.tray_count ?? 0} S)` : '-',
                downtime: dtItem ? (
                    (dtItem.dur_mins && dtItem.dur_mins > 0)
                        ? `${dtItem.text} (${dtItem.dur_mins}m)`
                        : `${dtItem.text} (Belum Selesai)`
                ) : '-',
            };
        });

        const totalDimsumAndDowntime = siomayMins + pentolMins + lumpiaMins + adonanMins + downtime_minutes;

        // Helper function to get the last/highest valid Rak number (Nomor Rak Terakhir from d.rak)
        const getRakTerakhir = (rows) => {
            if (!rows || rows.length === 0) return 0;
            let maxVal = 0;
            for (let i = 0; i < rows.length; i++) {
                const raw = rows[i].rak;
                if (raw !== null && raw !== undefined) {
                    const str = String(raw).replace(/\D/g, '');
                    const val = parseInt(str, 10);
                    if (!isNaN(val) && val > maxVal) maxVal = val;
                }
            }
            return maxVal;
        };

        // Helper function to get the last/highest valid Batch number (Nomor Batch Terakhir from d.batch_number or head_batch)
        const getBatchTerakhir = (rows) => {
            if (!rows || rows.length === 0) return 0;
            let maxVal = 0;
            for (let i = 0; i < rows.length; i++) {
                const raw = rows[i].batch_number || rows[i].head_batch;
                if (raw !== null && raw !== undefined) {
                    const str = String(raw).replace(/\D/g, '');
                    const val = parseInt(str, 10);
                    if (!isNaN(val) && val > maxVal) maxVal = val;
                }
            }
            if (maxVal > 0) return maxVal;
            const uniqueBatches = new Set(rows.map(r => r.batch_number || r.head_batch).filter(Boolean));
            return uniqueBatches.size > 0 ? uniqueBatches.size : (rows.length > 0 ? 1 : 0);
        };

        const siomayTotalLoyang = siomayRows.reduce((sum, r) => sum + (Number(r.tray_count) || 0), 0);
        const pentolTotalLoyang = pentolRows.reduce((sum, r) => sum + (Number(r.tray_count) || 0), 0);
        const lumpiaTotalKeranjang = lumpiaRows.reduce((sum, r) => sum + (Number(r.tray_count) || 0), 0);
        const adonanTotalSolid = adonanRows.reduce((sum, r) => sum + (Number(r.tray_count) || 0), 0);

        // Format to 1 decimal place if not a whole integer (e.g., 67.7 for 14 raks)
        const formatMins = (val) => {
            const num = Number(val);
            if (isNaN(num)) return '0';
            return Number.isInteger(num) ? num.toString() : num.toFixed(1);
        };

        const st = refrezingSettings || effectiveData?.refrezing_settings || {};
        const getVal = (val, fallback) => (val !== undefined && val !== null && val !== '') ? Number(val) : fallback;

        // Active Refrezing Time for Metode 2
        const defaultRefTime = getVal(st.metode2_active_refrezing_time, 74);
        const activeRefTime  = selectedRefTime || defaultRefTime;

        // ── Metode 1 Params ──
        const s_mult  = getVal(st.siomay_multiplier, 290);
        const s_div_l = getVal(st.siomay_divider_loyang, 22);
        const s_div_m = getVal(st.siomay_divider_min, 60);

        const p_mult  = getVal(st.pentol_multiplier, 290);
        const p_div_l = getVal(st.pentol_divider_loyang, 22);
        const p_div_m = getVal(st.pentol_divider_min, 60);

        const l_mult  = getVal(st.lumpia_multiplier, 1.5);

        const a_mult  = getVal(st.adonan_multiplier, 71);
        const a_div_m = getVal(st.adonan_divider_min, 60);

        // ── Metode 2 Params (74 & 80) ──
        const m2_74_ps_min    = getVal(st.m2_74_pentol_siomay_min, 4.0);
        const m2_74_ps_loyang = getVal(st.m2_74_pentol_siomay_loyang, 22.0);
        const m2_74_l_min     = getVal(st.m2_74_lumpia_min, 1.25);
        const m2_74_a_min     = getVal(st.m2_74_adonan_min, 1.25);

        const m2_80_ps_min    = getVal(st.m2_80_pentol_siomay_min, 5.0);
        const m2_80_ps_loyang = getVal(st.m2_80_pentol_siomay_loyang, 22.0);
        const m2_80_l_min     = getVal(st.m2_80_lumpia_min, 1.5);
        const m2_80_a_min     = getVal(st.m2_80_adonan_min, 1.5);

        // Calculate Resep Values per Method:
        // 1. Metode 1
        const siomayResepM1 = (siomayTotalLoyang * (s_mult / s_div_l)) / s_div_m;
        const pentolResepM1 = (pentolTotalLoyang * (p_mult / p_div_l)) / p_div_m;
        const lumpiaResepM1 = lumpiaTotalKeranjang * l_mult;
        const adonanResepM1 = (adonanTotalSolid * a_mult) / a_div_m;
        const totalResepValM1 = siomayResepM1 + pentolResepM1 + lumpiaResepM1 + adonanResepM1;

        // 2. Metode 2 (74)
        const siomayResepM2_74 = (siomayTotalLoyang / m2_74_ps_loyang) * m2_74_ps_min;
        const pentolResepM2_74 = (pentolTotalLoyang / m2_74_ps_loyang) * m2_74_ps_min;
        const lumpiaResepM2_74 = lumpiaTotalKeranjang * m2_74_l_min;
        const adonanResepM2_74 = adonanTotalSolid * m2_74_a_min;
        const totalResepValM2_74 = siomayResepM2_74 + pentolResepM2_74 + lumpiaResepM2_74 + adonanResepM2_74;

        // 3. Metode 2 (80)
        const siomayResepM2_80 = (siomayTotalLoyang / m2_80_ps_loyang) * m2_80_ps_min;
        const pentolResepM2_80 = (pentolTotalLoyang / m2_80_ps_loyang) * m2_80_ps_min;
        const lumpiaResepM2_80 = lumpiaTotalKeranjang * m2_80_l_min;
        const adonanResepM2_80 = adonanTotalSolid * m2_80_a_min;
        const totalResepValM2_80 = siomayResepM2_80 + pentolResepM2_80 + lumpiaResepM2_80 + adonanResepM2_80;

        // Choose Active Resep Values
        let siomayResepVal, pentolResepVal, lumpiaResepVal, adonanResepVal, totalResepVal;

        if (selectedMethod === 'METODE_1') {
            siomayResepVal = siomayResepM1;
            pentolResepVal = pentolResepM1;
            lumpiaResepVal = lumpiaResepM1;
            adonanResepVal = adonanResepM1;
            totalResepVal  = totalResepValM1;
        } else { // METODE_2 or KOMPARASI
            if (activeRefTime === 80) {
                siomayResepVal = siomayResepM2_80;
                pentolResepVal = pentolResepM2_80;
                lumpiaResepVal = lumpiaResepM2_80;
                adonanResepVal = adonanResepM2_80;
                totalResepVal  = totalResepValM2_80;
            } else {
                siomayResepVal = siomayResepM2_74;
                pentolResepVal = pentolResepM2_74;
                lumpiaResepVal = lumpiaResepM2_74;
                adonanResepVal = adonanResepM2_74;
                totalResepVal  = totalResepValM2_74;
            }
        }

        // ── Active Metode 2 Target Product Quantities (Jumlah Produk Target yang Perlu Dicapai) ──
        const active_ps_min    = activeRefTime === 80 ? m2_80_ps_min : m2_74_ps_min;
        const active_ps_loyang = activeRefTime === 80 ? m2_80_ps_loyang : m2_74_ps_loyang;
        const active_l_min     = activeRefTime === 80 ? m2_80_l_min : m2_74_l_min;
        const active_a_min     = activeRefTime === 80 ? m2_80_a_min : m2_74_a_min;

        const siomayTargetQty = active_ps_min > 0 ? (siomayMins / active_ps_min) * active_ps_loyang : 0;
        const pentolTargetQty = active_ps_min > 0 ? (pentolMins / active_ps_min) * active_ps_loyang : 0;
        const lumpiaTargetQty = active_l_min > 0 ? lumpiaMins / active_l_min : 0;
        const adonanTargetQty = active_a_min > 0 ? adonanMins / active_a_min : 0;
        const totalTargetQty  = siomayTargetQty + pentolTargetQty + lumpiaTargetQty + adonanTargetQty;

        const totalActualQty  = siomayTotalLoyang + pentolTotalLoyang + lumpiaTotalKeranjang + adonanTotalSolid;

        // Metode 2: Selisih Qty Produk (Actual Output - Target Real Resep)
        const siomaySelisihQty = siomayTotalLoyang - siomayTargetQty;
        const pentolSelisihQty = pentolTotalLoyang - pentolTargetQty;
        const lumpiaSelisihQty = lumpiaTotalKeranjang - lumpiaTargetQty;
        const adonanSelisihQty = adonanTotalSolid - adonanTargetQty;
        const totalSelisihQty  = totalActualQty - totalTargetQty;

        const formatQty = (val) => {
            const num = Number(val);
            if (isNaN(num)) return '0';
            return Number.isInteger(num) ? num.toString() : num.toFixed(1);
        };

        const formatSelisihQty = (val) => {
            const num = Number(val);
            if (isNaN(num)) return '0';
            const str = Number.isInteger(num) ? num.toString() : num.toFixed(1);
            return num > 0 ? `+${str}` : str;
        };

        const siomayResepMins = formatMins(siomayResepVal);
        const pentolResepMins = formatMins(pentolResepVal);
        const lumpiaResepMins = formatMins(lumpiaResepVal);
        const adonanResepMins = formatMins(adonanResepVal);

        // Selisih = Jumlah Waktu (Input Aktif) - Waktu Resep (Metode 1)
        const siomaySelisihVal = siomayMins - siomayResepVal;
        const pentolSelisihVal = pentolMins - pentolResepVal;
        const lumpiaSelisihVal = lumpiaMins - lumpiaResepVal;
        const adonanSelisihVal = adonanMins - adonanResepVal;

        const formatSelisih = (val) => {
            const num = Number(val);
            if (isNaN(num)) return '0';
            const str = Number.isInteger(num) ? num.toString() : num.toFixed(1);
            return num > 0 ? `+${str}` : str;
        };

        const siomaySelisih = formatSelisih(siomaySelisihVal);
        const pentolSelisih = formatSelisih(pentolSelisihVal);
        const lumpiaSelisih = formatSelisih(lumpiaSelisihVal);
        const adonanSelisih = formatSelisih(adonanSelisihVal);

        const totalDimsumMins = siomayMins + pentolMins + lumpiaMins + adonanMins;
        const totalResepMins = formatMins(totalResepVal);
        const totalSelisihVal = siomaySelisihVal + pentolSelisihVal + lumpiaSelisihVal + adonanSelisihVal;
        const totalSelisih = formatSelisih(totalSelisihVal);

        const durationLabel = selectedMethod === 'METODE_1' ? 'm/durasi input' : 'm/durasi berjalan';

        // Header Row 2 & Row 3 Labels depending on selectedMethod
        const totalRow2Text  = selectedMethod === 'METODE_1' ? `${totalResepMins} menit` : `${formatQty(totalTargetQty)} target`;
        const siomayRow2Text = selectedMethod === 'METODE_1' ? `${siomayResepMins} m/real resep` : `${formatQty(siomayTargetQty)} L target resep`;
        const pentolRow2Text = selectedMethod === 'METODE_1' ? `${pentolResepMins} m/real resep` : `${formatQty(pentolTargetQty)} L target resep`;
        const lumpiaRow2Text = selectedMethod === 'METODE_1' ? `${lumpiaResepMins} m/real resep` : `${formatQty(lumpiaTargetQty)} K target resep`;
        const adonanRow2Text = selectedMethod === 'METODE_1' ? `${adonanResepMins} m/real resep` : `${formatQty(adonanTargetQty)} S target resep`;

        const totalRow3Text  = selectedMethod === 'METODE_1' ? `${totalSelisih} menit` : `${formatSelisihQty(totalSelisihQty)} selisih`;
        const siomayRow3Text = selectedMethod === 'METODE_1' ? `${siomaySelisih} m/loss time` : `${formatSelisihQty(siomaySelisihQty)} L selisih`;
        const pentolRow3Text = selectedMethod === 'METODE_1' ? `${pentolSelisih} m/loss time` : `${formatSelisihQty(pentolSelisihQty)} L selisih`;
        const lumpiaRow3Text = selectedMethod === 'METODE_1' ? `${lumpiaSelisih} m/loss time` : `${formatSelisihQty(lumpiaSelisihQty)} K selisih`;
        const adonanRow3Text = selectedMethod === 'METODE_1' ? `${adonanSelisih} m/loss time` : `${formatSelisihQty(adonanSelisihQty)} S selisih`;

        // Define PrimeReact ColumnGroup Header
        const headerGroup = (
            <ColumnGroup>
                <Row>
                    <Column header="NO" sortable field="index" headerStyle={{ backgroundColor: '#475569', color: '#ffffff', fontWeight: 'bold', width: '3.5rem', textAlign: 'center', borderRight: '1px solid #334155' }} />
                    <Column header="SIOMAY" sortable field="siomay" headerStyle={{ backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '900', textAlign: 'center', letterSpacing: '0.05em' }} />
                    <Column header="PENTOL" sortable field="pentol" headerStyle={{ backgroundColor: '#e11d48', color: '#ffffff', fontWeight: '900', textAlign: 'center', letterSpacing: '0.05em' }} />
                    <Column header="LUMPIA" sortable field="lumpia" headerStyle={{ backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '900', textAlign: 'center', letterSpacing: '0.05em' }} />
                    <Column header="ADONAN PANGSIT" sortable field="adonan" headerStyle={{ backgroundColor: '#9333ea', color: '#ffffff', fontWeight: '900', textAlign: 'center', letterSpacing: '0.05em' }} />
                    <Column header="UNPLANNED STOP" sortable field="downtime" headerStyle={{ backgroundColor: '#b71c1c', color: '#ffffff', fontWeight: '900', textAlign: 'center', letterSpacing: '0.05em' }} />
                </Row>
                <Row>
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{totalDimsumMins} menit</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{siomayMins} {durationLabel}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{pentolMins} {durationLabel}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#ffe4e6', color: '#be123c', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{lumpiaMins} {durationLabel}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#ecfeff', color: '#0891b2', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{adonanMins} {durationLabel}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#fdf4ff', color: '#a21caf', fontWeight: '900', textAlign: 'center' }} />
                    <Column rowSpan={4} header={
                        <div className="flex flex-col items-center justify-center leading-tight py-1">
                            <span className="text-[10px] font-black mt-1">{downtime_minutes} menit</span>
                            <span className="text-[10px] font-semibold mt-0.5">({sortedDowntime.length} kendala)</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#fef9c3', color: '#854d0e', fontWeight: '900', textAlign: 'center' }} />
                </Row>
                <Row>
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{totalRow2Text}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{siomayRow2Text}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{pentolRow2Text}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#ffe4e6', color: '#be123c', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{lumpiaRow2Text}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#ecfeff', color: '#0891b2', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{adonanRow2Text}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#fdf4ff', color: '#a21caf', fontWeight: '900', textAlign: 'center' }} />
                </Row>
                <Row>
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{totalRow3Text}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{siomayRow3Text}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{pentolRow3Text}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#ffe4e6', color: '#be123c', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{lumpiaRow3Text}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#ecfeff', color: '#0891b2', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{adonanRow3Text}</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#fdf4ff', color: '#a21caf', fontWeight: '900', textAlign: 'center' }} />
                </Row>
                <Row>
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{siomayTotalLoyang + pentolTotalLoyang + lumpiaTotalKeranjang + adonanTotalSolid} total</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{siomayTotalLoyang} loyang</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{pentolTotalLoyang} loyang</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#ffe4e6', color: '#be123c', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{lumpiaTotalKeranjang} keranjang</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#ecfeff', color: '#0891b2', fontWeight: '900', textAlign: 'center' }} />
                    <Column header={
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                            <span className="text-[10px] font-black mt-0.5">{adonanTotalSolid} solid</span>
                        </div>
                    } headerStyle={{ backgroundColor: '#fdf4ff', color: '#a21caf', fontWeight: '900', textAlign: 'center' }} />
                </Row>
            </ColumnGroup>
        );

        // Body templates for customized cell rendering
        const indexBodyTemplate = (rowData) => (
            <span className="font-mono font-bold text-slate-400 text-[10px]">{rowData.index}</span>
        );
        const siomayBodyTemplate = (rowData) => (
            <span className="font-mono text-cyan-900 font-bold text-[10px]">{rowData.siomay}</span>
        );
        const pentolBodyTemplate = (rowData) => (
            <span className="font-mono text-rose-900 font-bold text-[10px]">{rowData.pentol}</span>
        );
        const lumpiaBodyTemplate = (rowData) => (
            <span className="font-mono text-teal-900 font-bold text-[10px]">{rowData.lumpia}</span>
        );
        const adonanBodyTemplate = (rowData) => (
            <span className="font-mono text-purple-900 font-bold text-[10px]">{rowData.adonan}</span>
        );
        const downtimeBodyTemplate = (rowData) => (
            <span className="text-rose-700 font-semibold text-left block leading-tight whitespace-pre-line text-[10px]" style={{ lineHeight: '1.2' }}>
                {rowData.downtime}
            </span>
        );

        const cardKeyClass = `machine-card-${mName.replace(/\s+/g, '-').toLowerCase()}`;

        return (
            <div key={mName} className={`bg-white border border-slate-200/80 shadow-xs rounded-3xl overflow-hidden print-machine-block ${cardKeyClass}`}>
                {/* Print-Only Professional Metadata Header Table */}
                <div className="hidden print-machine-header mb-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2">
                        <h4 className="text-sm font-black text-slate-900 m-0 uppercase tracking-wide">
                            FORM REKAP MATRIKS DETEKSI LOSSTIME & LOGSHEET ({mName})
                        </h4>
                        <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 border ${
                            isAnomaly ? 'bg-rose-100 text-rose-900 border-rose-500' :
                            isWarning ? 'bg-amber-100 text-amber-900 border-amber-500' :
                            'bg-emerald-100 text-emerald-900 border-emerald-500'
                        }`}>
                            STATUS: {isAnomaly ? 'ANOMALI' : isWarning ? 'PERHATIAN' : 'NORMAL'}
                        </span>
                    </div>

                    <table className="w-full text-xs border-collapse border border-slate-900 mb-3 print-meta-table">
                        <tbody>
                            <tr>
                                <td className="bg-slate-100 font-bold px-3 py-1.5 border border-slate-900 w-1/6 text-slate-800">Mesin Production</td>
                                <td className="font-extrabold px-3 py-1.5 border border-slate-900 w-1/3 text-slate-900">{mName}</td>
                                <td className="bg-slate-100 font-bold px-3 py-1.5 border border-slate-900 w-1/6 text-slate-800">Berjalan / Target</td>
                                <td className="font-extrabold px-3 py-1.5 border border-slate-900 w-1/3 text-slate-900">{elapsed_shift_minutes}m / {target_shift_minutes} menit</td>
                            </tr>
                            <tr>
                                <td className="bg-slate-100 font-bold px-3 py-1.5 border border-slate-900 text-slate-800">Total Cover</td>
                                <td className="font-extrabold px-3 py-1.5 border border-slate-900 text-emerald-800">{total_recorded_minutes} menit</td>
                                <td className="bg-slate-100 font-bold px-3 py-1.5 border border-slate-900 text-slate-800">Selisih (Loss Time)</td>
                                <td className={`font-extrabold px-3 py-1.5 border border-slate-900 ${unaccounted_minutes > 0 ? 'text-rose-700 font-black' : 'text-slate-900'}`}>
                                    {unaccounted_minutes} menit
                                </td>
                            </tr>
                            <tr>
                                <td className="bg-slate-100 font-bold px-3 py-1.5 border border-slate-900 text-slate-800">Waktu Cetak</td>
                                <td colSpan={3} className="font-extrabold px-3 py-1.5 border border-slate-900 text-slate-900">
                                    <LiveClockFooter className="text-xs font-bold text-slate-900" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Header Card Per Mesin (Web View Only) */}
                <div className="bg-slate-900 text-white px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 web-machine-top-header">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 ${
                            isAnomaly ? 'bg-rose-600 shadow-xs' : isWarning ? 'bg-amber-600 shadow-xs' : 'bg-emerald-600 shadow-xs'
                        }`}>
                            {mName}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-base font-black text-white m-0 tracking-tight">{mName} - Deteksi Losstime</h4>
                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                    isAnomaly ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                                    isWarning ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                }`}>
                                    {isAnomaly ? 'Anomali' : isWarning ? 'Perhatian' : 'Normal'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 flex-wrap">
                        <span>Berjalan: <strong className="text-cyan-300">{elapsed_shift_minutes}m</strong></span>
                        <span className="text-slate-600">•</span>
                        <span>Target: <strong className="text-white">{target_shift_minutes}m</strong></span>
                        <span className="text-slate-600">•</span>
                        <span className="text-emerald-400">Cover: <strong className="text-emerald-300">{total_recorded_minutes}m</strong></span>
                        <span className="text-slate-600">•</span>
                        <span className={unaccounted_minutes > 0 ? 'text-rose-400 font-extrabold' : 'text-slate-300'}>
                            Selisih: <strong className={unaccounted_minutes > 0 ? 'text-rose-300' : 'text-white'}>{unaccounted_minutes}m</strong>
                        </span>
                    </div>
                </div>

                <div className="p-5 space-y-4 web-card-body">
                    {/* KOMPARASI METODE 1 VS METODE 2 PANEL */}
                    {selectedMethod === 'KOMPARASI' && (
                        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 shadow-md border border-slate-700/80 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-amber-400" />
                                    <h5 className="text-xs font-black uppercase tracking-wider text-amber-300 m-0">
                                        📊 Perbandingan Efektivitas Metode (IQF Shift Berjalan: {elapsed_shift_minutes}m)
                                    </h5>
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                                    Evaluasi Metode Paling Efektif
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* METODE 1 */}
                                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                                    <div className="text-[11px] font-black text-slate-300">1. Metode 1 (Standard)</div>
                                    <div className="text-xs font-bold text-cyan-300">Waktu Resep: {formatMins(totalResepValM1)} m</div>
                                    <div className="text-xs font-bold text-rose-300">Loss Time: {formatMins(Math.max(0, elapsed_shift_minutes - totalResepValM1 - downtime_minutes))} m</div>
                                </div>

                                {/* METODE 2 (74) */}
                                <div className={`p-3 rounded-xl border space-y-1 ${activeRefTime === 74 ? 'bg-sky-900/60 border-sky-400' : 'bg-slate-800/80 border-slate-700'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-sky-200">2. Metode 2 (Refrezing 74)</span>
                                        {activeRefTime === 74 && <span className="text-[9px] font-extrabold bg-sky-500 text-white px-1.5 py-0.2 rounded">AKTIF</span>}
                                    </div>
                                    <div className="text-xs font-bold text-sky-300">Waktu Resep: {formatMins(totalResepValM2_74)} m</div>
                                    <div className="text-xs font-bold text-amber-300">Loss Time: {formatMins(Math.max(0, elapsed_shift_minutes - totalResepValM2_74 - downtime_minutes))} m</div>
                                </div>

                                {/* METODE 2 (80) */}
                                <div className={`p-3 rounded-xl border space-y-1 ${activeRefTime === 80 ? 'bg-amber-900/60 border-amber-400' : 'bg-slate-800/80 border-slate-700'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-amber-200">3. Metode 2 (Refrezing 80)</span>
                                        {activeRefTime === 80 && <span className="text-[9px] font-extrabold bg-amber-500 text-white px-1.5 py-0.2 rounded">AKTIF</span>}
                                    </div>
                                    <div className="text-xs font-bold text-amber-300">Waktu Resep: {formatMins(totalResepValM2_80)} m</div>
                                    <div className="text-xs font-bold text-amber-200">Loss Time: {formatMins(Math.max(0, elapsed_shift_minutes - totalResepValM2_80 - downtime_minutes))} m</div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Status Alert Callout */}
                    {isAnomaly ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 web-anomaly-alert">
                            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-xs font-black text-rose-900 m-0 uppercase">
                                    🛑 TERJADI LOSSTIME {mName}: SELISIH {unaccounted_minutes} MENIT
                                </h5>
                                <p className="text-xs text-rose-800 font-medium leading-relaxed mt-0.5 mb-0">
                                    Total input dimsum ({total_active_dimsum_mins}m) + downtime ({downtime_minutes}m) = <strong>{total_recorded_minutes}m</strong> dari <strong>{elapsed_shift_minutes}m</strong> menit berjalan shift (target full shift <strong>{target_shift_minutes}m</strong>).
                                </p>
                            </div>
                        </div>
                    ) : isWarning ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 web-anomaly-alert">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-xs font-black text-amber-900 m-0 uppercase">
                                    ⚠️ PERHATIAN {mName}: SELISIH {unaccounted_minutes} MENIT
                                </h5>
                                <p className="text-xs text-amber-800 font-medium leading-relaxed mt-0.5 mb-0">
                                    Terdapat gap {unaccounted_minutes} menit jam kerja belum ter-log dari {elapsed_shift_minutes}m menit berjalan shift pada {mName}.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 px-4 flex items-center gap-2.5 text-emerald-900 web-anomaly-alert">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <p className="text-xs font-bold m-0">
                                ✅ Jam kerja {mName} ter-cover 100% tanpa losstime ({total_recorded_minutes}m ter-log dari {elapsed_shift_minutes}m menit berjalan shift).
                            </p>
                        </div>
                    )}

                    {/* PRIMEREACT DATATABLE SPREADSHEET LOGSHEET TEMPLATE WITH SORTING & PRINT */}
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                                    📊 Matriks Logsheet Hitung Durasi Input dan Selisih Losstime({mName})
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium italic hidden sm:inline">
                                    • ColumnGroup & Interaktif Sorting
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => handlePrintMachine(mName)}
                                className="h-8 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer border-0 shrink-0 no-print-anomaly"
                                title={`Cetak Form Matriks ${mName}`}
                            >
                                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Cetak Form {mName}</span>
                            </button>
                        </div>

                        <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-2xs bg-white p-1 web-datatable-container">
                            <DataTable
                                value={tableValue}
                                headerColumnGroup={headerGroup}
                                responsiveLayout="scroll"
                                stripedRows
                                showGridlines
                                className="p-datatable-sm text-xs font-sans border-0"
                            >
                                <Column field="index" body={indexBodyTemplate} style={{ width: '3.5rem', textAlign: 'center', backgroundColor: '#f8fafc' }} />
                                <Column field="siomay" body={siomayBodyTemplate} style={{ textAlign: 'center', backgroundColor: 'rgba(224, 242, 254, 0.2)' }} />
                                <Column field="pentol" body={pentolBodyTemplate} style={{ textAlign: 'center', backgroundColor: 'rgba(255, 228, 230, 0.2)' }} />
                                <Column field="lumpia" body={lumpiaBodyTemplate} style={{ textAlign: 'center', backgroundColor: 'rgba(236, 254, 255, 0.2)' }} />
                                <Column field="adonan" body={adonanBodyTemplate} style={{ textAlign: 'center', backgroundColor: 'rgba(253, 244, 255, 0.2)' }} />
                                <Column field="downtime" body={downtimeBodyTemplate} style={{ backgroundColor: 'rgba(254, 242, 242, 0.4)' }} />
                            </DataTable>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const targetPrintMachine = printingMachine || selectedTab;

    return (
        <>
            {/* Render Dedicated Print Portal directly into document.body */}
            {typeof document !== 'undefined' && createPortal(
                <div id="anomaly-print-portal">
                    {/* Official Document Header (Only visible when printing) */}
                    <div className="print-document-header border-b-2 border-slate-900 pb-3 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Logo PPA di kiri */}
                                <img src="/images/ppa.jpg" alt="PPA Logo" className="h-10 w-auto object-contain rounded-sm" />
                                {/* Disusul Logo Gacoan */}
                                <img src="/images/LogoMieGacoan.png" alt="Mie Gacoan Logo" className="h-10 w-auto object-contain" />
                            </div>
                            <div className="text-right leading-tight">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight m-0">PT. PESTA PORA ABADI</h2>
                                <h3 className="text-xs font-bold text-slate-700 m-0">PPA DIGITALIZATION — PRODUCTION SYSTEMS</h3>
                                <p className="text-[10px] font-semibold text-slate-500 m-0 mt-0.5">Form Laporan Deteksi LossTime & Matriks Logsheet IQF</p>
                                <p className="text-[10px] font-extrabold text-slate-800 m-0 mt-1 flex items-center justify-end gap-1">
                                    <span>📅 Cetak:</span>
                                    <LiveClockFooter className="text-[10px] font-black text-slate-900" />
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Machine Cards for Print */}
                    <div className="space-y-6">
                        {(targetPrintMachine === 'ALL' || targetPrintMachine === 'IQF 1') && renderMachineCard('IQF 1', iqf1Data || anomalyData)}
                        {(targetPrintMachine === 'ALL' || targetPrintMachine === 'IQF 2') && renderMachineCard('IQF 2', iqf2Data || anomalyData)}
                    </div>
                </div>,
                document.body
            )}

            <div id="deteksi-anomali-section" className="space-y-4 select-none">
                {/* Stylesheet Print CSS untuk cetak A4 / PDF Admin Profesional */}
                <style>{`
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 8mm;
                        }

                        /* Sembunyikan SEMUA elemen di body KECUALI #anomaly-print-portal */
                        body > *:not(#anomaly-print-portal) {
                            display: none !important;
                        }

                        #anomaly-print-portal {
                            display: block !important;
                            position: static !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: white !important;
                        }

                        .no-print-anomaly {
                            display: none !important;
                        }

                        /* Header Dokumen Resmi Cetak */
                        .print-document-header {
                            display: block !important;
                            margin-bottom: 12px !important;
                        }
                        .print-machine-header {
                            display: block !important;
                        }

                        /* Sembunyikan elemen web card UI saat cetak */
                        .web-machine-top-header { display: none !important; }
                        .web-card-body { padding: 0 !important; }

                        /* Hilangkan Kontainer Box & Rounded Border saat Cetak */
                        .print-machine-block {
                            page-break-inside: auto !important;
                            break-inside: auto !important;
                            margin-bottom: 25px !important;
                            border: none !important;
                            border-radius: 0 !important;
                            box-shadow: none !important;
                            background: transparent !important;
                            padding: 0 !important;
                        }
                        .web-datatable-container {
                            border: none !important;
                            border-radius: 0 !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            background: transparent !important;
                        }
                        .web-anomaly-alert {
                            border-radius: 0 !important;
                            border: 1px solid #cbd5e1 !important;
                            box-shadow: none !important;
                            margin-bottom: 12px !important;
                            page-break-inside: avoid !important;
                        }

                        /* Tabel Grid Rapi Profesional dengan Solid Border */
                        .p-datatable {
                            width: 100% !important;
                            border: 1px solid #0f172a !important;
                            border-radius: 0 !important;
                        }
                        .p-datatable table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                        }
                        .p-datatable .p-datatable-thead {
                            display: table-row-group !important;
                        }
                        .p-datatable .p-datatable-thead > tr > th {
                            border: 1px solid #0f172a !important;
                            border-radius: 0 !important;
                            padding: 3px 6px !important;
                            font-size: 10px !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .p-datatable .p-datatable-tbody > tr {
                            height: 24px !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        .p-datatable .p-datatable-tbody > tr > td {
                            border: 1px solid #334155 !important;
                            border-radius: 0 !important;
                            padding: 0 6px !important;
                            height: 24px !important;
                            font-size: 10px !important;
                            color: #0f172a !important;
                            box-sizing: border-box !important;
                        }
                        .p-datatable-wrapper {
                            overflow: visible !important;
                            border-radius: 0 !important;
                        }
                        .print-meta-table {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }

                    @media screen {
                        #anomaly-print-portal {
                            display: none !important;
                        }
                    }

                    .p-datatable .p-datatable-thead > tr > th {
                        padding: 0.35rem 0.5rem !important;
                        font-size: 10px !important;
                    }
                    .p-datatable .p-datatable-tbody > tr {
                        height: 24px !important;
                    }
                    .p-datatable .p-datatable-tbody > tr > td {
                        height: 24px !important;
                        padding: 0 0.5rem !important;
                        font-size: 10px !important;
                        box-sizing: border-box !important;
                    }
                    .p-column-header-content {
                        justify-content: center !important;
                    }
                `}</style>

                {/* Section Main Header Bar */}
                <div className="bg-white border border-slate-200/80 shadow-xs rounded-3xl overflow-hidden anomaly-main-header">
                    {/* Baris Atas: Judul + Tab + Cetak */}
                    <div className="p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#0284c7] text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 m-0 tracking-tight">{title}</h3>
                                <p className="text-xs font-semibold text-slate-400 m-0">
                                    Analisis durasi input aktif produk, downtime kendala, dan loss time terpisah untuk IQF 1 & IQF 2
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 no-print-anomaly">
                            {/* Tab Switcher */}
                            <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
                                {['ALL', 'IQF 1', 'IQF 2'].map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setSelectedTab(tab)}
                                        className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all border-0 ${
                                            selectedTab === tab
                                                ? 'bg-[#0284c7] text-white shadow-2xs font-extrabold'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {tab === 'ALL' ? 'Semua Mesin' : tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Baris Switcher Metode & Refrezing Time ── */}
                    <div className="no-print-anomaly px-5 py-3 bg-gradient-to-r from-sky-50 via-cyan-50 to-teal-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide mr-1">Metode Evaluasi:</span>

                            <button
                                type="button"
                                onClick={() => setSelectedMethod('METODE_2')}
                                className={`px-3.5 py-1.5 text-xs font-black rounded-full transition-all border cursor-pointer ${
                                    selectedMethod === 'METODE_2'
                                        ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                ⚡ Metode 2 (Real Resep)
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedMethod('METODE_1')}
                                className={`px-3.5 py-1.5 text-xs font-black rounded-full transition-all border cursor-pointer ${
                                    selectedMethod === 'METODE_1'
                                        ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                🧮 Metode 1 (Standard)
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedMethod('KOMPARASI')}
                                className={`px-3.5 py-1.5 text-xs font-black rounded-full transition-all border cursor-pointer ${
                                    selectedMethod === 'KOMPARASI'
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                        : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                                }`}
                            >
                                📊 Perbandingan (Metode 1 vs 2)
                            </button>
                        </div>

                        {/* Refrezing Time Pill Selector (74 vs 80) */}
                        {selectedMethod !== 'METODE_1' && (
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
                                <span className="text-[10px] font-black text-amber-900 uppercase">Acuan Refrezing Time:</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRefTime(74)}
                                        className={`px-2.5 py-0.5 text-[11px] font-black rounded-full transition-all border-0 cursor-pointer ${
                                            (selectedRefTime || refrezingSettings?.metode2_active_refrezing_time || 74) === 74
                                                ? 'bg-amber-500 text-white shadow-2xs'
                                                : 'text-slate-600 hover:bg-amber-100'
                                        }`}
                                    >
                                        74 m
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRefTime(80)}
                                        className={`px-2.5 py-0.5 text-[11px] font-black rounded-full transition-all border-0 cursor-pointer ${
                                            (selectedRefTime || refrezingSettings?.metode2_active_refrezing_time || 74) === 80
                                                ? 'bg-amber-500 text-white shadow-2xs'
                                                : 'text-slate-600 hover:bg-amber-100'
                                        }`}
                                    >
                                        80 m
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Baris Filter Histori (Tanggal, Shift) ── */}
                    <div className="no-print-anomaly px-5 py-3 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Tanggal */}
                            <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 border border-slate-200 shadow-2xs">
                                <CalendarDays className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tanggal:</span>
                                <input
                                    type="date"
                                    value={filterDate}
                                    max={todayStr}
                                    onChange={e => setFilterDate(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-800 border-0 p-0 shadow-none cursor-pointer focus:outline-none focus:ring-0 w-[120px]"
                                />
                            </div>

                            {/* Shift */}
                            <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 border border-slate-200 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Shift:</span>
                                <select
                                    value={filterShift}
                                    onChange={e => setFilterShift(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-800 border-0 p-0 shadow-none cursor-pointer focus:outline-none focus:ring-0"
                                >
                                    <option value="1">Shift 1</option>
                                    <option value="2">Shift 2</option>
                                    <option value="3">Shift 3</option>
                                    <option value="all">Semua Shift</option>
                                </select>
                            </div>

                            {/* Tombol Refresh */}
                            <button
                                type="button"
                                onClick={() => fetchAnomalyData(filterDate, filterShift)}
                                disabled={filterLoading}
                                className="h-8 px-3 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                                title="Muat ulang data"
                            >
                                <RefreshCw className={`w-3 h-3 ${filterLoading ? 'animate-spin' : ''}`} />
                                <span>Muat Ulang</span>
                            </button>

                            {/* Tombol Hari Ini (muncul jika filter bukan default) */}
                            {!isDefaultFilter && (
                                <button
                                    type="button"
                                    onClick={() => { setFilterDate(todayStr); setFilterShift(currentShift); }}
                                    className="h-8 px-3.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer border-0 shadow-xs shrink-0"
                                >
                                    Kembali ke Hari Ini
                                </button>
                            )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 shrink-0">
                            {filterLoading ? (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-full">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Memuat...
                                </span>
                            ) : !isDefaultFilter ? (
                                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                                    Menampilkan data: {new Date(filterDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} — {SHIFT_MAP[filterShift]?.label || 'Semua Shift'}
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Data Hari Ini (Live)
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Grid Display for IQF 1 & IQF 2 */}
                {!filterLoading && (
                <div className="space-y-6">
                    {(selectedTab === 'ALL' || selectedTab === 'IQF 1') && renderMachineCard('IQF 1', iqf1Data || effectiveData)}
                    {(selectedTab === 'ALL' || selectedTab === 'IQF 2') && renderMachineCard('IQF 2', iqf2Data || effectiveData)}
                </div>
                )}

            </div>
        </>
    );
}

