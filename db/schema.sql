-- =============================================================================
-- Moria: Database Schema
-- Data center demand vs. grid capacity & water availability
--
-- Sources:
--   us_data_centers        → FracTracker Alliance CSV (non-commercial, with attribution)
--   us_power_plants        → EIA-860 Excel download (Plant tab + Generator tab)
--   water_basins        → WRI Aqueduct 4.0 File Geodatabase (CC BY 4.0)
--   us_counties            → Census TIGER/Line 2025 shapefiles
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;


-- =============================================================================
-- DATA CENTERS (FracTracker Alliance)
-- =============================================================================

CREATE TABLE us_data_centers (
  id                    SERIAL PRIMARY KEY,

  -- Identification
  facility_name         VARCHAR(255),
  operator_name         VARCHAR(255),
  tenant                VARCHAR(255),
  purpose               VARCHAR(100),

  -- Location
  address               VARCHAR(255),
  city                  VARCHAR(100),
  state                 VARCHAR(2),
  zip                   VARCHAR(10),
  county                VARCHAR(100),
  location              geometry(POINT, 4326),
  location_confidence   VARCHAR(255),

  -- Status
  status                VARCHAR(255),
  expected_date_online  VARCHAR(255),

  -- Capacity and infrastructure
  capacity_mw           DECIMAL(10,2),
  sizerank              VARCHAR(255),
  facility_size_sqft    INTEGER,
  property_size_acres   DECIMAL(10,2),
  project_cost          BIGINT,
  number_of_buildings   INTEGER,

  -- Power
  power_source          VARCHAR(255),
  dedicated_power_plant VARCHAR(255),
  number_of_generators  INTEGER,

  -- Water / Cooling (key for water stress analysis)
  cooling_source        VARCHAR(255),
  cooling_type          VARCHAR(255),

  -- Community resistance
  community_pushback    TEXT,
  advocacy_information  TEXT,
  resistance_status     VARCHAR(255),
  nda                   VARCHAR(255),
  community_group_website_1 VARCHAR(1000),
  community_group_website_2 VARCHAR(1000),
  petition_url          VARCHAR(1000),

  -- Metadata
  other_info            TEXT,
  information_source    TEXT,
  info_source_1         VARCHAR(1000),
  info_source_2         VARCHAR(1000),
  info_source_3         VARCHAR(1000),
  info_source_4         VARCHAR(1000),
  info_source_5         VARCHAR(1000),
  info_source_6         VARCHAR(1000),
  info_source_7         VARCHAR(1000),
  info_source_8         VARCHAR(1000),
  date_created          DATE,
  date_updated          DATE
);

CREATE INDEX idx_dc_location ON us_data_centers USING GIST(location);
CREATE INDEX idx_dc_status ON us_data_centers(status);
CREATE INDEX idx_dc_state ON us_data_centers(state);
CREATE INDEX idx_dc_county_state ON us_data_centers(county, state);
CREATE INDEX idx_dc_operator ON us_data_centers(operator_name);
CREATE INDEX idx_dc_cooling ON us_data_centers(cooling_type);
CREATE INDEX idx_dc_resistance ON us_data_centers(resistance_status);

COMMENT ON TABLE us_data_centers IS
  'US data center facilities from FracTracker Alliance. 1,513 records compiled '
  'from FOIA requests, public records, media monitoring, and permit documents. '
  'Free for non-commercial use with credit to FracTracker Alliance. '
  'Status values: Operating, Proposed, Approved/Permitted/Under Construction. '
  'cooling_source and cooling_type are directly relevant to water stress analysis — '
  'evaporative cooling facilities have different water impact than air-cooled. '
  'Community resistance fields (community_pushback, resistance_status, petition_url) '
  'provide a dimension not available in other data center datasets. '
  'Some records may have null lat/long — geocode to county centroid as fallback.';


