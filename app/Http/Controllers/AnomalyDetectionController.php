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
        $defaultShift = 1;
        if ($currentHour >= 7 && $currentHour < 15) {
            $defaultShift = 1;
        } elseif ($currentHour >= 15 && $currentHour < 23) {
            $defaultShift = 2;
        } else {
            $defaultShift = 3;
        }

        $shift = (int) $request->input('shift', $defaultShift);

        $iqfData = [];
        try {
            $iqfController = new IqfLogsheetController();
            $iqfDashboardReq = new Request([
                'date'  => $queryDate,
                'shift' => $shift,
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
                'date'  => $queryDate,
                'shift' => $shift,
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
        ]);
    }
}
