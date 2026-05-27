import { pool } from '@/app/lib/db';
import { parseBbox } from '@/app/lib/geo';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const params = req.nextUrl.searchParams;
    const bbox = parseBbox(params.get('bbox'));

    if (!bbox) {
        return NextResponse.json(
            { error: 'bbox required — format: west,south,east,north' },
            { status: 400 }
        );
    }

    const [west, south, east, north] = bbox;
    const fuel = params.get('fuel');

    const values: (number | string)[] = [west, south, east, north];
    let fuelClause = '';

    if (fuel) {
        values.push(fuel);
        fuelClause = `AND pp.primary_fuel = $${values.length}`;
    }

    const query = `
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', COALESCE(json_agg(json_build_object(
        'type', 'Feature',
        'id', pp.plant_code,
        'geometry', ST_AsGeoJSON(pp.location)::json,
        'properties', json_build_object(
          'plant_code', pp.plant_code,
          'plant_name', pp.plant_name,
          'utility_name', pp.utility_name,
          'state', pp.state,
          'county', pp.county,
          'nameplate_capacity_mw', pp.nameplate_capacity_mw,
          'primary_fuel', pp.primary_fuel,
          'operating_status', pp.operating_status,
          'nerc_region', pp.nerc_region,
          'balancing_authority_code', pp.balancing_authority_code,
          'water_source_name', pp.water_source_name,
          'grid_voltage_kv', pp.grid_voltage_kv
        )
      )), '[]'::json)
    ) AS geojson
    FROM us_power_plants pp
    WHERE pp.location && ST_MakeEnvelope($1, $2, $3, $4, 4326)
    ${fuelClause}
  `;

    try {
        const result = await pool.query(query, values);
        return NextResponse.json(result.rows[0].geojson);
    } catch (err) {
        console.error('grid query failed:', err);
        return NextResponse.json(
            { error: 'internal server error' },
            { status: 500 }
        );
    }
}
