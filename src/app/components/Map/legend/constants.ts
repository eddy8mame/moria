export const PILL_SHADOW = '0 1px 3px rgba(0,0,0,0.2), inset 0 1px 3px rgba(0,0,0,0.15)';

export const WATER_STRESS: {
    label: string;
    sublabel: string;
    tooltip: string;
    color: string;
    textColor: string;
    bwsCat: number;
    clickable: true;
    opacity: 0.9;
}[] = [
    { label: 'Ext. High', sublabel: '>80%',   tooltip: 'Extremely High Water Stress', color: '#8B1A1A', textColor: '#fff', bwsCat: 4,  clickable: true, opacity: 0.9 },
    { label: 'High',      sublabel: '40–80%', tooltip: 'High Water Stress',           color: '#D93320', textColor: '#fff', bwsCat: 3,  clickable: true, opacity: 0.9 },
    { label: 'Med-High',  sublabel: '20–40%', tooltip: 'Medium-High Water Stress',    color: '#D97F20', textColor: '#fff', bwsCat: 2,  clickable: true, opacity: 0.9 },
    { label: 'Low-Med',   sublabel: '10–20%', tooltip: 'Low-Medium Water Stress',     color: '#D4C030', textColor: '#fff', bwsCat: 1,  clickable: true, opacity: 0.9 },
    { label: 'Low',       sublabel: '<10%',   tooltip: 'Low Water Stress',            color: '#C8C47A', textColor: '#fff', bwsCat: 0,  clickable: true, opacity: 0.9 },
];

export const WATER_ARID = {
    label: 'Arid',
    sublabel: 'Low use',
    tooltip: 'Arid and Low-Use Areas',
    color: '#808080',
    textColor: '#fff',
    bwsCat: -1,
    clickable: true as const,
};

// No Data stays non-clickable / always rendered
export const WATER_SPECIAL: {
    label: string;
    sublabel: string;
    tooltip: string;
    color: string;
    textColor: string;
    bwsCat: number;
    clickable: false;
}[] = [
    { label: 'ND', sublabel: '', tooltip: 'No Data', color: '#4e4e4e', textColor: '#fff', bwsCat: -9999, clickable: false },
];

export const ALL_WATER_CHIPS = [...WATER_STRESS, WATER_ARID, ...WATER_SPECIAL];
// All selectable bwsCat values (stress levels 4→0 + Arid -1)
export const SELECTABLE_CATS = [...WATER_STRESS.map((w) => w.bwsCat), -1];

export const DC_STATUSES: {
    label: 'Operating' | 'Planned';
    tooltip: string;
    color: string;
    textColor: string;
}[] = [
    { label: 'Operating', tooltip: 'Operating and Expanding Centers', color: '#019603', textColor: '#fff' },
    { label: 'Planned',   tooltip: 'Proposed and Approved Centers',   color: '#4f46e5', textColor: '#fff' },
];