-- =============================================================================
-- POWER PLANTS (EIA-860 Annual Electric Generator Report)
-- Source: EIA-860 Excel download
--   Download: https://www.eia.gov/electricity/data/eia860/
--   Format: XLSX workbook with multiple tabs
--   Tabs used:
--     Plant tab  → plant-level fields (one row per plant)
--     Generator tab → generator-level fields (multiple rows per plant)
--       Aggregate generator capacities to plant level on ingestion
--       Join key: Plant Code
--
-- Plant tab confirmed columns (from user inspection):
--   Utility ID, Utility Name, Plant Code, Plant Name,
--   Street Address, State, Zip, County, Latitude, Longitude,
--   NERC Region, Balancing Authority Code, Balancing Authority Name,
--   Name of Water Source, Primary Purpose Code, Regulatory Status,
--   Sector, Sector Name, Grid Voltage (kV), Grid Voltage 2 (kV),
--   Grid Voltage 3 (kV), Transmission or Distribution System Owner,
--   Transmission or Distribution System Owner ID,
--   Natural Gas Pipeline Name 1/2/3, Energy Storage,
--   Ash Impoundment, FERC statuses (various)
--
-- Generator tab provides: nameplate capacity, fuel type, operating status,
--   prime mover — aggregate by Plant Code to get plant-level totals
--
-- Future enrichment via EIA API:
--   facility-fuel endpoint → net generation (MWh), fuel consumption
--   operating-generator-capacity endpoint → monthly generator updates
--   Base URL: https://api.eia.gov/v2/electricity/
-- =============================================================================

CREATE TABLE us_power_plants (
  id                    SERIAL PRIMARY KEY,

  -- Identification (Plant tab)
  plant_code            INTEGER UNIQUE,
  plant_name            VARCHAR(255),
  utility_id            INTEGER,
  utility_name          VARCHAR(255),

  -- Location (Plant tab)
  state                 CHAR(2),
  county                VARCHAR(100),
  zip                   VARCHAR(10),
  location              geometry(POINT, 4326),

  -- Capacity (aggregated from Generator tab, summed by Plant Code)
  nameplate_capacity_mw DECIMAL(10,2),
  primary_fuel          VARCHAR(50),

  -- Grid connection (Plant tab)
  grid_voltage_kv       DECIMAL(8,2),
  grid_voltage_2_kv     DECIMAL(8,2),
  grid_voltage_3_kv     DECIMAL(8,2),
  nerc_region           VARCHAR(10),
  balancing_authority_code VARCHAR(20),
  balancing_authority_name VARCHAR(100),
  tx_owner              VARCHAR(255),
  tx_owner_id           INTEGER,

  -- Plant classification (Plant tab)
  primary_purpose_code  VARCHAR(10),
  sector                VARCHAR(50),
  sector_name           VARCHAR(100),
  regulatory_status     VARCHAR(50),

  -- Water (Plant tab — key for water stress analysis)
  water_source_name     VARCHAR(255),

  -- Operating status (aggregated from Generator tab)
  operating_status      VARCHAR(50)
);

CREATE INDEX idx_pp_location ON us_power_plants USING GIST(location);
CREATE INDEX idx_pp_fuel ON us_power_plants(primary_fuel);
CREATE INDEX idx_pp_state ON us_power_plants(state);
CREATE INDEX idx_pp_capacity ON us_power_plants(nameplate_capacity_mw);
CREATE INDEX idx_pp_plant_code ON us_power_plants(plant_code);
CREATE INDEX idx_pp_ba ON us_power_plants(balancing_authority_code);
CREATE INDEX idx_pp_county_state ON us_power_plants(county, state);

COMMENT ON TABLE us_power_plants IS
  'US power plants from EIA-860 Excel download. Plant-level fields come '
  'directly from the Plant tab. Capacity and fuel type are aggregated from '
  'the Generator tab (summed nameplate capacity, dominant fuel type). '
  'Join key between tabs: Plant Code. '
  'Plants >= 1MW combined nameplate capacity. '
  'Operations data (net generation, fuel consumption) can be added later '
  'via the EIA API facility-fuel endpoint, joined on plant_code = plantCode.';


