<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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

    public function down(): void
    {
        Schema::dropIfExists('refrezing_settings');
    }
};
