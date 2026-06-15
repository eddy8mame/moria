'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DATASETS = [
    {
        name: 'Aqueduct Water Risk Atlas',
        source: 'World Resources Institute',
        url: '#',
        description:
            'Placeholder — describe the dataset, its spatial resolution, the water stress metric methodology, and known limitations here.',
    },
    {
        name: 'Data Center Database',
        source: 'FracTracker Alliance',
        url: '#',
        description:
            'Placeholder — describe the dataset, collection methodology, coverage, facility status definitions, and any known gaps or limitations here.',
    },
    // Add third dataset section here
];

function Modal({ onClose }: { onClose: () => void }) {
    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15,23,42,0.45)',
                backdropFilter: 'blur(2px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff',
                    borderRadius: '14px',
                    width: '100%',
                    maxWidth: '460px',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    boxShadow:
                        '0 24px 64px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1)',
                    padding: '24px',
                    position: 'relative',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '20px',
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: '0 0 2px',
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#0f172a',
                                fontFamily: 'sans-serif',
                            }}
                        >
                            Data Sources
                        </h2>
                        <p
                            style={{
                                margin: 0,
                                fontSize: '11px',
                                color: '#64748b',
                                fontFamily: 'sans-serif',
                            }}
                        >
                            Attribution and dataset disclosures
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '28px',
                            height: '28px',
                            border: 'none',
                            background: '#f1f5f9',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '16px',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginLeft: '12px',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Dataset sections */}
                {DATASETS.map((ds, i) => (
                    <div
                        key={i}
                        style={{
                            paddingTop: i > 0 ? '18px' : 0,
                            paddingBottom: i < DATASETS.length - 1 ? '18px' : 0,
                            borderTop: i > 0 ? '1px solid #e2e8f0' : 'none',
                        }}
                    >
                        <h3
                            style={{
                                margin: '0 0 2px',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#0f172a',
                                fontFamily: 'sans-serif',
                            }}
                        >
                            {ds.name}
                        </h3>
                        <p
                            style={{
                                margin: '0 0 10px',
                                fontSize: '11px',
                                color: '#64748b',
                                fontWeight: 600,
                                fontFamily: 'sans-serif',
                            }}
                        >
                            {ds.source}
                        </p>
                        <p
                            style={{
                                margin: '0 0 10px',
                                fontSize: '12px',
                                color: '#334155',
                                lineHeight: 1.65,
                                fontFamily: 'sans-serif',
                            }}
                        >
                            {ds.description}
                        </p>
                        <a
                            href={ds.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                fontSize: '11px',
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontFamily: 'sans-serif',
                            }}
                        >
                            View source →
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Self-contained info badge + attribution modal.
 *  Drop inside any `position: relative` container — the circle anchors to its
 *  bottom-right corner. */
export function AttributionModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            {/* Info circle — absolutely positioned at bottom-right of parent */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                title="Data sources & attribution"
                style={{
                    position: 'absolute',
                    bottom: '-6px',
                    right: '-6px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#2563eb',
                    border: '1.5px solid #fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    padding: 0,
                    flexShrink: 0,
                }}
            >
                <span
                    style={{
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        fontStyle: 'italic',
                        lineHeight: 1,
                        userSelect: 'none',
                        fontFamily: 'Georgia, serif',
                        marginTop: '1px',
                    }}
                >
                    i
                </span>
            </button>

            {/* Modal portal */}
            {isOpen && mounted
                ? createPortal(
                      <Modal onClose={() => setIsOpen(false)} />,
                      document.body
                  )
                : null}
        </>
    );
}