-- =============================================================================
-- WATER BASINS (WRI Aqueduct 4.0)
-- Source: WRI Aqueduct 4.0 dataset download
--   Download: https://www.wri.org/data/aqueduct-global-maps-40-data
--   Format: File Geodatabase (.gdb) with geometry + tabular CSV without geometry
--   License: Creative Commons Attribution 4.0 International
--   Geometry: Union of hydrological basins, provinces, and groundwater aquifers
--             (NOT county boundaries)
--   Convert .gdb to GeoJSON/PostGIS via ogr2ogr (GDAL)
--
-- Confirmed fields from user inspection of downloaded dataset.
-- Full dataset has 200+ columns. Only project-relevant fields stored here.
--
-- Field naming pattern:
--   Individual indicators: {indicator}_{raw|score|cat|label}
--   Grouped water risk:   w_awr_{sector}_{category}_{raw|score|cat|label}
--
-- Confirmed individual indicators (13 total, each with raw/score/cat/label):
--   bws = baseline water stress       bwd = baseline water depletion
--   iav = interannual variability     sev = seasonal variability
--   gtd = groundwater table decline   rfr = riverine flood risk
--   cfr = coastal flood risk          drr = drought risk
--   ucw = untreated connected wastewater  cep = coastal eutrophication potential
--   udw = unimproved/no drinking water    usa = unimproved/no sanitation
--   rri = regulatory & reputational risk
--
-- Confirmed sector-weighted composites (each with qan/qal/rrr/tot sub-groups):
--   def = default       agr = agriculture    che = chemicals
--   con = construction  elp = electric power fnb = food & beverage
--   min = mining        ong = oil & gas      smc = semiconductor
--   tex = textile
-- =============================================================================

CREATE TABLE water_basins (
  id                    SERIAL PRIMARY KEY,

  -- Identifiers (confirmed)
  string_id             VARCHAR(100) UNIQUE,
  aq30_id               INTEGER,
  pfaf_id               BIGINT,
  gid_1                 VARCHAR(50),
  aqid                  INTEGER,
  gid_0                 VARCHAR(10),
  name_0                VARCHAR(100),
  name_1                VARCHAR(100),
  area_km2              REAL,

  -- Baseline water stress
  bws_raw               REAL,
  bws_score             REAL,
  bws_cat               SMALLINT,
  bws_label             VARCHAR(30),

  -- Baseline water depletion
  bwd_raw               REAL,
  bwd_score             REAL,
  bwd_cat               SMALLINT,
  bwd_label             VARCHAR(30),

  -- Interannual variability
  iav_raw               REAL,
  iav_score             REAL,
  iav_cat               SMALLINT,
  iav_label             VARCHAR(30),

  -- Seasonal variability
  sev_raw               REAL,
  sev_score             REAL,
  sev_cat               SMALLINT,
  sev_label             VARCHAR(30),

  -- Groundwater table decline
  gtd_raw               REAL,
  gtd_score             REAL,
  gtd_cat               SMALLINT,
  gtd_label             VARCHAR(30),

  -- Drought risk
  drr_raw               REAL,
  drr_score             REAL,
  drr_cat               SMALLINT,
  drr_label             VARCHAR(30),

  -- Overall water risk — default weighting
  w_awr_def_tot_raw     REAL,
  w_awr_def_tot_score   REAL,
  w_awr_def_tot_cat     SMALLINT,
  w_awr_def_tot_label   VARCHAR(30),

  -- Overall water risk — electric power sector weighting
  w_awr_elp_qan_raw     REAL,
  w_awr_elp_qan_score   REAL,
  w_awr_elp_qan_cat     SMALLINT,
  w_awr_elp_qan_label   VARCHAR(30),
  w_awr_elp_qal_raw     REAL,
  w_awr_elp_qal_score   REAL,
  w_awr_elp_qal_cat     SMALLINT,
  w_awr_elp_qal_label   VARCHAR(30),
  w_awr_elp_rrr_raw     REAL,
  w_awr_elp_rrr_score   REAL,
  w_awr_elp_rrr_cat     SMALLINT,
  w_awr_elp_rrr_label   VARCHAR(30),
  w_awr_elp_tot_raw     REAL,
  w_awr_elp_tot_score   REAL,
  w_awr_elp_tot_cat     SMALLINT,
  w_awr_elp_tot_label   VARCHAR(30),
  w_awr_elp_tot_weight_fraction REAL,

  -- Overall water risk — semiconductor sector weighting
  w_awr_smc_tot_raw     REAL,
  w_awr_smc_tot_score   REAL,
  w_awr_smc_tot_cat     SMALLINT,
  w_awr_smc_tot_label   VARCHAR(30),
  w_awr_smc_tot_weight_fraction REAL,

  geometry              geometry(MULTIPOLYGON, 4326)
);

