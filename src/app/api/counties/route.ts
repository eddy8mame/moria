import { pool } from '@/app/lib/db';
import { parseBbox } from '@/app/lib/geo';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const params = req.nextUrl.searchParams;
    const bbox = parseBbox(params.get('bbox'));

    if (!bbox) {
        return NextResponse.json(
            {
                error: 'bbox required - format: west,south,east,north (lon/lat order, WGS84 coordinates)',
            },
            { status: 400 }
        );
    }

    const [west, south, east, north] = bbox;
    const state = params.get('state');
    const values: (number| string)[] = [west, south, east, north];
    let stateClause = '';

    if (state) {
        values.push(state);
        stateClause = `AND c.statefp = $${values.length}`;
    }

    const query = `
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', COALESCE(json_agg(json_build_object(
        'type', 'Feature',
        'id', c.geoid,
        'geometry', ST_AsGeoJSON(c.geometry)::json,
        'properties', json_build_object(
          'geoid', c.geoid,
          'name', c.name,
          'namelsad', c.namelsad,
          'statefp', c.statefp,
          'countyfp', c.countyfp,
          'cbsafp', c.cbsafp,
          'aland', c.aland,
          'awater', c.awater
        )
      )), '[]'::json)
    ) AS geojson
    FROM us_counties c
    WHERE c.geometry && ST_MakeEnvelope($1, $2, $3, $4, 4326)
    ${stateClause}
  `;

    try {
        const result = await pool.query(query, values);
        return NextResponse.json(result.rows[0].geojson);
    } catch (err) {
        console.error('us_counties query failed:', err);
        return NextResponse.json(
            { error: 'internal server error' },
            { status: 500 }
        );
    }
}
