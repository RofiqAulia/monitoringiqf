<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

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

        try {
            if (!Schema::hasTable('refrezing_settings')) {
                return (object) $default;
            }

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
