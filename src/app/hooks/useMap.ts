'use client';

import maplibregl from 'maplibre-gl';
import type { FilterSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface DcMetrics {
    operating: number;
    planned: number;
    pctOp: number | null;  // viewport op / national op in same water cats; null outside viewport+water mode
    pctPl: number | null;  // viewport pl / national pl in same water cats; null outside viewport+water mode
    isViewport: boolean;   // true when zoom > 5
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const STYLE_URL = `https://api.maptiler.com/maps/019e9f2e-5504-7b34-af5f-cce6af32d347/style.json?key=${MAPTILER_KEY}`;

const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

export interface ViewportMetrics {
    dataCenterCount: number;
    dataCenterMw: number;
}

export interface ActiveLayers {
    water: boolean;
    data: boolean;
}

export interface Filters {
    status: 'Operating' | 'Planned' | null;
    waterCat: number[]; // empty = show all
}

// Status helpers
const OPERATING_STATUSES = ['Operating', 'Expanding'];
const PLANNED_STATUSES = ['Proposed', 'Approved/Permitted/Under construction'];
const ACTIVE_STATUSES = [...OPERATING_STATUSES, ...PLANNED_STATUSES];

interface DcFeature {
    properties: { status: string; bws_cat: number | null };
    geometry: { type: 'Point'; coordinates: [number, number] };
}

export function useMap() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

    const [viewportMetrics, setViewportMetrics] = useState<ViewportMetrics>({
        dataCenterCount: 0,
        dataCenterMw: 0,
    });

    const [activeLayers, setActiveLayers] = useState<ActiveLayers>({
        water: true,
        data: true,
    });

    const [filters, setFilters] = useState<Filters>({
        status: null,
        waterCat: [],
    });

    const [dcMetrics, setDcMetrics] = useState<DcMetrics>({
        operating: 0,
        planned: 0,
        pctOp: null,
        pctPl: null,
        isViewport: false,
    });
    const [dcMetricsReady, setDcMetricsReady] = useState(false);

    const allFeaturesRef = useRef<DcFeature[]>([]);
    const boundsRef = useRef<maplibregl.LngLatBounds | null>(null);
    const zoomRef = useRef(4); // matches map constructor initial zoom
    const filtersRef = useRef(filters);

    const computeMetrics = useCallback(() => {
        const features = allFeaturesRef.current;
        if (features.length === 0) return;

        const { status, waterCat } = filtersRef.current;
        const zoom = zoomRef.current;
        const bounds = boundsRef.current;
        const isViewport = zoom > 5 && bounds !== null;
        const hasWater = waterCat.length > 0;

        let operating = 0, planned = 0;
        // National counts within selected water cats — denominators for viewport pct
        let natOpInCats = 0, natPlInCats = 0;

        for (const f of features) {
            const s = f.properties.status;
            const bwsCat = f.properties.bws_cat ?? -9999;
            const isOp = OPERATING_STATUSES.includes(s);
            const isPl = PLANNED_STATUSES.includes(s);

            if (!isOp && !isPl) continue;

            // Accumulate national-in-cats denominators (no status filter, no viewport filter)
            if (hasWater && isViewport && waterCat.includes(bwsCat)) {
                if (isOp) natOpInCats++;
                else natPlInCats++;
            }

            // Status filter for main counts
            if (status === 'Operating' && !isOp) continue;
            if (status === 'Planned' && !isPl) continue;

            // Viewport filter
            if (isViewport) {
                const [lng, lat] = f.geometry.coordinates;
                if (!bounds!.contains([lng, lat] as maplibregl.LngLatLike)) continue;
            }

            // Water filter — treat null bws_cat as -9999 (no data)
            if (hasWater && !waterCat.includes(bwsCat)) continue;

            if (isOp) operating++;
            else planned++;
        }

        // Percentages: viewport + water filter only
        // pct = viewport count / national count in same selected water cats
        let pctOp: number | null = null;
        let pctPl: number | null = null;
        if (hasWater && isViewport) {
            pctOp = natOpInCats > 0 ? Math.round((operating / natOpInCats) * 100) : null;
            pctPl = natPlInCats > 0 ? Math.round((planned / natPlInCats) * 100) : null;
        }

        setDcMetrics({ operating, planned, pctOp, pctPl, isViewport });
    }, []);

    // Stable ref so map event handlers always call the latest version
    const computeRef = useRef(computeMetrics);

    const toggleLayer = (layer: keyof ActiveLayers) =>
        setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        filtersRef.current = filters;

        // Fetch GeoJSON — single source of truth for all metrics
        fetch('/data/data-centers.geojson')
            .then((r) => r.json())
            .then((data: { features: DcFeature[] }) => {
                allFeaturesRef.current = data.features;
                computeRef.current();
                setDcMetricsReady(true);
            });

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: STYLE_URL,
            center: [-98.5, 39.8],
            zoom: 4,
            minZoom: 3,
            maxZoom: 24,
        });

        mapRef.current = map;

        const calculateVisibleMetrics = (): void => {
            if (!mapRef.current) return;
            const map = mapRef.current;

            const renderedCenters = map.queryRenderedFeatures({
                layers: ['data-centers-circle'],
            });

            const uniqueCenters = new Map<
                string,
                maplibregl.GeoJSONFeature['properties']
            >();

            renderedCenters.forEach((f) => {
                const id =
                    f.properties.facility_id ?? f.properties.facility_name;
                if (id && !uniqueCenters.has(id)) {
                    uniqueCenters.set(id, f.properties);
                }
            });

            let dcMw = 0;
            uniqueCenters.forEach((props) => {
                if (props.capacity_mw) dcMw += Number(props.capacity_mw);
            });

            setViewportMetrics({
                dataCenterCount: uniqueCenters.size,
                dataCenterMw: dcMw,
            });
        };

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
            // Capture initial bounds for viewport-mode metrics
            boundsRef.current = map.getBounds();

            map.addSource('water-basins', {
                type: 'vector',
                url: 'pmtiles:///tiles/water-basins.pmtiles',
            });

            map.addLayer(
                {
                    id: 'water-basins-fill',
                    type: 'fill',
                    source: 'water-basins',
                    'source-layer': 'water-basins',
                    paint: {
                        'fill-color': [
                            'case',
                            ['==', ['get', 'bws_cat'], 4],
                            '#8B1A1A',
                            ['==', ['get', 'bws_cat'], 3],
                            '#D93320',
                            ['==', ['get', 'bws_cat'], 2],
                            '#D97F20',
                            ['==', ['get', 'bws_cat'], 1],
                            '#D4C030',
                            ['==', ['get', 'bws_cat'], 0],
                            '#C8C47A',
                            ['==', ['get', 'bws_cat'], -1],
                            '#808080',
                            ['==', ['get', 'bws_cat'], -9999],
                            '#4e4e4e',
                            '#4e4e4e',
                        ],
                        'fill-opacity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            5,
                            0.75,
                            8,
                            0.65,
                            11,
                            0.5,
                            13,
                            0.35,
                        ],
                        'fill-opacity-transition': { duration: 600, delay: 0 },
                    },
                },
                'Place labels'
            );

            map.addSource('data-centers', {
                type: 'vector',
                url: 'pmtiles:///tiles/data-centers.pmtiles',
            });

            map.addLayer(
                {
                    id: 'data-centers-circle-shadow',
                    type: 'circle',
                    source: 'data-centers',
                    'source-layer': 'data-centers',
                    paint: {
                        'circle-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            3,
                            [
                                'match',
                                ['get', 'size_rank'],
                                'Mega campus (>1,000 MW)',
                                9.5,
                                'Hyperscale (100-999 MW)',
                                7,
                                'Large (51-99 MW)',
                                5.75,
                                'Medium (11-50 MW)',
                                4.5,
                                'Small (0-10 MW)',
                                3.5,
                                4.1,
                            ],
                            8,
                            [
                                'match',
                                ['get', 'size_rank'],
                                'Mega campus (>1,000 MW)',
                                12,
                                'Hyperscale (100-999 MW)',
                                9,
                                'Large (51-99 MW)',
                                7.5,
                                'Medium (11-50 MW)',
                                6,
                                'Small (0-10 MW)',
                                4.8,
                                5.55,
                            ],
                            12,
                            [
                                'match',
                                ['get', 'size_rank'],
                                'Mega campus (>1,000 MW)',
                                19,
                                'Hyperscale (100-999 MW)',
                                14,
                                'Large (51-99 MW)',
                                11.5,
                                'Medium (11-50 MW)',
                                9,
                                'Small (0-10 MW)',
                                7,
                                8.25,
                            ],
                        ],
                        'circle-color': [
                            'match',
                            ['get', 'status'],
                            ['Expanding', 'Operating'],
                            '#019603',
                            [
                                'Approved/Permitted/Under construction',
                                'Proposed',
                            ],
                            '#4f46e5',
                            '#000000',
                        ],
                        'circle-opacity': [
                            'match',
                            ['get', 'status'],
                            [
                                'Expanding',
                                'Operating',
                                'Approved/Permitted/Under construction',
                                'Proposed',
                            ],
                            1,
                            0,
                        ],
                        'circle-blur': 1,
                    },
                },
                'Place labels'
            );

            map.addLayer(
                {
                    id: 'data-centers-circle',
                    type: 'circle',
                    source: 'data-centers',
                    'source-layer': 'data-centers',
                    paint: {
                        'circle-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            3,
                            [
                                'match',
                                ['get', 'size_rank'],
                                'Mega campus (>1,000 MW)',
                                7.5,
                                'Hyperscale (100-999 MW)',
                                5,
                                'Large (51-99 MW)',
                                3.75,
                                'Medium (11-50 MW)',
                                2.5,
                                'Small (0-10 MW)',
                                1.5,
                                2.1,
                            ],
                            8,
                            [
                                'match',
                                ['get', 'size_rank'],
                                'Mega campus (>1,000 MW)',
                                9,
                                'Hyperscale (100-999 MW)',
                                6,
                                'Large (51-99 MW)',
                                4.5,
                                'Medium (11-50 MW)',
                                3,
                                'Small (0-10 MW)',
                                1.8,
                                2.55,
                            ],
                            12,
                            [
                                'match',
                                ['get', 'size_rank'],
                                'Mega campus (>1,000 MW)',
                                15,
                                'Hyperscale (100-999 MW)',
                                10,
                                'Large (51-99 MW)',
                                7.5,
                                'Medium (11-50 MW)',
                                5,
                                'Small (0-10 MW)',
                                3,
                                4.25,
                            ],
                        ],
                        'circle-color': [
                            'match',
                            ['get', 'status'],
                            ['Expanding', 'Operating'],
                            '#019603',
                            [
                                'Approved/Permitted/Under construction',
                                'Proposed',
                            ],
                            '#4f46e5',
                            '#94a3b8',
                        ],
                        'circle-opacity': [
                            'match',
                            ['get', 'status'],
                            ['Expanding', 'Operating'],
                            1.0,
                            [
                                'Approved/Permitted/Under construction',
                                'Proposed',
                            ],
                            1.0,
                            0.0,
                        ],
                        'circle-stroke-width': [
                            'match',
                            ['get', 'status'],
                            [
                                'Expanding',
                                'Operating',
                                'Approved/Permitted/Under construction',
                                'Proposed',
                            ],
                            1,
                            0,
                        ],
                        'circle-stroke-color': [
                            'match',
                            ['get', 'status'],
                            ['Expanding', 'Operating'],
                            '#064f05',
                            [
                                'Approved/Permitted/Under construction',
                                'Proposed',
                            ],
                            '#3731a0',
                            '#000000',
                        ],
                    },
                },
                'Place labels'
            );

            map.moveLayer('Building', 'data-centers-circle-shadow');
            map.moveLayer('Building top', 'data-centers-circle-shadow');
            map.moveLayer('Other border', 'data-centers-circle-shadow');

            const ACTIVE_STATUSES_FILTER = [
                'Operating',
                'Expanding',
                'Proposed',
                'Approved/Permitted/Under construction',
            ];
            const baseFilter = [
                'in',
                ['get', 'status'],
                ['literal', ACTIVE_STATUSES_FILTER],
            ] as unknown as FilterSpecification;
            map.setFilter('data-centers-circle', baseFilter);
            map.setFilter('data-centers-circle-shadow', baseFilter);

            map.on('moveend', () => {
                calculateVisibleMetrics();
                boundsRef.current = map.getBounds();
                zoomRef.current = map.getZoom();
                computeRef.current();
            });
        });

        const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
        });

        map.on('mouseenter', 'data-centers-circle', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            const f = e.features?.[0];
            if (!f || !f.geometry || f.geometry.type !== 'Point') return;

            const coords = f.geometry.coordinates.slice() as [number, number];
            const p = f.properties;
            const name = p.facility_name ?? 'Unknown Facility';
            let status = p.status ?? 'Unknown Status';
            if (status === 'Approved/Permitted/Under construction') {
                status = 'In Development';
            }

            const mw =
                p.capacity_mw != null
                    ? `${Number(p.capacity_mw).toLocaleString()} MW`
                    : null;
            const rank =
                p.size_rank != null && p.size_rank !== 'Unknown'
                    ? String(p.size_rank).replace(/ \(.*\)$/, '')
                    : null;
            const details = [status, rank, mw].filter(Boolean).join(' · ');

            popup
                .setLngLat(coords)
                .setHTML(
                    `<div style="color: #334155; font-size: 12px; line-height: 1.5; font-family: sans-serif;">` +
                        `<strong style="color: #0f172a; font-size: 13px;">${name}</strong><br/>` +
                        `${details}` +
                        `</div>`
                )
                .addTo(map);
        });

        map.on('mouseleave', 'data-centers-circle', () => {
            map.getCanvas().style.cursor = '';
            popup.remove();
        });

        let roadsAboveWater = false;

        map.on('zoom', () => {
            const zoom = map.getZoom();

            if (zoom >= 10 && !roadsAboveWater) {
                map.moveLayer(
                    'Road network outline',
                    'data-centers-circle-shadow'
                );
                map.moveLayer('Road network', 'data-centers-circle-shadow');
                roadsAboveWater = true;
            } else if (zoom < 10 && roadsAboveWater) {
                map.moveLayer('Road network outline', 'Pier');
                map.moveLayer('Road network', 'Pier');
                roadsAboveWater = false;
            }
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Keep filtersRef in sync + recompute on filter change
    useEffect(() => {
        filtersRef.current = filters;
        computeRef.current();
    }, [filters]);

    // Layer visibility
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        const setVisibility = (layerId: string, visible: boolean) => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(
                    layerId,
                    'visibility',
                    visible ? 'visible' : 'none'
                );
            }
        };

        setVisibility('water-basins-fill', activeLayers.water);
        setVisibility('data-centers-circle', activeLayers.data);
        setVisibility('data-centers-circle-shadow', activeLayers.data);
    }, [activeLayers]);

    // Data center status filter
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;
        if (!map.getLayer('data-centers-circle')) return;

        const ACTIVE_STATUSES_FILTER = [
            'Operating',
            'Expanding',
            'Proposed',
            'Approved/Permitted/Under construction',
        ];

        let filter: FilterSpecification;

        if (filters.status === 'Operating') {
            filter = [
                'in',
                ['get', 'status'],
                ['literal', ['Operating', 'Expanding']],
            ] as unknown as FilterSpecification;
        } else if (filters.status === 'Planned') {
            filter = [
                'in',
                ['get', 'status'],
                [
                    'literal',
                    ['Proposed', 'Approved/Permitted/Under construction'],
                ],
            ] as unknown as FilterSpecification;
        } else {
            filter = [
                'in',
                ['get', 'status'],
                ['literal', ACTIVE_STATUSES_FILTER],
            ] as unknown as FilterSpecification;
        }

        map.setFilter('data-centers-circle', filter);
        map.setFilter('data-centers-circle-shadow', filter);
    }, [filters.status]);

    // Water basin category filter
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;
        if (!map.getLayer('water-basins-fill')) return;

        const selected = filters.waterCat;

        const filter =
            selected.length > 0
                ? ([
                      'in',
                      ['get', 'bws_cat'],
                      ['literal', [...selected, -9999]],
                  ] as unknown as FilterSpecification)
                : null;
        map.setFilter('water-basins-fill', filter);
    }, [filters.waterCat]);

    return {
        containerRef,
        viewportMetrics,
        activeLayers,
        toggleLayer,
        filters,
        setFilters,
        dcMetrics,
        dcMetricsReady,
    };
}
