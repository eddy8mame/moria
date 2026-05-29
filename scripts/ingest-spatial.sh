#!/bin/bash
set -euo pipefail

# ===========================================================================
# Ingest raw shapefiles and geodatabases into PostGIS via GDAL
# ===========================================================================

# 1. Load the secure environment variables
set -a
source "$(dirname "$0")/../.env"
set +a

# 2. Build the secure connection string dynamically
PG_CONN="host=${DB_HOST} user=${PG_USER} password=${PG_PASSWORD} dbname=${PG_DB}"

# 3. Define the Docker network
NETWORK="${DOCKER_NETWORK_NAME}"

# ===========================================================================

echo "🗺️  Ingesting US Counties Shapefile..."
docker run --rm \
    --network "$NETWORK" \
    -v $("pwd"):/home/project \
    osgeo/gdal:ubuntu-small-3.6.3 \
    ogr2ogr -f "PostgreSQL" PG:"$PG_CONN" \
    /home/project/data/raw/tl_2025_us_county/tl_2025_us_county.shp \
    -nln us_counties \
    -t_srs EPSG:4326 \
    -nlt MULTIPOLYGON \
    -lco GEOMETRY_NAME=geometry \
    -overwrite

echo "🌍 Ingesting Aqueduct Geodatabase (Water Basins) to Staging..."
docker run --rm \
    --network "$NETWORK" \
    -v $("pwd"):/home/project \
    osgeo/gdal:ubuntu-small-3.6.3 \
    ogr2ogr -f "PostgreSQL" PG:"$PG_CONN" \
    /home/project/data/raw/aqueduct.gdb/GDB/Aq40_Y2023D07M05.gdb \
    -nln water_basins_staging \
    -t_srs EPSG:4326 baseline_annual \
    -nlt MULTIPOLYGON \
    -lco GEOMETRY_NAME=geometry \
    -overwrite

echo "⚡ Step 3/3: Executing PostGIS Topology Repair and Migration..."
# Leveraging your running container to execute the heavy geometry cleaning query
docker compose exec -T db psql -U "${PG_USER}" -d "${PG_DB}" << EOF
BEGIN;

TRUNCATE TABLE water_basins RESTART IDENTITY CASCADE;

INSERT INTO water_basins (
  string_id, aq30_id, pfaf_id, gid_1, aqid, gid_0, name_0, name_1, area_km2,
  bws_raw, bws_score, bws_cat, bws_label,
  bwd_raw, bwd_score, bwd_cat, bwd_label,
  iav_raw, iav_score, iav_cat, iav_label,
  sev_raw, sev_score, sev_cat, sev_label,
  gtd_raw, gtd_score, gtd_cat, gtd_label,
  drr_raw, drr_score, drr_cat, drr_label,
  w_awr_def_tot_raw, w_awr_def_tot_score, w_awr_def_tot_cat, w_awr_def_tot_label,
  w_awr_elp_qan_raw, w_awr_elp_qan_score, w_awr_elp_qan_cat, w_awr_elp_qan_label,
  w_awr_elp_qal_raw, w_awr_elp_qal_score, w_awr_elp_qal_cat, w_awr_elp_qal_label,
  w_awr_elp_rrr_raw, w_awr_elp_rrr_score, w_awr_elp_rrr_cat, w_awr_elp_rrr_label,
  w_awr_elp_tot_raw, w_awr_elp_tot_score, w_awr_elp_tot_cat, w_awr_elp_tot_label, w_awr_elp_tot_weight_fraction,
  w_awr_smc_tot_raw, w_awr_smc_tot_score, w_awr_smc_tot_cat, w_awr_smc_tot_label, w_awr_smc_tot_weight_fraction,
  geometry
)
SELECT 
  string_id, 
  aq30_id::integer, 
  pfaf_id::bigint, 
  gid_1, 
  aqid::integer, 
  gid_0, 
  name_0, 
  name_1, 
  area_km2::real,
  
  bws_raw::real, bws_score::real, bws_cat::smallint, bws_label,
  bwd_raw::real, bwd_score::real, bwd_cat::smallint, bwd_label,
  iav_raw::real, iav_score::real, iav_cat::smallint, iav_label,
  sev_raw::real, sev_score::real, sev_cat::smallint, sev_label,
  gtd_raw::real, gtd_score::real, gtd_cat::smallint, gtd_label,
  drr_raw::real, drr_score::real, drr_cat::smallint, drr_label,
  
  w_awr_def_tot_raw::real, w_awr_def_tot_score::real, w_awr_def_tot_cat::smallint, w_awr_def_tot_label,
  
  w_awr_elp_qan_raw::real, w_awr_elp_qan_score::real, w_awr_elp_qan_cat::smallint, w_awr_elp_qan_label,
  w_awr_elp_qal_raw::real, w_awr_elp_qal_score::real, w_awr_elp_qal_cat::smallint, w_awr_elp_qal_label,
  w_awr_elp_rrr_raw::real, w_awr_elp_rrr_score::real, w_awr_elp_rrr_cat::smallint, w_awr_elp_rrr_label,
  w_awr_elp_tot_raw::real, w_awr_elp_tot_score::real, w_awr_elp_tot_cat::smallint, w_awr_elp_tot_label, w_awr_elp_tot_weight_fraction::real,
  
  w_awr_smc_tot_raw::real, w_awr_smc_tot_score::real, w_awr_smc_tot_cat::smallint, w_awr_smc_tot_label, w_awr_smc_tot_weight_fraction::real,
  
  ST_Multi(ST_MakeValid(geometry)) AS geometry
FROM water_basins_staging;


COMMIT;

-- Clean up the temporary staging table to free disk space inside the container
DROP TABLE IF EXISTS water_basins_staging;
EOF

echo "✅ Spatial ingestion, repair, and production migration complete."
