#!/bin/bash
set -euo pipefail

# ===========================================================================
# Export PostGIS tables to JSONL and generate optimized PMTiles archives.
# Run from project root: ./scripts/generate-tiles.sh
# ===========================================================================

DB="postgresql://dev_user:dev_password@localhost:5432/moria_db"
OUT_DIR="public/tiles"
TMP_DIR="data/tmp-geojson"

mkdir -p "$OUT_DIR" "$TMP_DIR"

echo "=== Exporting tables to JSONL (Row-by-Row) ==="

echo "  data centers..."
psql "$DB" -t -A -c "
  SELECT json_build_object(
    'type', 'Feature',
    'properties', json_build_object(
      'id', id,
      'facility_name', facility_name,
      'operator_name', operator_name,
      'status', status,
      'capacity_mw', capacity_mw,
      'cooling_type', cooling_type
    ),
    'geometry', ST_AsGeoJSON(location)::jsonb
  )
  FROM us_data_centers;
" > "$TMP_DIR/data-centers.geojsonl"

echo "  power plants..."
psql "$DB" -t -A -c "
  SELECT json_build_object(
    'type', 'Feature',
    'properties', json_build_object(
      'plant_code', plant_code,
      'plant_name', plant_name,
      'nameplate_capacity_mw', nameplate_capacity_mw,
      'primary_fuel', primary_fuel
    ),
    'geometry', ST_AsGeoJSON(location)::jsonb
  )
  FROM us_power_plants;
" > "$TMP_DIR/power-plants.geojsonl"

echo "  counties..."
psql "$DB" -t -A -c "
  SELECT json_build_object(
    'type', 'Feature',
    'properties', json_build_object(
      'geoid', geoid,
      'namelsad', namelsad
    ),
    'geometry', ST_AsGeoJSON(geometry)::jsonb
  )
  FROM us_counties;
" > "$TMP_DIR/counties.geojsonl"

echo "  water basins..."
psql "$DB" -t -A -c "
  SELECT json_build_object(
    'type', 'Feature',
    'properties', json_build_object(
      'string_id', string_id,
      'bws_cat', bws_cat,
      'bws_label', bws_label,
      'bws_raw', bws_raw,
      'name_1', name_1
    ),
    'geometry', ST_AsGeoJSON(geometry)::jsonb
  )
  FROM water_basins
  WHERE gid_0 = 'USA';
" > "$TMP_DIR/water-basins.geojsonl"

echo "=== Generating PMTiles ==="

echo "  data centers..."
tippecanoe \
  -o "$OUT_DIR/data-centers.pmtiles" \
  -l data-centers \
  -z 14 -Z 2 \
  -r1 \
  --no-feature-limit \
  --force \
  "$TMP_DIR/data-centers.geojsonl"

echo "  power plants..."
tippecanoe \
  -o "$OUT_DIR/power-plants.pmtiles" \
  -l power-plants \
  -z 14 -Z 2 \
  -r1 \
  --no-feature-limit \
  --force \
  "$TMP_DIR/power-plants.geojsonl"

echo "  counties..."
tippecanoe \
  -o "$OUT_DIR/counties.pmtiles" \
  -l counties \
  -z 12 -Z 2 \
  --detect-shared-borders \
  --simplification=10 \
  --force \
  "$TMP_DIR/counties.geojsonl"

echo "  water basins..."
tippecanoe \
  -o "$OUT_DIR/water-basins.pmtiles" \
  -l water-basins \
  -z 12 -Z 2 \
  --detect-shared-borders \
  --simplification=10 \
  --force \
  "$TMP_DIR/water-basins.geojsonl"

echo "=== Cleaning up temp JSONL ==="
rm -rf "$TMP_DIR"

echo "=== Done ==="
ls -lh "$OUT_DIR"/*.pmtiles