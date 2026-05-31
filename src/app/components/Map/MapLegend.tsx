'use client';

import { ActiveLayers } from '@/app/hooks/useMap';

interface MapLegendProps {
    activeInfo: string | null;
    toggleInfo: (panel: string) => void;
    activeLayers: ActiveLayers;
    toggleLayer: (layer: keyof ActiveLayers) => void;
    filters: {
        status: string;
        minCapacity: number;
    };
    setFilters: React.Dispatch<
        React.SetStateAction<{
            status: string;
            minCapacity: number;
        }>
    >;
}

export default function MapLegend({
    activeInfo,
    toggleInfo,
    activeLayers,
    toggleLayer,
    filters,
    setFilters,
}: MapLegendProps) {
    return (
        <div
            style={{
                position: 'absolute',
                bottom: '2rem',
                right: '1rem',
                padding: '16px',
                fontSize: '11px',
                lineHeight: '1.4',
                color: '#1e293b',
                pointerEvents: 'auto',
                zIndex: 1,
                width: '280px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}
        >
            {/* Water Stress Legend */}
            <div
                style={{
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow:
                        '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: activeInfo === 'water' ? '4px' : '8px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={activeLayers.water}
                            onChange={() => toggleLayer('water')}
                            style={{ cursor: 'pointer', margin: 0 }}
                        />
                        <div style={{ fontWeight: 900, fontSize: '13px' }}>
                            Water Stress
                        </div>
                    </div>
                    <svg
                        onClick={() => toggleInfo('water')}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            cursor: 'pointer',
                            color:
                                activeInfo === 'water' ? '#0f172a' : '#64748b',
                        }}
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </div>

                {activeInfo === 'water' && (
                    <div
                        style={{
                            fontSize: '10.5px',
                            color: '#475569',
                            marginBottom: '10px',
                            padding: '8px',
                            background: '#f1f5f9',
                            borderRadius: '4px',
                        }}
                    >
                        Ratio of total water demand to available renewable
                        supply. Higher values indicate greater competition among
                        users.
                        <div style={{ marginTop: '4px' }}>
                            <a
                                href="https://www.wri.org/data/aqueduct-global-maps-40-data"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    color: '#2563eb',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                }}
                            >
                                Source: WRI Aqueduct 4.0
                            </a>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        height: '10px',
                        borderRadius: '2px',
                        background:
                            'linear-gradient(to right, #ffff99 0%, #ffe600 25%, #ff9902 50%, #ff1800 75%, #990000 100%)',
                        marginBottom: '4px',
                    }}
                />
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        fontWeight: 600,
                        marginBottom: '1px',
                    }}
                >
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '9px',
                        color: '#64748b',
                        marginBottom: '8px',
                    }}
                >
                    <span>(&lt;10%)</span>
                    <span>(20–40%)</span>
                    <span>(&gt;80%)</span>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <span
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '2px',
                                background: '#808080',
                                opacity: 0.35,
                                flexShrink: 0,
                            }}
                        />
                        <span>Arid and low water use</span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <span
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '2px',
                                background: '#4e4e4e',
                                opacity: 0.35,
                                flexShrink: 0,
                            }}
                        />
                        <span>No data</span>
                    </div>
                </div>
            </div>
            {/* Data Centers Legend */}
            <div
                style={{
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow:
                        '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: activeInfo === 'data' ? '4px' : '8px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={activeLayers.data}
                            onChange={() => toggleLayer('data')}
                            style={{ cursor: 'pointer', margin: 0 }}
                        />
                        <div style={{ fontWeight: 900, fontSize: '13px' }}>
                            Data Centers
                        </div>
                    </div>
                    <svg
                        onClick={() => toggleInfo('data')}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            cursor: 'pointer',
                            color:
                                activeInfo === 'data' ? '#0f172a' : '#64748b',
                        }}
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </div>

                {activeInfo === 'data' && (
                    <div
                        style={{
                            fontSize: '10.5px',
                            color: '#475569',
                            marginBottom: '10px',
                            padding: '8px',
                            background: '#f1f5f9',
                            borderRadius: '4px',
                        }}
                    >
                        Map displays operational and proposed data center
                        facilities. Circle size indicates power capacity where
                        known.
                        <div style={{ marginTop: '4px' }}>
                            <a
                                href="https://www.fractracker.org/2025/07/national-data-centers-tracker/"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    color: '#2563eb',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                }}
                            >
                                Source: U.S. Data Centers Tracker. (2025).
                                Mapped/provided by FracTracker Alliance on
                                FracTracker.org
                            </a>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        marginBottom: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid #e2e8f0',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                        }}
                    >
                        <label
                            style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: '#64748b',
                            }}
                        >
                            Filter by Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    status: e.target.value,
                                }))
                            }
                            style={{
                                fontSize: '11px',
                                padding: '4px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: 'white',
                            }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Operating">Operating</option>
                            <option value="Expanding">Expanding</option>
                            <option value="In Development">
                                In Development
                            </option>
                            <option value="Proposed">Proposed</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <label
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                }}
                            >
                                Min Capacity (MW)
                            </label>
                            <span
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: '#0f172a',
                                }}
                            >
                                {filters.minCapacity > 0
                                    ? `+${filters.minCapacity}`
                                    : 'Any'}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="500"
                            step="10"
                            value={filters.minCapacity}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    minCapacity: Number(e.target.value),
                                }))
                            }
                            style={{ width: '100%', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <span
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#4f46e5',
                                border: '1px solid #fff',
                            }}
                        />
                        <span>Operating</span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <span
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#818cf8',
                                border: '1px solid #fff',
                            }}
                        />
                        <span>In Development</span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <span
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#c7d2fe',
                                border: '1px solid #fff',
                            }}
                        />
                        <span>Proposed</span>
                    </div>
                </div>
            </div>
            {/* Power Plants Legend */}
            <div
                style={{
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow:
                        '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: activeInfo === 'power' ? '4px' : '8px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={activeLayers.power}
                            onChange={() => toggleLayer('power')}
                            style={{ cursor: 'pointer', margin: 0 }}
                        />
                        <div style={{ fontWeight: 900, fontSize: '13px' }}>
                            Power Plants
                        </div>
                    </div>
                    <svg
                        onClick={() => toggleInfo('power')}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            cursor: 'pointer',
                            color:
                                activeInfo === 'power' ? '#0f172a' : '#64748b',
                        }}
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </div>

                {activeInfo === 'power' && (
                    <div
                        style={{
                            fontSize: '10.5px',
                            color: '#475569',
                            marginBottom: '10px',
                            padding: '8px',
                            background: '#f1f5f9',
                            borderRadius: '4px',
                        }}
                    >
                        Operable utility-scale power plants categorized by their
                        primary generation fuel.
                        <div style={{ marginTop: '4px' }}>
                            <a
                                href="https://www.eia.gov/electricity/data/eia860m/"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    color: '#2563eb',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                }}
                            >
                                Source: U.S. Energy Information Administration,
                                Form EIA-860 (September 2025).
                            </a>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px',
                    }}
                >
                    {[
                        { label: 'Biomass', bg: '#2d6a4f', border: '#1b402f' },
                        { label: 'Coal', bg: '#495057', border: '#2c3135' },
                        { label: 'Gas', bg: '#e76f51', border: '#ba5941' },
                        { label: 'Hydro', bg: '#219ebc', border: '#1a7e96' },
                        { label: 'Nuclear', bg: '#7b2d8e', border: '#561f63' },
                        { label: 'Oil', bg: '#774936', border: '#4d2f23' },
                        { label: 'Solar', bg: '#f4a261', border: '#c3824e' },
                        { label: 'Storage', bg: '#0077b6', border: '#005582' },
                        { label: 'Wind', bg: '#48cae4', border: '#32a1b6' },
                        { label: 'Other', bg: '#adb5bd', border: '#797f85' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <span
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: item.bg,
                                    border: `1px solid ${item.border}`,
                                    flexShrink: 0,
                                }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 500 }}>
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
