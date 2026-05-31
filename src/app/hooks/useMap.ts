'use client';

import maplibregl from 'maplibre-gl';
import type { FilterSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { useEffect, useRef, useState } from 'react';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const STYLE_URL = `https://api.maptiler.com/maps/dataviz-v4/style.json?key=${MAPTILER_KEY}`;

const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

export interface ViewportMetrics {
    dataCenterCount: number;
    dataCenterMw: number;
    powerPlantCount: number;
    powerPlantMw: number;
}

export interface ActiveLayers {
    water: boolean;
    power: boolean;
    data: boolean;
}

type FilterExpression =
    | string
    | number
    | FilterSpecification
    | FilterExpression[];

// EIA fuel type codes for tooltip display
const EIA_FUEL_DICTIONARY: Record<string, string> = {
    LFG: 'Landfill Gas',
    WDS: 'Wood Solids',
    OBG: 'Other Biomass Gas',
    BLQ: 'Black Liquor',
    MSW: 'Municipal Solid Waste',
    AB: 'Agricultural Byproducts',
    OBL: 'Other Biomass Liquids',
    OBS: 'Other Biomass Solids',
    WDL: 'Wood Liquids',
    BIT: 'Bituminous Coal',
    SUB: 'Subbituminous Coal',
    LIG: 'Lignite',
    WC: 'Waste Coal',
    SGC: 'Coal-Derived Gas',
    RC: 'Refined Coal',
    NG: 'Natural Gas',
    OG: 'Other Gas',
    BFG: 'Blast Furnace Gas',
    WAT: 'Hydroelectric',
    NUC: 'Nuclear',
    DFO: 'Distillate Fuel Oil',
    JF: 'Jet Fuel',
    KER: 'Kerosene',
    PC: 'Petroleum Coke',
    RFO: 'Residual Fuel Oil',
    WO: 'Waste Oil',
    SUN: 'Solar',
    MWH: 'Energy Storage',
    WND: 'Wind',
    GEO: 'Geothermal',
    WH: 'Waste Heat',
    PUR: 'Purchased Steam',
    OTH: 'Other',
    H2: 'Hydrogen',
};

export function useMap() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [viewportMetrics, setViewportMetrics] = useState<ViewportMetrics>({
        dataCenterCount: 0,
        dataCenterMw: 0,
        powerPlantCount: 0,
        powerPlantMw: 0,
    });

    const [activeLayers, setActiveLayers] = useState<ActiveLayers>({
        water: true,
        power: true,
        data: true,
    });

    const [filters, setFilters] = useState({
        status: 'all',
        minCapacity: 0,
    });

    const toggleLayer = (layer: keyof typeof activeLayers) => {
        setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
    };

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: STYLE_URL,
            center: [-98.5, 39.8],
            zoom: 4,
            minZoom: 3,
            maxZoom: 14,
        });

        mapRef.current = map;

        const calculateVisibleMetrics = (): void => {
            if (!mapRef.current) return;
            const map = mapRef.current;

            const renderedCenters = map.queryRenderedFeatures({
                layers: ['data-centers-circle'],
            });
            const renderedPlants = map.queryRenderedFeatures({
                layers: ['power-plants-circle'],
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

            const uniquePlants = new Map<
                string,
                maplibregl.GeoJSONFeature['properties']
            >();
            
            renderedPlants.forEach((f) => {
                const id = f.properties.plant_code ?? f.properties.plant_name;
                if (id && !uniquePlants.has(id)) {
                    uniquePlants.set(id, f.properties);
                }
            });

            let dcMw = 0;
            uniqueCenters.forEach((props) => {
                if (props.capacity_mw) dcMw += Number(props.capacity_mw);
            });

            let ppMw = 0;
            uniquePlants.forEach((props) => {
                if (props.nameplate_capacity_mw)
                    ppMw += Number(props.nameplate_capacity_mw);
            });

            setViewportMetrics({
                dataCenterCount: uniqueCenters.size,
                dataCenterMw: dcMw,
                powerPlantCount: uniquePlants.size,
                powerPlantMw: ppMw,
            });
        };

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
            // map.addSource("counties", {
            //   type: "vector",
            //   url: "pmtiles:///tiles/counties.pmtiles",
            // });

            // map.addLayer({
            //   id: "counties-fill",
            //   type: "fill",
            //   source: "counties",
            //   "source-layer": "counties",
            //   paint: {
            //     "fill-color": "#334155",
            //     "fill-opacity": 0.15,
            //   },
            //   minzoom: 6,
            // });

            // map.addLayer({
            //   id: "counties-line",
            //   type: "line",
            //   source: "counties",
            //   "source-layer": "counties",
            //   paint: {
            //     "line-color": "#64748b",
            //     "line-width": 0.5,
            //   },
            //   minzoom: 6,
            // });

            map.addSource('water-basins', {
                type: 'vector',
                url: 'pmtiles:///tiles/water-basins.pmtiles',
            });

            map.addLayer({
                id: 'water-basins-fill',
                type: 'fill',
                source: 'water-basins',
                'source-layer': 'water-basins',
                paint: {
                    'fill-color': [
                        'case',
                        ['==', ['get', 'bws_cat'], 4],
                        '#990000',
                        ['==', ['get', 'bws_cat'], 3],
                        '#ff1800',
                        ['==', ['get', 'bws_cat'], 2],
                        '#ff9902',
                        ['==', ['get', 'bws_cat'], 1],
                        '#ffe600',
                        ['==', ['get', 'bws_cat'], 0],
                        '#ffff99',
                        ['==', ['get', 'bws_cat'], -1],
                        '#808080',
                        ['==', ['get', 'bws_cat'], -9999],
                        '#4e4e4e',
                        '#4e4e4e',
                    ],
                    'fill-opacity': 0.35,
                },
            });

            map.addSource('power-plants', {
                type: 'vector',
                url: 'pmtiles:///tiles/power-plants.pmtiles',
            });

            map.addLayer({
                id: 'power-plants-circle',
                type: 'circle',
                source: 'power-plants',
                'source-layer': 'power-plants',
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['get', 'nameplate_capacity_mw'],
                        0,
                        2,
                        500,
                        6,
                        2000,
                        12,
                        10000,
                        20,
                    ],
                    'circle-color': [
                        'match',
                        ['get', 'primary_fuel'],
                        [
                            'LFG',
                            'WDS',
                            'OBG',
                            'BLQ',
                            'MSW',
                            'AB',
                            'OBL',
                            'OBS',
                            'WDL',
                        ],
                        '#2d6a4f',
                        ['BIT', 'SUB', 'LIG', 'WC', 'SGC', 'RC'],
                        '#495057',
                        ['NG', 'OG', 'BFG'],
                        '#e76f51',
                        ['WAT'],
                        '#219ebc',
                        ['NUC'],
                        '#7b2d8e',
                        ['DFO', 'JF', 'KER', 'PC', 'RFO', 'WO'],
                        '#774936',
                        ['SUN'],
                        '#f4a261',
                        ['MWH'],
                        '#0077b6',
                        ['WND'],
                        '#48cae4',
                        '#adb5bd',
                    ],
                    'circle-opacity': 1.0,
                    'circle-stroke-width': 0.5,
                    'circle-stroke-color': [
                        'match',
                        ['get', 'primary_fuel'],
                        [
                            'LFG',
                            'WDS',
                            'OBG',
                            'BLQ',
                            'MSW',
                            'AB',
                            'OBL',
                            'OBS',
                            'WDL',
                        ],
                        '#1b402f',
                        ['BIT', 'SUB', 'LIG', 'WC', 'SGC', 'RC'],
                        '#2c3135',
                        ['NG', 'OG', 'BFG'],
                        '#ba5941',
                        ['WAT'],
                        '#1a7e96',
                        ['NUC'],
                        '#561f63',
                        ['DFO', 'JF', 'KER', 'PC', 'RFO', 'WO'],
                        '#4d2f23',
                        ['SUN'],
                        '#c3824e',
                        ['MWH'],
                        '#005582',
                        ['WND'],
                        '#32a1b6',
                        '#797f85',
                    ],
                },
                minzoom: 5,
            });

            map.addSource('data-centers', {
                type: 'vector',
                url: 'pmtiles:///tiles/data-centers.pmtiles',
            });

            map.addLayer({
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
                        'Expanding',
                        '#312e81',
                        'Operating',
                        '#4f46e5',
                        'Approved/Permitted/Under construction',
                        '#818cf8',
                        'Proposed',
                        '#c7d2fe',
                        'Suspended',
                        '#d4d4d8',
                        'Cancelled',
                        '#71717a',
                        '#94a3b8',
                    ],
                    'circle-opacity': [
                        'match',
                        ['get', 'status'],
                        'Expanding',
                        1.0,
                        'Operating',
                        0.95,
                        'Approved/Permitted/Under construction',
                        0.8,
                        'Proposed',
                        0.6,
                        'Suspended',
                        0.5,
                        'Cancelled',
                        0.3,
                        0.5,
                    ],
                    'circle-stroke-width': 2.0,
                    'circle-stroke-color': '#ffffff',
                },
            });

            map.on('idle', calculateVisibleMetrics);
            map.on('moveend', calculateVisibleMetrics);
        });

        const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
        });

        map.on('mouseenter', 'power-plants-circle', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            const f = e.features?.[0];
            if (!f || !f.geometry || f.geometry.type !== 'Point') return;

            const coords = f.geometry.coordinates.slice() as [number, number];
            const p = f.properties;
            const mw = p.nameplate_capacity_mw
                ? `${Number(p.nameplate_capacity_mw).toLocaleString()} MW`
                : 'Unknown capacity';

            const rawFuel = p.primary_fuel;
            const fuelDisplay = rawFuel
                ? (EIA_FUEL_DICTIONARY[rawFuel] ?? rawFuel)
                : 'Unknown fuel';

            popup
                .setLngLat(coords)
                .setHTML(
                    `<div style="color: #334155; font-size: 12px; line-height: 1.5; font-family: sans-serif;">` +
                        `<strong style="color: #0f172a; font-size: 13px;">${p.plant_name ?? 'Unknown'}</strong><br/>` +
                        `${fuelDisplay} · ${mw}` +
                        `</div>`
                )
                .addTo(map);
        });

        map.on('mouseleave', 'power-plants-circle', () => {
            map.getCanvas().style.cursor = '';
            popup.remove();
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

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        const setVisibility = (layerId: string, isVisible: boolean) => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(
                    layerId,
                    'visibility',
                    isVisible ? 'visible' : 'none'
                );
            }
        };

        // Update Water Basins
        setVisibility('water-basins-fill', activeLayers.water);

        // Update Data Centers
        setVisibility('data-centers-circle', activeLayers.data);

        // Update Power Plants
        setVisibility('power-plants-circle', activeLayers.power);
    }, [activeLayers]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        const filterConditions: FilterExpression[] = ['all'];

        if (filters.status !== 'All') {
            const rawStatus =
                filters.status === 'In Development'
                    ? 'Approved/Permitted/Under construction'
                    : filters.status;

            filterConditions.push(['==', ['get', 'status'], rawStatus]);
        }

        if (filters.minCapacity > 0) {
            filterConditions.push([
                '>=',
                ['to-number', ['get', 'capacity_mw']],
                filters.minCapacity,
            ]);
        }

        if (map.getLayer('data-centers-circle')) {
            map.setFilter(
                'data-centers-circle',
                filterConditions.length > 1
                    ? (filterConditions as unknown as FilterSpecification)
                    : null
            );
        }

        map.fire('idle');
    }, [filters]);

    return {
        containerRef,
        viewportMetrics,
        activeLayers,
        toggleLayer,
        filters,
        setFilters,
    };
}