CREATE INDEX idx_wb_geometry ON water_basins USING GIST(geometry);
CREATE INDEX idx_wb_bws ON water_basins(bws_cat);
CREATE INDEX idx_wb_elp ON water_basins(w_awr_elp_tot_cat);
CREATE INDEX idx_wb_overall ON water_basins(w_awr_def_tot_cat);
CREATE INDEX idx_wb_name1 ON water_basins(name_1);

COMMENT ON TABLE water_basins IS
  'Water risk indicators from WRI Aqueduct 4.0. Geometry is the union of '
  'hydrological basins, provinces, and groundwater aquifers — NOT county boundaries. '
  'Convert .gdb to PostGIS via: ogr2ogr -f PostgreSQL PG:"..." input.gdb';


-- =============================================================================
-- COUNTIES (Census TIGER/Line 2025)
-- Source: US Census Bureau TIGER/Line Shapefiles
--   Download: https://www.census.gov/geographies/mapping-files/
--             time-series/geo/tiger-line-file.html
--   File: tl_2025_us_county.shp (+ .dbf, .shx, .prj, .cpg, .xml)
--   Format: Shapefile (free, no login)
--   Load via: shp2pgsql or ogr2ogr
--
-- All fields below confirmed from .dbf header inspection (via Gemini):
-- =============================================================================

CREATE TABLE us_counties (
  id                    SERIAL PRIMARY KEY,
  statefp               VARCHAR(2),
  countyfp              VARCHAR(3),
  countyns              VARCHAR(8),
  geoid                 VARCHAR(5) UNIQUE,
  geoidfq               VARCHAR(14),
  name                  VARCHAR(100),
  namelsad              VARCHAR(100),
  lsad                  VARCHAR(2),
  classfp               CHAR(2),
  mtfcc                 VARCHAR(5),
  csafp                 VARCHAR(3),
  cbsafp                VARCHAR(5),
  metdivfp              VARCHAR(5),
  funcstat              VARCHAR(1),
  aland                 BIGINT,
  awater                BIGINT,
  intptlat              VARCHAR(11),
  intptlon              VARCHAR(12),
  geometry              geometry(MULTIPOLYGON, 4326)
);

CREATE INDEX idx_us_counties_geometry ON us_counties USING GIST(geometry);
CREATE INDEX idx_us_counties_geoid ON us_counties(geoid);
CREATE INDEX idx_us_counties_statefp ON us_counties(statefp);
CREATE INDEX idx_us_counties_cbsafp ON us_counties(cbsafp);
CREATE INDEX idx_us_counties_name ON us_counties(name);

COMMENT ON TABLE us_counties IS
  'US county boundaries from Census TIGER/Line 2025 shapefile. '
  'GEOID (5-digit FIPS) is the primary join key for county-level data. '
  'Load via: shp2pgsql -s 4269:4326 tl_2025_us_county.shp counties | psql';


-- =============================================================================
-- MATERIALIZED VIEW: Capacity Analysis
-- Combines all layers into a county-level risk assessment
-- =============================================================================

CREATE MATERIALIZED VIEW capacity_analysis AS
WITH dc_by_county AS (
  SELECT
    c.geoid,
    COUNT(*) FILTER (WHERE dc.status IN ('Proposed', 'Approved/Permitted/Under Construction')) AS planned_dc_count,
    COALESCE(SUM(dc.capacity_mw) FILTER (WHERE dc.status IN ('Proposed', 'Approved/Permitted/Under Construction')), 0) AS planned_dc_mw,
    COUNT(*) FILTER (WHERE dc.status = 'Operating') AS operating_dc_count,
    COALESCE(SUM(dc.capacity_mw) FILTER (WHERE dc.status = 'Operating'), 0) AS operating_dc_mw,
    COALESCE(SUM(dc.project_cost) FILTER (WHERE dc.status IN ('Proposed', 'Approved/Permitted/Under Construction')), 0) AS planned_project_cost
  FROM us_counties c
  JOIN us_data_centers dc
    ON ST_Covers(c.geometry, dc.location)
  GROUP BY c.geoid
),

nearby_generation AS (
  SELECT
    c.geoid,
    COUNT(*) AS plant_count,
    COALESCE(SUM(pp.nameplate_capacity_mw), 0) AS generation_capacity_mw
  FROM us_counties c
  JOIN us_power_plants pp
    -- Cast to geography to evaluate 50km distance in true meters
    ON ST_DWithin(pp.location::geography, c.geometry::geography, 50000)
  GROUP BY c.geoid
),

