'use client';

import { Chip } from './Chip';
import { ALL_WATER_CHIPS, SELECTABLE_CATS, PILL_SHADOW } from './constants';

export function ChipRow<T extends string | number>({
    items,
    selected,
    onSelect,
    attached,
}: {
    items: {
        label: string;
        sublabel?: string;
        tooltip?: string;
        color: string;
        textColor: string;
        glowColor?: string;
        value: T;
    }[];
    selected: T | null;
    onSelect: (value: T | null) => void;
    attached?: boolean;
}) {
    return (
        <div
            style={{
                display: 'flex',
                width: '100%',
                borderRadius: attached ? '0 20px 20px 0' : '20px',
                boxShadow: PILL_SHADOW,
            }}
        >
            {items.map((item, i) => {
                const isActive = selected === item.value;
                return (
                    <Chip
                        key={String(item.value)}
                        label={item.label}
                        sublabel={item.sublabel}
                        tooltip={item.tooltip}
                        color={item.color}
                        textColor={item.textColor}
                        active={isActive}
                        dimmed={selected !== null && !isActive}
                        clickable
                        first={!attached && i === 0}
                        last={i === items.length - 1}
                        onClick={() => onSelect(isActive ? null : item.value)}
                    />
                );
            })}
        </div>
    );
}

export function MultiChipRow({
    items,
    selected,
    onSelect,
    attached,
}: {
    items: typeof ALL_WATER_CHIPS;
    selected: number[];
    onSelect: (values: number[]) => void;
    attached?: boolean;
}) {
    return (
        <div style={{ display: 'flex', borderRadius: attached ? '0 20px 20px 0' : '20px' }}>
            {items.map((item, i) => {
                const isActive = !item.clickable || selected.includes(item.bwsCat);
                const anySelected = selected.length > 0;
                const isDimmed = item.clickable && anySelected && !selected.includes(item.bwsCat);

                return (
                    <Chip
                        key={item.bwsCat}
                        label={item.label}
                        sublabel={item.sublabel}
                        tooltip={item.tooltip}
                        color={item.color}
                        textColor={item.textColor}
                        active={isActive}
                        dimmed={isDimmed}
                        clickable={item.clickable}
                        first={!attached && i === 0}
                        last={i === items.length - 1}
                        onClick={() => {
                            if (!item.clickable) return;
                            let next: number[];
                            if (isActive) {
                                next = selected.filter((v) => v !== item.bwsCat);
                            } else {
                                next = [...selected, item.bwsCat];
                            }
                            const allChosen = SELECTABLE_CATS.every((c) => next.includes(c));
                            onSelect(allChosen ? [] : next);
                        }}
                    />
                );
            })}
        </div>
    );
}
