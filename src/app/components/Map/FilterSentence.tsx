'use client';

import { Filters, DcTotals } from '@/app/hooks/useMap';

const STRESS_NAMES: Record<number, string> = {
    4: 'extremely high',
    3: 'high',
    2: 'medium-high',
    1: 'low-medium',
    0: 'low',
    [-1]: 'arid',
};

function joinList(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function buildSentence(
    filters: Filters,
    dcTotals: DcTotals,
    filteredDcCounts: DcTotals,
): string {
    const { status, waterCat } = filters;
    const hasWater = waterCat.length > 0;

    // Resolve which counts to use
    const opCount = hasWater ? filteredDcCounts.operating : dcTotals.operating;
    const plCount = hasWater ? filteredDcCounts.planned : dcTotals.planned;

    // Percentage — only shown when a water filter is active
    let pct = '';
    if (hasWater) {
        let numerator: number;
        let denominator: number;
        if (status === null) {
            numerator = filteredDcCounts.operating + filteredDcCounts.planned;
            denominator = dcTotals.operating + dcTotals.planned;
        } else if (status === 'Operating') {
            numerator = filteredDcCounts.operating;
            denominator = dcTotals.operating;
        } else {
            numerator = filteredDcCounts.planned;
            denominator = dcTotals.planned;
        }
        if (denominator > 0) {
            pct = ` (${Math.round((numerator / denominator) * 100)}%)`;
        }
    }

    // Location phrase
    let location = 'across the United States';
    if (hasWater) {
        const stressCats = waterCat.filter(c => c !== -9999);
        const stressNames = stressCats.map(c => STRESS_NAMES[c]).filter(Boolean);
        if (stressCats.length === 1 && stressCats[0] === -1) {
            location = 'in arid areas of the United States';
        } else {
            location = `in ${joinList(stressNames)} water stress areas of the United States`;
        }
    }

    if (status === null) {
        return (
            `There are ${opCount.toLocaleString()} operating and ` +
            `${plCount.toLocaleString()} planned data centers${pct} ${location}.`
        );
    }
    if (status === 'Operating') {
        return `There are ${opCount.toLocaleString()} operating data centers${pct} ${location}.`;
    }
    return `There are ${plCount.toLocaleString()} planned data centers${pct} ${location}.`;
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
    dcTotals,
    dcTotalsReady,
    filteredDcCounts,
    filteredDcCountsReady,
}: {
    filters: Filters;
    dcTotals: DcTotals;
    dcTotalsReady: boolean;
    filteredDcCounts: DcTotals;
    filteredDcCountsReady: boolean;
}) {
    const needsFilteredCounts = filters.waterCat.length > 0;
    const loading = !dcTotalsReady || (needsFilteredCounts && !filteredDcCountsReady);
    const text = loading ? null : buildSentence(filters, dcTotals, filteredDcCounts);

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
            {loading ? (
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
