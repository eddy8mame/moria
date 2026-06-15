'use client';

import { useState } from 'react';
import { ActiveLayers, Filters } from '@/app/hooks/useMap';
import { DC_STATUSES, ALL_WATER_CHIPS } from './legend/constants';
import { ServerIcon, DropIcon } from './legend/icons';
import { LegendRow } from './legend/LegendRow';
import { ChipRow, MultiChipRow } from './legend/ChipRow';

interface MapLegendProps {
    activeInfo: string | null;
    toggleInfo: (panel: string) => void;
    activeLayers: ActiveLayers;
    toggleLayer: (layer: keyof ActiveLayers) => void;
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

export default function MapLegend({ filters, setFilters }: MapLegendProps) {
    const [dcExpanded, setDcExpanded] = useState(true);
    const [waterExpanded, setWaterExpanded] = useState(true);

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '3rem',
                right: '1rem',
                pointerEvents: 'auto',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'flex-end',
            }}
        >
            {/* ── Data Centers ────────────────────────────── */}
            <LegendRow
                icon={<ServerIcon />}
                tooltip="Data Center Status"
                expanded={dcExpanded}
                onToggle={() => setDcExpanded((p) => !p)}
            >
                <div style={{ padding: '0 8px 0 0' }}>
                    <ChipRow
                        attached
                        items={DC_STATUSES.map((s) => ({ ...s, value: s.label }))}
                        selected={filters.status}
                        onSelect={(v) => setFilters((prev) => ({ ...prev, status: v }))}
                    />
                </div>
            </LegendRow>

            {/* ── Water Basin Stress ──────────────────────── */}
            <LegendRow
                icon={<DropIcon />}
                tooltip="Water Stress"
                expanded={waterExpanded}
                onToggle={() => setWaterExpanded((p) => !p)}
            >
                <div style={{ padding: '0 8px 0 0' }}>
                    <MultiChipRow
                        attached
                        items={ALL_WATER_CHIPS}
                        selected={filters.waterCat}
                        onSelect={(v) => setFilters((prev) => ({ ...prev, waterCat: v }))}
                    />
                </div>
            </LegendRow>
        </div>
    );
}
