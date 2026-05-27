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
    const status = params.get('status');
    const operator = params.get('operator');

    const values: (number | string)[] = [west, south, east, north];
    const clauses: string[] = [];

    if (status) {
        values.push(status);
        clauses.push(`dc.status = $${values.length}`);
    }

    if (operator) {
        values.push(operator);
        clauses.push(`dc.operator_name = $${values.length}`);
    }

    const whereExtra = clauses.length > 0 ? 'AND ' + clauses.join(' AND ') : '';

    const query = `
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', COALESCE(json_agg(json_build_object(
        'type', 'Feature',
        'id', dc.id,
        'geometry', ST_AsGeoJSON(dc.location)::json,
        'properties', json_build_object(
          'id', dc.id,
          'facility_name', dc.facility_name,
          'operator_name', dc.operator_name,
          'tenant', dc.tenant,
          'status', dc.status,
          'capacity_mw', dc.capacity_mw,
          'state', dc.state,
          'county', dc.county,
          'city', dc.city,
          'cooling_type', dc.cooling_type,
          'cooling_source', dc.cooling_source,
          'power_source', dc.power_source,
          'sizerank', dc.sizerank,
          'facility_size_sqft', dc.facility_size_sqft,
          'property_size_acres', dc.property_size_acres,
          'community_pushback', dc.community_pushback,
          'resistance_status', dc.resistance_status
        )
      )), '[]'::json)
    ) AS geojson
    FROM us_data_centers dc
    WHERE dc.location IS NOT NULL
      AND dc.location && ST_MakeEnvelope($1, $2, $3, $4, 4326)
      ${whereExtra}
  `;

    try {
        const result = await pool.query(query, values);
        return NextResponse.json(result.rows[0].geojson);
    } catch (err) {
        console.error('data-centers query failed:', err);
        return NextResponse.json(
            { error: 'internal server error' },
            { status: 500 }
        );
    }
}
