'use client';

import { useState, useRef, useLayoutEffect } from 'react';
import { PILL_SHADOW } from './constants';

export function LegendRow({
    icon,
    tooltip,
    expanded,
    onToggle,
    infoBadge,
    children,
}: {
    icon: React.ReactNode;
    tooltip: string;
    expanded: boolean;
    onToggle: () => void;
    infoBadge?: React.ReactNode;
    children: React.ReactNode;
}) {
    const [badgeHovered, setBadgeHovered] = useState(false);
    const badgeTooltipRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!badgeHovered || !badgeTooltipRef.current) return;
        const el = badgeTooltipRef.current;
        el.style.left = '50%';
        el.style.right = 'auto';
        el.style.transform = 'translateX(-50%)';
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth - 8) {
            el.style.left = 'auto';
            el.style.right = '0';
            el.style.transform = 'none';
        }
    }, [badgeHovered]);

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
                {badgeHovered && (
                    <div ref={badgeTooltipRef} style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 7px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(15, 23, 42, 0.88)',
                        color: '#fff',
                        borderRadius: '6px',
                        padding: '4px 9px',
                        fontSize: '10px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 100,
                        letterSpacing: '0.02em',
                        lineHeight: 1.4,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    }}>
                        {tooltip}
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '5px solid rgba(15, 23, 42, 0.88)',
                        }} />
                    </div>
                )}
                {infoBadge}
                <button
                    onClick={onToggle}
                    onMouseEnter={() => setBadgeHovered(true)}
                    onMouseLeave={() => setBadgeHovered(false)}
                    style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        flexShrink: 0,
                        background: badgeHovered ? '#e2e8f0' : '#f1f5f9',
                        border: 'none',
                        borderRadius: expanded ? '20px 0 0 20px' : '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: PILL_SHADOW,
                        transition: 'background 0.15s, border-radius 0.2s',
                        zIndex: 1,
                    }}
                >
                    {icon}
                </button>
            </div>
            {expanded && (
                <div style={{ marginLeft: '-1px' }}>
                    {children}
                </div>
            )}
        </div>
    );
}
