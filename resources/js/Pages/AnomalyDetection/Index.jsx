import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import AnomalyDetectionSection from '@/components/AnomalyDetectionSection';

export default function Index({ iqfAnomaly, refrezingAnomaly }) {
    return (
        <AppLayout>
            <Head title="Deteksi Anomali & LossTime" />

            <div className="space-y-6 pb-12">
                <AnomalyDetectionSection
                    anomalyData={iqfAnomaly}
                    title="Deteksi LossTime & Anomali Sistem IQF (Mesin 1 & Mesin 2)"
                />

                <AnomalyDetectionSection
                    anomalyData={refrezingAnomaly}
                    title="Deteksi LossTime & Anomali Refrezing System"
                    apiEndpoint="/refrezing/dashboard/stats"
                />
            </div>
        </AppLayout>
    );
}
