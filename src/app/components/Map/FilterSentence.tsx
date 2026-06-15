'use client';

import { Filters, DcMetrics } from '@/app/hooks/useMap';

const STRESS_NAMES: Record<number, string> = {
    4: 'extremely high',
    3: 'high',
    2: 'medium-high',
    1: 'low-medium',
    0: 'low',
};

function joinList(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function buildBasinPhrase(waterCat: number[]): string {
    const stressLevels = waterCat.filter((c) => c >= 0);
    const hasArid = waterCat.includes(-1);
    const stressNames = stressLevels.map((c) => STRESS_NAMES[c]).filter(Boolean);

    if (hasArid && stressNames.length === 0) return 'arid and low-use basins';
    if (!hasArid) return `${joinList(stressNames)} water stress basins`;
    return `${joinList(stressNames)} water stress and arid basins`;
}

function buildSentence(filters: Filters, metrics: DcMetrics): string {
    const { status, waterCat } = filters;
    const { operating, planned, pct, isViewport } = metrics;
    const hasWater = waterCat.length > 0;

    const opStr = operating.toLocaleString();
    const plStr = planned.toLocaleString();

    // Count phrase
    let countPhrase: string;
    if (status === null) {
        countPhrase = `${opStr} operating and ${plStr} planned data centers`;
    } else if (status === 'Operating') {
        countPhrase = `${opStr} operating data centers`;
    } else {
        countPhrase = `${plStr} planned data centers`;
    }

    // No water filter
    if (!hasWater) {
        const location = isViewport ? 'in this area' : 'in the United States';
        return `There are ${countPhrase} ${location}.`;
    }

    // Water filter active
    const basinPhrase = buildBasinPhrase(waterCat);

    if (isViewport) {
        return `${countPhrase} are located in ${basinPhrase} in this area.`;
    }

    // National + water + percentage
    const denomLabel =
        status === null
            ? 'data centers'
            : status === 'Operating'
              ? 'operating data centers'
              : 'planned data centers';

    const pctClause =
        pct !== null ? `, representing ${pct}% of ${denomLabel} in the United States` : '';

    return `${countPhrase} are located in ${basinPhrase}${pctClause}.`;
}

function SkeletonPill() {
    return (
        <>
            <style>{`
                @keyframes fs-shimmer {
                    0%   { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
            `}</style>
            <div style={{
                height: '32px',
                width: '460px',
                borderRadius: '20px',
                background: 'linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 65%)',
                backgroundSize: '200% 100%',
                animation: 'fs-shimmer 1.4s ease-in-out infinite',
            }} />
        </>
    );
}

export default function FilterSentence({
    filters,
    dcMetrics,
    dcMetricsReady,
}: {
    filters: Filters;
    dcMetrics: DcMetrics;
    dcMetricsReady: boolean;
}) {
    const text = dcMetricsReady ? buildSentence(filters, dcMetrics) : null;

    return (
        <div
            style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                zIndex: 1,
                pointerEvents: 'none',
            }}
        >
            {!dcMetricsReady ? (
                <SkeletonPill />
            ) : (
                <div
                    style={{
                        background: 'rgba(255,255,255,0.96)',
                        borderRadius: '20px',
                        boxShadow:
                            '0 1px 3px rgba(0,0,0,0.2), ' +
                            'inset 0 1px 0 rgba(255,255,255,0.9), ' +
                            'inset 0 -1px 0 rgba(0,0,0,0.08)',
                        padding: '7px 16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#333333',
                        lineHeight: 1.45,
                        letterSpacing: '0.01em',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {text}
                </div>
            )}
        </div>
    );
}
