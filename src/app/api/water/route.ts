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

    const query = `
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', COALESCE(json_agg(json_build_object(
        'type', 'Feature',
        'id', wb.string_id,
        'geometry', ST_AsGeoJSON(wb.geometry)::json,
        'properties', json_build_object(
          'string_id', wb.string_id,
          'name_0', wb.name_0,
          'name_1', wb.name_1,
          'area_km2', wb.area_km2,
          'bws_raw', wb.bws_raw,
          'bws_score', wb.bws_score,
          'bws_cat', wb.bws_cat,
          'bws_label', wb.bws_label,
          'bwd_raw', wb.bwd_raw,
          'bwd_cat', wb.bwd_cat,
          'drr_raw', wb.drr_raw,
          'drr_cat', wb.drr_cat,
          'w_awr_elp_tot_raw', wb.w_awr_elp_tot_raw,
          'w_awr_elp_tot_score', wb.w_awr_elp_tot_score,
          'w_awr_elp_tot_cat', wb.w_awr_elp_tot_cat,
          'w_awr_elp_tot_label', wb.w_awr_elp_tot_label,
          'w_awr_def_tot_raw', wb.w_awr_def_tot_raw,
          'w_awr_def_tot_cat', wb.w_awr_def_tot_cat,
          'w_awr_def_tot_label', wb.w_awr_def_tot_label
        )
      )), '[]'::json)
    ) AS geojson
    FROM water_basins wb
    WHERE wb.geometry && ST_MakeEnvelope($1, $2, $3, $4, 4326)
      AND wb.gid_0 = 'USA'
  `;

    try {
        const result = await pool.query(query, [west, south, east, north]);
        return NextResponse.json(result.rows[0].geojson);
    } catch (err) {
        console.error('water query failed:', err);
        return NextResponse.json(
            { error: 'internal server error' },
            { status: 500 }
        );
    }
}