basin_stress AS (
  SELECT
    c.geoid,
    -- Removed redundant ::geometry casts. Retained ::geography for area calculations.
    SUM(wb.bws_raw * ST_Area(ST_Intersection(c.geometry, wb.geometry)::geography)) / 
      NULLIF(SUM(ST_Area(ST_Intersection(c.geometry, wb.geometry)::geography)), 0) AS avg_water_stress_raw,
    MAX(wb.bws_cat) AS max_water_stress_cat,
    SUM(wb.w_awr_elp_tot_raw * ST_Area(ST_Intersection(c.geometry, wb.geometry)::geography)) / 
      NULLIF(SUM(ST_Area(ST_Intersection(c.geometry, wb.geometry)::geography)), 0) AS avg_elp_water_risk_raw,
    MAX(wb.w_awr_elp_tot_cat) AS max_elp_water_risk_cat
  FROM us_counties c
  JOIN water_basins wb
    ON ST_Intersects(c.geometry, wb.geometry)
  WHERE wb.bws_cat >= 0 
  GROUP BY c.geoid
)

SELECT
  c.geoid,
  c.name AS county_name,
  c.namelsad,
  c.statefp AS state_fips,
  c.cbsafp AS metro_area_code,
  c.geometry,

  COALESCE(dc.planned_dc_count, 0)    AS planned_dc_count,
  COALESCE(dc.planned_dc_mw, 0)       AS planned_dc_mw,
  COALESCE(dc.operating_dc_count, 0)  AS operating_dc_count,
  COALESCE(dc.operating_dc_mw, 0)     AS operating_dc_mw,
  COALESCE(dc.planned_project_cost, 0)  AS planned_project_cost,

  COALESCE(ng.plant_count, 0)          AS nearby_plant_count,
  COALESCE(ng.generation_capacity_mw, 0) AS nearby_generation_mw,

  bs.avg_water_stress_raw,
  bs.max_water_stress_cat,
  bs.avg_elp_water_risk_raw,
  bs.max_elp_water_risk_cat,

  COALESCE(dc.planned_dc_mw, 0) - COALESCE(ng.generation_capacity_mw, 0) AS capacity_gap_mw,

  -- Composite risk score weighting
  (
    LEAST(GREATEST(COALESCE(bs.avg_elp_water_risk_raw, 0) / 5.0, 0), 1.0) * 0.35
    + LEAST(GREATEST(COALESCE(dc.planned_dc_mw, 0) / NULLIF(COALESCE(ng.generation_capacity_mw, 0), 0), 0), 1) * 0.45
    + LEAST(GREATEST(COALESCE(dc.planned_dc_mw, 0) / NULLIF(COALESCE(dc.operating_dc_mw, 0) + COALESCE(ng.generation_capacity_mw, 0), 0), 0), 1) * 0.20
  ) AS risk_score

FROM us_counties c
LEFT JOIN dc_by_county dc ON dc.geoid = c.geoid
LEFT JOIN nearby_generation ng ON ng.geoid = c.geoid
LEFT JOIN basin_stress bs ON bs.geoid = c.geoid
WHERE COALESCE(dc.planned_dc_count, 0) + COALESCE(dc.operating_dc_count, 0) > 0;

CREATE INDEX idx_ca_risk ON capacity_analysis(risk_score DESC);
CREATE INDEX idx_ca_state ON capacity_analysis(state_fips);
CREATE INDEX idx_ca_geometry ON capacity_analysis USING GIST(geometry);

COMMENT ON MATERIALIZED VIEW capacity_analysis IS
  'County-level risk assessment combining data center demand, grid capacity, '
  'and water stress. Refresh with: REFRESH MATERIALIZED VIEW capacity_analysis; '
  'Risk score weights: 35% water stress (electric power sector), 45% capacity '
  'gap, 20% concentration. Uses Aqueduct elp (electric power) sector weighting '
  'instead of default weighting for the water component. '
  'Spatial fixes applied: ST_Area computed on geography (sq meters, not sq degrees), '
  'ST_DWithin evaluated as geography for 50km radius.';