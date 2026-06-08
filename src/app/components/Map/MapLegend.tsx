'use client';

import { ActiveLayers, Filters } from '@/app/hooks/useMap';

interface MapLegendProps {
    activeInfo: string | null;
    toggleInfo: (panel: string) => void;
    activeLayers: ActiveLayers;
    toggleLayer: (layer: keyof ActiveLayers) => void;
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

const WATER_STRESS: {
    label: string;
    sublabel: string;
    color: string;
    textColor: string;
    bwsCat: number;
    clickable: true;
    opacity: 0.9;
}[] = [
    {
        label: 'Ext. High',
        sublabel: '>80%',
        color: '#8B1A1A',
        textColor: '#fff',
        bwsCat: 4,
        clickable: true,
        opacity: 0.9,
    },
    {
        label: 'High',
        sublabel: '40–80%',
        color: '#D93320',
        textColor: '#fff',
        bwsCat: 3,
        clickable: true,
        opacity: 0.9,
    },
    {
        label: 'Med-High',
        sublabel: '20–40%',
        color: '#D97F20',
        textColor: '#fff',
        bwsCat: 2,
        clickable: true,
        opacity: 0.9,
    },
    {
        label: 'Low-Med',
        sublabel: '10–20%',
        color: '#D4C030',
        textColor: '#fff',
        bwsCat: 1,
        clickable: true,
        opacity: 0.9,
    },
    {
        label: 'Low',
        sublabel: '<10%',
        color: '#C8C47A',
        textColor: '#fff',
        bwsCat: 0,
        clickable: true,
        opacity: 0.9,
    },
];

// Arid is now clickable — it filters the map when selected
const WATER_ARID = {
    label: 'Arid',
    sublabel: 'Low use',
    color: '#808080',
    textColor: '#fff',
    bwsCat: -1,
    clickable: true as const,
};

// No Data stays non-clickable / always rendered
const WATER_SPECIAL: {
    label: string;
    sublabel: string;
    color: string;
    textColor: string;
    bwsCat: number;
    clickable: false;
}[] = [
    {
        label: 'ND',
        sublabel: '',
        color: '#4e4e4e',
        textColor: '#fff',
        bwsCat: -9999,
        clickable: false,
    },
];

const ALL_WATER_CHIPS = [...WATER_STRESS, WATER_ARID, ...WATER_SPECIAL];
// All selectable bwsCat values (stress levels 4→0 + Arid -1)
const SELECTABLE_CATS = [...WATER_STRESS.map((w) => w.bwsCat), -1];

const DC_STATUSES: {
    label: 'Operating' | 'Planned';
    color: string;
    textColor: string;
}[] = [
    { label: 'Operating', color: '#019603', textColor: '#fff' },
    { label: 'Planned', color: '#4f46e5', textColor: '#fff' },
];

const CTRL: React.CSSProperties = {
    background: 'transparent',
    borderRadius: '4px',
    overflow: 'hidden',
    color: '#0f172a',
    fontSize: '11px',
    lineHeight: '1.4',
};

function InfoIcon({ active }: { active: boolean }) {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: active ? '#0f172a' : '#94a3b8', flexShrink: 0 }}
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}

function Chip({
    label,
    sublabel,
    color,
    textColor,
    active,
    dimmed,
    clickable,
    first,
    last,
    onClick,
}: {
    label: string;
    sublabel?: string;
    color: string;
    textColor: string;
    active: boolean;
    dimmed: boolean;
    clickable: boolean;
    first?: boolean;
    last?: boolean;
    onClick: () => void;
}) {
    const shadows = active
        ? 'inset 0 2px 5px rgba(0,0,0,0.35)'
        : [
              'inset 0 1px 0 rgba(255,255,255,0.35)',
              'inset 0 -2px 0 rgba(0,0,0,0.25)',
          ].join(', ');

    return (
        <button
            onClick={clickable ? onClick : undefined}
            style={{
                background: color,
                color: textColor,
                padding: sublabel ? '4px 6px 3px' : '5px 6px',
                fontSize: '10px',
                fontWeight: 600,
                lineHeight: 1.2,
                textAlign: 'center',
                borderRadius: first
                    ? '20px 0 0 20px'
                    : last
                      ? '0 20px 20px 0'
                      : '0',
                border: 'none',
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: clickable ? 'pointer' : 'default',
                boxShadow: shadows,
                opacity: clickable && dimmed ? 0.35 : 1,
                transition: clickable
                    ? 'opacity 0.15s, box-shadow 0.15s, transform 0.12s cubic-bezier(.34,1.56,.64,1)'
                    : 'opacity 0.15s',
            }}
            onMouseEnter={
                clickable
                    ? (e) => (e.currentTarget.style.transform = 'scale(1.06)')
                    : undefined
            }
            onMouseLeave={
                clickable
                    ? (e) => (e.currentTarget.style.transform = 'scale(1)')
                    : undefined
            }
            onMouseDown={
                clickable
                    ? (e) => (e.currentTarget.style.transform = 'scale(0.94)')
                    : undefined
            }
            onMouseUp={
                clickable
                    ? (e) => (e.currentTarget.style.transform = 'scale(1)')
                    : undefined
            }
        >
            <span
                style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                }}
            >
                {label}
            </span>
        </button>
    );
}

