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
                    $table->timestamps();
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
