'use client';

import { useState } from 'react';
import { useMap } from '@/app/hooks/useMap';
import MapLegend from './Map/MapLegend';
import FilterSentence from './Map/FilterSentence';

export default function MapComponent() {
    const { containerRef, activeLayers, toggleLayer, filters, setFilters, dcMetrics, dcMetricsReady } = useMap();
    const [activeInfo, setActiveInfo] = useState<string | null>(null);

    const toggleInfo = (panel: string) =>
        setActiveInfo((prev) => (prev === panel ? null : panel));

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
            <FilterSentence
                filters={filters}
                dcMetrics={dcMetrics}
                dcMetricsReady={dcMetricsReady}
            />
            <MapLegend
                activeInfo={activeInfo}
                toggleInfo={toggleInfo}
                activeLayers={activeLayers}
                toggleLayer={toggleLayer}
                filters={filters}
                setFilters={setFilters}
            />
        </div>
    );
}
