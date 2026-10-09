<?php

namespace App\Http\Controllers;

use App\Models\RefrezingSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RefrezingSettingController extends Controller
{
    public function index()
    {
        $settings = RefrezingSetting::getSettings();

        return Inertia::render('RefrezingSetting/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'siomay_multiplier'     => 'required|numeric|min:0.01',
            'siomay_divider_loyang' => 'required|numeric|min:0.01',
            'siomay_divider_min'    => 'required|numeric|min:0.01',
            'pentol_multiplier'     => 'required|numeric|min:0.01',
            'pentol_divider_loyang' => 'required|numeric|min:0.01',
            'pentol_divider_min'    => 'required|numeric|min:0.01',
            'lumpia_multiplier'     => 'required|numeric|min:0.01',
            'adonan_multiplier'     => 'required|numeric|min:0.01',
            'adonan_divider_min'    => 'required|numeric|min:0.01',

            // Validation for Metode 2
            'metode2_active_refrezing_time' => 'required|in:74,80',
            'm2_74_pentol_siomay_min'       => 'required|numeric|min:0.01',
            'm2_74_pentol_siomay_loyang'    => 'required|numeric|min:0.01',
            'm2_74_lumpia_min'              => 'required|numeric|min:0.01',
            'm2_74_adonan_min'              => 'required|numeric|min:0.01',

            'm2_80_pentol_siomay_min'       => 'required|numeric|min:0.01',
            'm2_80_pentol_siomay_loyang'    => 'required|numeric|min:0.01',
            'm2_80_lumpia_min'              => 'required|numeric|min:0.01',
            'm2_80_adonan_min'              => 'required|numeric|min:0.01',
        ]);

        try {
            RefrezingSetting::ensureTableExists();
            $setting = RefrezingSetting::first();
            if (!$setting) {
                RefrezingSetting::create($validated);
            } else {
                $setting->update($validated);
            }

            return redirect()->back()->with('success', 'Setting Refrezing Time berhasil diperbarui!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui setting: ' . $e->getMessage());
        }
    }
}