function ChipRow<T extends string | number>({
    items,
    selected,
    onSelect,
}: {
    items: {
        label: string;
        sublabel?: string;
        color: string;
        textColor: string;
        glowColor?: string;
        value: T;
    }[];
    selected: T | null;
    onSelect: (value: T | null) => void;
}) {
    return (
        <div
            style={{
                display: 'flex',
                width: '100%',
                borderRadius: '20px',
                boxShadow:
                    '0 1px 3px rgba(0,0,0,0.2), inset 0 1px 3px rgba(0,0,0,0.15)',
            }}
        >
            {items.map((item, i) => {
                const isActive = selected === item.value;
                return (
                    <Chip
                        key={String(item.value)}
                        label={item.label}
                        sublabel={item.sublabel}
                        color={item.color}
                        textColor={item.textColor}
                        active={isActive}
                        dimmed={selected !== null && !isActive}
                        clickable
                        first={i === 0}
                        last={i === items.length - 1}
                        onClick={() => onSelect(isActive ? null : item.value)}
                    />
                );
            })}
        </div>
    );
}

function MultiChipRow({
    items,
    selected,
    onSelect,
}: {
    items: typeof ALL_WATER_CHIPS;
    selected: number[];
    onSelect: (values: number[]) => void;
}) {
    return (
        <div style={{ display: 'flex', borderRadius: '20px' }}>
            {items.map((item, i) => {
                const isActive =
                    !item.clickable || selected.includes(item.bwsCat);
                const anySelected = selected.length > 0;
                // Non-clickable chips are never dimmed; clickable ones dim when not active
                const isDimmed =
                    item.clickable &&
                    anySelected &&
                    !selected.includes(item.bwsCat);

                return (
                    <Chip
                        key={item.bwsCat}
                        label={item.label}
                        sublabel={item.sublabel}
                        color={item.color}
                        textColor={item.textColor}
                        active={isActive}
                        dimmed={isDimmed}
                        clickable={item.clickable}
                        first={i === 0}
                        last={i === items.length - 1}
                        onClick={() => {
                            if (!item.clickable) return;
                            let next: number[];
                            if (isActive) {
                                next = selected.filter(
                                    (v) => v !== item.bwsCat
                                );
                            } else {
                                next = [...selected, item.bwsCat];
                            }
                            // All selectable categories chosen → revert to show-all
                            const allChosen = SELECTABLE_CATS.every((c) =>
                                next.includes(c)
                            );
                            onSelect(allChosen ? [] : next);
                        }}
                    />
                );
            })}
        </div>
    );
}

export default function MapLegend({ filters, setFilters }: MapLegendProps) {
    return (
        <div
            style={{
                position: 'absolute',
                bottom: '2rem',
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
            <div style={{ ...CTRL, minWidth: '200px' }}>
                <div style={{ padding: '8px 8px' }}>
                    <ChipRow
                        items={DC_STATUSES.map((s) => ({
                            ...s,
                            value: s.label,
                        }))}
                        selected={filters.status}
                        onSelect={(v) =>
                            setFilters((prev) => ({ ...prev, status: v }))
                        }
                    />
                </div>
            </div>

            {/* ── Water Basin Stress ──────────────────────── */}
            <div style={{ ...CTRL, minWidth: '460px' }}>
                <div style={{ padding: '8px 8px' }}>
                    <MultiChipRow
                        items={ALL_WATER_CHIPS}
                        selected={filters.waterCat}
                        onSelect={(v) =>
                            setFilters((prev) => ({
                                ...prev,
                                waterCat: v,
                            }))
                        }
                    />
                </div>
            </div>
        </div>
    );
}
