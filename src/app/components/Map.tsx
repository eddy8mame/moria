'use client';

import { useState } from 'react';
import { useMap } from '@/app/hooks/useMap';
import MapLegend from './Map/MapLegend';
import MapDashboard from './Map/MapDashboard';

export default function MapComponent() {
    const { containerRef, viewportMetrics } = useMap();
    const [activeInfo, setActiveInfo] = useState<string | null>(null);

    const toggleInfo = (panel: string): void => {
        setActiveInfo(activeInfo === panel ? null : panel);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
            }}
        >
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            {/* Narrative Dashboard Panel */}
            <MapDashboard metrics={viewportMetrics} />

            {/* Interactive Legend */}
            <MapLegend activeInfo={activeInfo} toggleInfo={toggleInfo} />
        </div>
    );
}
