'use client';

import { Filters, DcMetrics } from '@/app/hooks/useMap';

// Severity order: Ext.High → High → Med-High → Low-Med → Low → Arid
const CAT_SORT_ORDER = [4, 3, 2, 1, 0, -1];

const STRESS_NAMES: Record<number, string> = {
    4: 'extremely high',
    3: 'high',
    2: 'medium-high',
    1: 'low-medium',
    0: 'low',
    [-1]: 'arid and low-use',
};

function joinList(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function buildBasinPhrase(waterCat: number[]): string {
    const sorted = [...waterCat].sort(
        (a, b) => CAT_SORT_ORDER.indexOf(a) - CAT_SORT_ORDER.indexOf(b)
    );
    const stressCats = sorted.filter((c) => c >= 0);
    const hasArid = sorted.includes(-1);
    const stressNames = stressCats.map((c) => STRESS_NAMES[c]).filter(Boolean);

    if (hasArid && stressNames.length === 0) return 'arid and low-use areas';
    if (!hasArid) return `${joinList(stressNames)} water stress basins`;
    // Mixed: stress + arid — drop "basins" to avoid awkward "basins and areas"
    return `${joinList(stressNames)} water stress and arid and low-use areas`;
}

/** Returns the count phrase ("X operating and Y planned"), dropping zeros.
 *  Returns null when all relevant counts are zero. */
function buildCountPhrase(
    status: Filters['status'],
    operating: number,
    planned: number
): string | null {
    if (status === 'Operating') {
        return operating > 0 ? `${operating.toLocaleString()} operating` : null;
    }
    if (status === 'Planned') {
        return planned > 0 ? `${planned.toLocaleString()} planned` : null;
    }
    if (operating === 0 && planned === 0) return null;
    if (operating === 0) return `${planned.toLocaleString()} planned`;
    if (planned === 0) return `${operating.toLocaleString()} operating`;
    return `${operating.toLocaleString()} operating and ${planned.toLocaleString()} planned`;
}

/** Builds percentage clause for viewport+water mode.
 *  Omits a status if its count is zero or its national denominator was zero (pct=null). */
function buildPctClause(
    status: Filters['status'],
    operating: number,
    planned: number,
    pctOp: number | null,
    pctPl: number | null
): string | null {
    const parts: string[] = [];
    if (status !== 'Planned' && operating > 0 && pctOp !== null) {
        parts.push(`${pctOp}% of operating`);
    }
    if (status !== 'Operating' && planned > 0 && pctPl !== null) {
        parts.push(`${pctPl}% of planned`);
    }
    if (parts.length === 0) return null;
    return `representing ${joinList(parts)} data centers in those basins nationally`;
}

function buildSentence(filters: Filters, metrics: DcMetrics): string {
    const { status, waterCat } = filters;
    const { operating, planned, pctOp, pctPl, isViewport } = metrics;
    const hasWater = waterCat.length > 0;
    const location = isViewport ? 'in this area' : 'in the United States';

    const zeroLabel =
        status === 'Operating'
            ? 'no operating data centers'
            : status === 'Planned'
              ? 'no planned data centers'
              : 'no data centers';

    const countPhrase = buildCountPhrase(status, operating, planned);

    // No water filter
    if (!hasWater) {
        if (!countPhrase) return `There are ${zeroLabel} ${location}.`;
        return `There are ${countPhrase} data centers ${location}.`;
    }

    // Water filter active
    const basinPhrase = buildBasinPhrase(waterCat);

    if (!countPhrase) {
        return `There are ${zeroLabel} in ${basinPhrase} ${location}.`;
    }

    if (!isViewport) {
        // National + water: counts only, no percentage
        return `There are ${countPhrase} data centers in ${basinPhrase} in the United States.`;
    }

    // Viewport + water: append percentage clause if available
    const pctClause = buildPctClause(status, operating, planned, pctOp, pctPl);
    if (pctClause) {
        return `There are ${countPhrase} data centers in ${basinPhrase} in this area, ${pctClause}.`;
    }
    return `There are ${countPhrase} data centers in ${basinPhrase} in this area.`;
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
