'use client';

import maplibregl from 'maplibre-gl';
import type { FilterSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { useEffect, useRef, useState } from 'react';

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

type FilterExpression =
    | string
    | number
    | FilterSpecification
    | FilterExpression[];

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

    const toggleLayer = (layer: keyof ActiveLayers) =>
        setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

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
                            0.8,
                            10,
                            0.7,
                            13,
                            0.65,
                            15,
                            0.45,
                        ],
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
                            5,
                            8,
                            10,
                            12,
                            16,
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
                            '#019603',
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
                        'circle-blur': 0.95,
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
                            3,
                            8,
                            7,
                            12,
                            12,
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

            // Exclude Cancelled/Suspended from the start — don't rely on opacity
            const ACTIVE_STATUSES = ['Operating', 'Expanding', 'Proposed', 'Approved/Permitted/Under construction'];
            const baseFilter = ['in', ['get', 'status'], ['literal', ACTIVE_STATUSES]] as unknown as FilterSpecification;
            map.setFilter('data-centers-circle', baseFilter);
            map.setFilter('data-centers-circle-shadow', baseFilter);

            map.on('idle', calculateVisibleMetrics);
            map.on('moveend', calculateVisibleMetrics);
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
                p.size_rank != null ? `Size Rank: ${p.size_rank}` : null;
            const details = [status, mw, rank].filter(Boolean).join(' · ');

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

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

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

        // Base: only the four known active statuses — Cancelled/Suspended never pass
        const ACTIVE_STATUSES = ['Operating', 'Expanding', 'Proposed', 'Approved/Permitted/Under construction'];

        let filter: FilterSpecification;

        if (filters.status === 'Operating') {
            filter = ['in', ['get', 'status'], ['literal', ['Operating', 'Expanding']]] as unknown as FilterSpecification;
        } else if (filters.status === 'Planned') {
            filter = ['in', ['get', 'status'], ['literal', ['Proposed', 'Approved/Permitted/Under construction']]] as unknown as FilterSpecification;
        } else {
            filter = ['in', ['get', 'status'], ['literal', ACTIVE_STATUSES]] as unknown as FilterSpecification;
        }

        map.setFilter('data-centers-circle', filter);
        map.setFilter('data-centers-circle-shadow', filter);
        map.fire('idle');
    }, [filters.status]);

    // Water basin category filter
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;
        if (!map.getLayer('water-basins-fill')) return;

        // Always include Arid (-1) and No Data (-9999) alongside any selected categories
        const filter =
            filters.waterCat.length > 0
                ? (['in', ['get', 'bws_cat'], ['literal', [...filters.waterCat, -1, -9999]]] as unknown as FilterSpecification)
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
    };
}
