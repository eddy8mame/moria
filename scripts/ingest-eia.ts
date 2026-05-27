import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// Reconstruct __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust CommonJS import for 'xlsx' in ESM
const require = createRequire(import.meta.url);
const xlsx = require("xlsx");

// The accumulator interface for determining plant dominance
interface PlantMetrics {
  total_mw: number;
  fuel_weights: Record<string, number>;
  status_weights: Record<string, number>;
}

// Add this helper function above your loops
const parseOptionalInt = (val: string): number | null => {
  if (val === undefined || val === null) return null;
  if (typeof val === "string" && val.trim() === "") return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
};

async function ingestEIA() {
  console.log("Initializing EIA-860 ingestion...");

  const dirPath = path.join(__dirname, "../raw/eia860");
  const plantPath = path.join(dirPath, "Plant_Y2024.xlsx");
  const genPath = path.join(dirPath, "Generator_Y2024.xlsx");

  if (!fs.existsSync(plantPath) || !fs.existsSync(genPath)) {
    throw new Error(
      `Files not found. Ensure Plant_Y2024.xlsx and Generator_Y2024.xlsx exist in ${dirPath}`,
    );
  }

  // 1. Extract: Parse the Plant Workbook
  console.log("Parsing Plant Workbook...");
  const plantWorkbook = xlsx.readFile(plantPath);
  const plantSheet = plantWorkbook.Sheets["Plant"];

  if (!plantSheet) {
    throw new Error('Could not find a sheet named explicitly "Plant".');
  }
  // Default sheet_to_json behavior uses Row 1 as headers
  const plantsRaw = xlsx.utils.sheet_to_json(plantSheet, { range: 1 });

  // 2. Extract & Transform: Parse Generator lifecycle sheets
  console.log("Parsing Generator Workbook lifecycle sheets...");
  const genWorkbook = xlsx.readFile(genPath);

  const sheetsToProcess = [
    { name: "Operable", statusAssigned: "Operating" },
    { name: "Proposed", statusAssigned: "Proposed" },
  ];

  const plantAggregates = new Map<number, PlantMetrics>();

  for (const { name, statusAssigned } of sheetsToProcess) {
    const sheet = genWorkbook.Sheets[name];
    if (!sheet) {
      console.warn(`Warning: Sheet '${name}' not found in Generator file.`);
      continue;
    }

    const gensRaw = xlsx.utils.sheet_to_json(sheet, { range: 1 });
    console.log(`Processing ${gensRaw.length} rows from sheet: ${name}`);

    for (const gen of gensRaw) {
      const plantCode = gen["Plant Code"];
      const capacity = parseFloat(gen["Nameplate Capacity (MW)"]) || 0;
      const fuelType = gen["Energy Source 1"] || "Unknown";

      if (!plantCode) continue;

      // Initialize the accumulator for a new plant
      if (!plantAggregates.has(plantCode)) {
        plantAggregates.set(plantCode, {
          total_mw: 0,
          fuel_weights: {},
          status_weights: {},
        });
      }

      const metrics = plantAggregates.get(plantCode)!;

      // Accumulate MW capacity
      metrics.total_mw += capacity;
      metrics.fuel_weights[fuelType] =
        (metrics.fuel_weights[fuelType] || 0) + capacity;
      metrics.status_weights[statusAssigned] =
        (metrics.status_weights[statusAssigned] || 0) + capacity;
    }
  }

  // 3. Load: Database Insertion
  const client = new Client({
    user: process.env.POSTGRES_USER || "dev_user",
    password: process.env.POSTGRES_PASSWORD || "dev_password",
    host: process.env.PGHOST ?? "localhost",
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.POSTGRES_DB || "moria_db",
  });

  await client.connect();
  console.log("Connected to PostGIS. Beginning insertion...");

  let insertedCount = 0;

  try {
    await client.query("BEGIN");
    await client.query("TRUNCATE TABLE us_power_plants RESTART IDENTITY CASCADE");

    const insertQuery = `
            INSERT INTO us_power_plants (
                plant_code, plant_name, utility_id, utility_name, 
                state, county, zip, location,
                nameplate_capacity_mw, primary_fuel, 
                grid_voltage_kv, grid_voltage_2_kv, grid_voltage_3_kv,
                nerc_region, balancing_authority_code, balancing_authority_name,
                tx_owner, tx_owner_id, primary_purpose_code, sector, sector_name,
                regulatory_status, water_source_name, operating_status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, 
                ST_SetSRID(ST_MakePoint($8, $9), 4326),
                $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
            )
        `;

    for (const plant of plantsRaw) {
      const plantCode = plant["Plant Code"];
      if (!plantCode || isNaN(plantCode)) continue;

      const lat = parseFloat(plant["Latitude"]);
      const lon = parseFloat(plant["Longitude"]);

      // Spatial tables require valid coordinates
      if (isNaN(lat) || isNaN(lon)) continue;

      const agg = plantAggregates.get(plantCode);
      if (!agg) continue; // Skip if no operable/proposed generators exist

      // Extract highest MW key from the weighting dictionaries
      const primaryFuel = Object.keys(agg.fuel_weights).reduce(
        (a, b) => (agg.fuel_weights[a] > agg.fuel_weights[b] ? a : b),
        "Unknown",
      );
      const operatingStatus = Object.keys(agg.status_weights).reduce(
        (a, b) => (agg.status_weights[a] > agg.status_weights[b] ? a : b),
        "Unknown",
      );

      const values = [
        plantCode,
        plant["Plant Name"],
        parseOptionalInt(plant["Utility ID"]), // $3 Sanitize
        plant["Utility Name"],
        plant["State"],
        plant["County"],
        plant["Zip"],
        lon,
        lat,
        agg.total_mw,
        primaryFuel,
        parseFloat(plant["Grid Voltage (kV)"]) || null,
        parseFloat(plant["Grid Voltage 2 (kV)"]) || null,
        parseFloat(plant["Grid Voltage 3 (kV)"]) || null,
        plant["NERC Region"],
        plant["Balancing Authority Code"],
        plant["Balancing Authority Name"],
        plant["Transmission or Distribution System Owner"],
        parseOptionalInt(plant["Transmission or Distribution System Owner ID"]), // $19 Sanitize
        plant["Primary Purpose Code"],
        plant["Sector"],
        plant["Sector Name"],
        plant["Regulatory Status"],
        plant["Name of Water Source"],
        operatingStatus,
      ];

      await client.query(insertQuery, values);
      insertedCount++;
    }

    await client.query("COMMIT");
    console.log(
      `Success: Ingested ${insertedCount} power plants into PostGIS.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Ingestion failed, transaction rolled back:", error);
  } finally {
    await client.end();
  }
}

ingestEIA().catch(console.error);
