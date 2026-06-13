'use client';

import { useState, useRef, useLayoutEffect } from 'react';

export function Chip({
    label,
    sublabel,
    tooltip,
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
    tooltip?: string;
    color: string;
    textColor: string;
    active: boolean;
    dimmed: boolean;
    clickable: boolean;
    first?: boolean;
    last?: boolean;
    onClick: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!hovered || !tooltipRef.current) return;
        const el = tooltipRef.current;
        el.style.left = '50%';
        el.style.right = 'auto';
        el.style.transform = 'translateX(-50%)';
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth - 8) {
            el.style.left = 'auto';
            el.style.right = '0';
            el.style.transform = 'none';
        }
    }, [hovered]);

    const shadows = active
        ? 'inset 0 2px 5px rgba(0,0,0,0.35)'
        : [
              'inset 0 1px 0 rgba(255,255,255,0.35)',
              'inset 0 -2px 0 rgba(0,0,0,0.25)',
          ].join(', ');

    return (
        <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex' }}>
            {hovered && tooltip && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 7px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(255, 255, 255, 100)',
                        color: '#000',
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
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <span style={{
                        fontWeight:600
                    }}>
                    {tooltip}
                    </span>
                    {' '}
                    <span>
                    {sublabel && (`(${sublabel})`)}
                    </span>
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '5px solid rgba(255, 255, 255, 100)',
                        }}
                    />
                </div>
            )}
            <button
                onClick={clickable ? onClick : undefined}
                style={{
                    background: color,
                    color: textColor,
                    padding: '0 8px',
                    minHeight: '32px',
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
                    minWidth: 65,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: clickable ? 'pointer' : 'default',
                    boxShadow: shadows,
                    opacity: clickable && dimmed ? 0.95 : 1,
                    transition: clickable
                        ? 'opacity 0.15s, box-shadow 0.15s, transform 0.1s cubic-bezier(.34,1.56,.64,1)'
                        : 'opacity 0.15s',
                }}
                onMouseEnter={(e) => {
                    setHovered(true);
                    if (clickable) e.currentTarget.style.transform = 'scale(1.03)';
                }}
                onMouseLeave={(e) => {
                    setHovered(false);
                    if (clickable) e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseDown={
                    clickable
                        ? (e) => (e.currentTarget.style.transform = 'scale(0.999)')
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
        </div>
    );
}
