<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class RefrezingSetting extends Model
{
    protected $table = 'refrezing_settings';

    protected $fillable = [
        'siomay_multiplier',
        'siomay_divider_loyang',
        'siomay_divider_min',
        'pentol_multiplier',
        'pentol_divider_loyang',
        'pentol_divider_min',
        'lumpia_multiplier',
        'adonan_multiplier',
        'adonan_divider_min',
        // Metode 2 Settings
        'metode2_active_refrezing_time',
        'm2_74_pentol_siomay_min',
        'm2_74_pentol_siomay_loyang',
        'm2_74_lumpia_min',
        'm2_74_adonan_min',
        'm2_80_pentol_siomay_min',
        'm2_80_pentol_siomay_loyang',
        'm2_80_lumpia_min',
        'm2_80_adonan_min',
    ];

    public static function ensureTableExists()
    {
        try {
            if (!Schema::hasTable('refrezing_settings')) {
                Schema::create('refrezing_settings', function (Blueprint $table) {
                    $table->id();
                    $table->double('siomay_multiplier')->default(290.0);
                    $table->double('siomay_divider_loyang')->default(22.0);
                    $table->double('siomay_divider_min')->default(60.0);

                    $table->double('pentol_multiplier')->default(290.0);
                    $table->double('pentol_divider_loyang')->default(22.0);
                    $table->double('pentol_divider_min')->default(60.0);

                    $table->double('lumpia_multiplier')->default(1.5);

                    $table->double('adonan_multiplier')->default(71.0);
                    $table->double('adonan_divider_min')->default(60.0);

                    // Metode 2 Columns
                    $table->integer('metode2_active_refrezing_time')->default(74);
                    $table->double('m2_74_pentol_siomay_min')->default(4.0);
                    $table->double('m2_74_pentol_siomay_loyang')->default(22.0);
                    $table->double('m2_74_lumpia_min')->default(1.25);
                    $table->double('m2_74_adonan_min')->default(1.25);

                    $table->double('m2_80_pentol_siomay_min')->default(5.0);
                    $table->double('m2_80_pentol_siomay_loyang')->default(22.0);
                    $table->double('m2_80_lumpia_min')->default(1.5);
                    $table->double('m2_80_adonan_min')->default(1.5);

                    $table->timestamps();
                });
            } else {
                Schema::table('refrezing_settings', function (Blueprint $table) {
                    if (!Schema::hasColumn('refrezing_settings', 'metode2_active_refrezing_time')) {
                        $table->integer('metode2_active_refrezing_time')->default(74);
                    }
                    if (!Schema::hasColumn('refrezing_settings', 'm2_74_pentol_siomay_min')) {
                        $table->double('m2_74_pentol_siomay_min')->default(4.0);
                    }
                    if (!Schema::hasColumn('refrezing_settings', 'm2_74_pentol_siomay_loyang')) {
                        $table->double('m2_74_pentol_siomay_loyang')->default(22.0);
                    }
                    if (!Schema::hasColumn('refrezing_settings', 'm2_74_lumpia_min')) {
                        $table->double('m2_74_lumpia_min')->default(1.25);
                    }
                    if (!Schema::hasColumn('refrezing_settings', 'm2_74_adonan_min')) {
                        $table->double('m2_74_adonan_min')->default(1.25);
                    }

                    if (!Schema::hasColumn('refrezing_settings', 'm2_80_pentol_siomay_min')) {
                        $table->double('m2_80_pentol_siomay_min')->default(5.0);
                    }
                    if (!Schema::hasColumn('refrezing_settings', 'm2_80_pentol_siomay_loyang')) {
                        $table->double('m2_80_pentol_siomay_loyang')->default(22.0);
                    }
                    if (!Schema::hasColumn('refrezing_settings', 'm2_80_lumpia_min')) {
                        $table->double('m2_80_lumpia_min')->default(1.5);
                    }
                    if (!Schema::hasColumn('refrezing_settings', 'm2_80_adonan_min')) {
                        $table->double('m2_80_adonan_min')->default(1.5);
                    }
                });
            }
        } catch (\Throwable $e) {
            // Silently swallow or log
        }
    }

    public static function getSettings()
    {
        $default = [
            'siomay_multiplier'     => 290.0,
            'siomay_divider_loyang' => 22.0,
            'siomay_divider_min'    => 60.0,
            'pentol_multiplier'     => 290.0,
            'pentol_divider_loyang' => 22.0,
            'pentol_divider_min'    => 60.0,
            'lumpia_multiplier'     => 1.5,
            'adonan_multiplier'     => 71.0,
            'adonan_divider_min'    => 60.0,

            // Metode 2 Defaults
            'metode2_active_refrezing_time' => 74,
            'm2_74_pentol_siomay_min'       => 4.0,
            'm2_74_pentol_siomay_loyang'    => 22.0,
            'm2_74_lumpia_min'              => 1.25,
            'm2_74_adonan_min'              => 1.25,

            'm2_80_pentol_siomay_min'       => 5.0,
            'm2_80_pentol_siomay_loyang'    => 22.0,
            'm2_80_lumpia_min'              => 1.5,
            'm2_80_adonan_min'              => 1.5,
        ];

        self::ensureTableExists();

        try {
            $setting = self::first();
            if (!$setting) {
                $setting = self::create($default);
            }
            return $setting;
        } catch (\Throwable $e) {
            return (object) $default;
        }
    }
}
