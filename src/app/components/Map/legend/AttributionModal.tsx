'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// ── Dataset content ────────────────────────────────────────────────────────────

interface DatasetDef {
    name: string;
    source: string;
    description: string;
    links: { label: string; url: string }[];
}

const DATASETS = {
    dataCenters: {
        name: 'National Data Centers Tracker',
        source: 'FracTracker Alliance',
        description:
            'Data center locations, statuses, and facility information are sourced from the FracTracker Alliance National Data Centers Tracker, a publicly available dataset compiled from FOIA requests, public records, media monitoring, and crowd-sourced submissions. The dataset focuses on the environmental and regulatory dimensions of U.S. data centers and is updated regularly. Facility completeness and attribute accuracy vary — capacity figures, operator names, and location confidence are not uniformly available across all records. If you are aware of a missing or incorrectly represented facility, you can submit a correction directly to FracTracker.',
        links: [
            {
                label: 'Source',
                url: 'https://www.fractracker.org/2025/07/national-data-centers-tracker/',
            },
            {
                label: 'Submit a correction',
                url: 'https://docs.google.com/forms/d/e/1FAIpQLSdxBfd_uyWfFLnhLjbJvDVwb6l_GNzvmLPD_9MIBWqq15Poyg/viewform',
            },
        ],
    },
    waterStress: {
        name: 'Aqueduct Global Maps 4.0',
        source: 'World Resources Institute',
        description:
            'Baseline water stress measures the ratio of total water demand to available renewable surface and groundwater supplies. Water demand includes domestic, industrial, irrigation, and livestock uses. Available renewable water supplies account for the impact of upstream consumptive users and large dams on downstream availability — higher values indicate greater competition among users. Water stress is represented at the hydrological basin level and should not be interpreted as a point measurement at any individual facility. Aqueduct is primarily a prioritization tool and should be augmented by local and regional analysis.',
        links: [
            {
                label: 'Source',
                url: 'https://doi.org/10.46830/writn.23.00061',
            },
            {
                label: 'Dataset',
                url: 'https://www.wri.org/data/aqueduct-global-maps-40-data',
            },
        ],
    },
} satisfies Record<string, DatasetDef>;

export type DatasetKey = keyof typeof DATASETS;

// ── Modal ──────────────────────────────────────────────────────────────────────

function Modal({ dataset, onClose }: { dataset: DatasetDef; onClose: () => void }) {
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
                        marginBottom: '16px',
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: '0 0 3px',
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#0f172a',
                                fontFamily: 'sans-serif',
                            }}
                        >
                            {dataset.name}
                        </h2>
                        <p
                            style={{
                                margin: 0,
                                fontSize: '11px',
                                color: '#64748b',
                                fontWeight: 600,
                                fontFamily: 'sans-serif',
                            }}
                        >
                            {dataset.source}
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

                {/* Divider */}
                <div style={{ borderTop: '1px solid #e2e8f0', marginBottom: '16px' }} />

                {/* Description */}
                <p
                    style={{
                        margin: '0 0 16px',
                        fontSize: '12px',
                        color: '#334155',
                        lineHeight: 1.7,
                        fontFamily: 'sans-serif',
                    }}
                >
                    {dataset.description}
                </p>

                {/* Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dataset.links.map((link) => (
                        <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                fontSize: '11px',
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontFamily: 'sans-serif',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                            }}
                        >
                            {link.label} →
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Info badge + portal ────────────────────────────────────────────────────────

/** Info circle anchored to bottom-right of its nearest `position: relative` container. */
export function AttributionModal({ datasetKey }: { datasetKey: DatasetKey }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const dataset = DATASETS[datasetKey];

    return (
        <>
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

            {isOpen && mounted
                ? createPortal(
                      <Modal dataset={dataset} onClose={() => setIsOpen(false)} />,
                      document.body
                  )
                : null}
        </>
    );
}
