'use client';

import { ViewportMetrics } from '@/app/hooks/useMap';

interface MapDashboardProps {
    metrics: ViewportMetrics;
}

export default function MapDashboard({ metrics }: MapDashboardProps) {
    return (
        <div
            style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(4px)',
                borderRadius: '8px',
                padding: '16px',
                width: '300px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                zIndex: 1,
            }}
        >
            <h2
                style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    fontWeight: 900,
                    color: '#0f172a',
                }}
            >
                Regional Resource View
            </h2>
            <p
                style={{
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: '#334155',
                    margin: 0,
                }}
            >
                In the current view, there are{' '}
                <strong>{metrics.dataCenterCount}</strong> data centers demanding an
                estimated <strong>{metrics.dataCenterMw.toLocaleString()} MW</strong> of
                continuous compute power.
            </p>
            <p
                style={{
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: '#334155',
                    margin: '8px 0 0 0',
                }}
            >
                This region is supported by{' '}
                <strong>{metrics.powerPlantCount}</strong> localized power plants
                generating <strong>{metrics.powerPlantMw.toLocaleString()} MW</strong> of
                total capacity.
            </p>
        </div>
    );
}
