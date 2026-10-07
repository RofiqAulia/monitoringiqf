<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class AnomalyDetectionController extends Controller
{
    public function index(Request $request)
    {
        $todayWib = Carbon::now('Asia/Jakarta')->format('Y-m-d');
        $queryDate = $request->input('date', $todayWib);

        $nowWib = Carbon::now('Asia/Jakarta');
        $currentHour = (int) $nowWib->format('H');
        // Selaraskan boundary deteksi shift dengan shift map: 8/16/00
        if ($currentHour >= 8 && $currentHour < 16) {
            $defaultShift = 1;
        } elseif ($currentHour >= 16 && $currentHour <= 23) {
            $defaultShift = 2;
        } else {
            // 00:00 - 07:59 = Shift 3
            $defaultShift = 3;
        }

        $shift = (int) $request->input('shift', $defaultShift);

        // Mapping shift ke time range yang benar
        $shiftTimeMap = [
            1 => ['from' => '08:00', 'to' => '16:00'],
            2 => ['from' => '16:00', 'to' => '00:00'],
            3 => ['from' => '00:00', 'to' => '08:00'],
        ];
        $shiftTimes = $shiftTimeMap[$shift] ?? $shiftTimeMap[1];

        $iqfData = [];
        try {
            $iqfController = new IqfLogsheetController();
            $iqfDashboardReq = new Request([
                'date'      => $queryDate,
                'shift'     => $shift,
                'from_time' => $shiftTimes['from'],
                'to_time'   => $shiftTimes['to'],
            ]);

            $iqfRes = $iqfController->dashboardStats($iqfDashboardReq);
            $iqfData = $iqfRes->getData(true);
        } catch (\Throwable $e) {
            Log::error('IQF Anomaly error: ' . $e->getMessage());
        }

        $refrezingData = [];
        try {
            $refrezingController = new RefrezingController();
            $refrezingDashboardReq = new Request([
                'date'      => $queryDate,
                'shift'     => $shift,
                'from_time' => $shiftTimes['from'],
                'to_time'   => $shiftTimes['to'],
            ]);

            $refrezingRes = $refrezingController->dashboardStats($refrezingDashboardReq);
            $refrezingData = $refrezingRes->getData(true);
        } catch (\Throwable $e) {
            Log::error('Refrezing Anomaly error: ' . $e->getMessage());
        }

        return Inertia::render('AnomalyDetection/Index', [
            'filters' => [
                'date'  => $queryDate,
                'shift' => $shift,
            ],
            'iqfAnomaly' => $iqfData['anomaly_detection'] ?? null,
            'iqfAnomalyByMachine' => $iqfData['anomaly_detection_by_machine'] ?? null,
            'refrezingAnomaly' => $refrezingData['anomaly_detection'] ?? null,
            'iqfUnplannedStops' => $iqfData['unplanned_stops'] ?? [],
            'refrezingUnplannedStops' => $refrezingData['unplanned_stops'] ?? [],
            'refrezingSettings' => \App\Models\RefrezingSetting::getSettings(),
        ]);
    }
}
