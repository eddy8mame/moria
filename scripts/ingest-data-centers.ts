import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { Pool } from "pg";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: process.env.POSTGRES_USER ?? "dev_user",
  password: process.env.POSTGRES_PASSWORD ?? "dev_password",
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? "moria_db",
});

const CSV_PATH = path.resolve(
  __dirname,
  "../../data/raw/fractracker_data_centers/Data_Centers_Database - FracTracker Data Centers.csv",
);

interface RawRow {
  facility_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  lat: string;
  long: string;
  status: string;
  location_confidence: string;
  purpose: string;
  operator_name: string;
  tenant: string;
  mw: string;
  sizerank: string;
  power_source: string;
  dedicated_power_plant: string;
  number_of_generators: string;
  number_of_buildings: string;
  cooling_source: string;
  cooling_type: string;
  facility_size_sqft: string;
  property_size_acres: string;
  project_cost: string;
  expected_date_online: string;
  community_pushback: string;
  advocacy_information: string;
  resistance_status: string;
  nda: string;
  community_group_website_1: string;
  community_group_website_2: string;
  petition_url: string;
  other_info: string;
  information_source: string;
  info_source_1: string;
  info_source_2: string;
  info_source_3: string;
  info_source_4: string;
  info_source_5: string;
  info_source_6: string;
  info_source_7: string;
  info_source_8: string;
  date_created: string;
  date_updated: string;
}

/** Parse MM/DD/YY to ISO date string, or return null. */
function parseDate(raw: string): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (!match) return null;

  const [, mm, dd, yy] = match;
  const year = Number(yy);
  // Pivot: 00-49 → 2000s, 50-99 → 1900s
  const fullYear = year < 50 ? 2000 + year : 1900 + year;
  return `${fullYear}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

/** Return trimmed string or null if empty. */
function strOrNull(val: string): string | null {
  const trimmed = val?.trim();
  return trimmed === "" ? null : (trimmed ?? null);
}

/** Parse to number or return null. Strips commas, $, whitespace. */
function numOrNull(val: string): number | null {
  if (!val?.trim()) return null;
  const cleaned = val.replace(/[$,\s]/g, "");
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

/** Parse to integer or return null. */
function intOrNull(val: string): number | null {
  const num = numOrNull(val);
  return num != null ? Math.round(num) : null;
}

async function ingest() {
  const csv = readFileSync(CSV_PATH, "utf-8");
  const rows: RawRow[] = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  console.log(`Parsed ${rows.length} rows from CSV`);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM us_data_centers");

    let inserted = 0;

    // Use .entries() to get both the index and the row object
    for (const [index, row] of rows.entries()) {
      const lat = numOrNull(row.lat);
      const lng = numOrNull(row.long);

      const values = [
        strOrNull(row.facility_name), // $1
        strOrNull(row.operator_name), // $2
        strOrNull(row.tenant), // $3
        strOrNull(row.purpose), // $4
        strOrNull(row.address), // $5
        strOrNull(row.city), // $6
        strOrNull(row.state), // $7
        strOrNull(row.zip), // $8
        strOrNull(row.county), // $9
        lat, // $10
        lng, // $11
        strOrNull(row.location_confidence), // $12
        strOrNull(row.status), // $13
        strOrNull(row.expected_date_online), // $14
        numOrNull(row.mw), // $15
        strOrNull(row.sizerank), // $16
        intOrNull(row.facility_size_sqft), // $17
        numOrNull(row.property_size_acres), // $18
        intOrNull(row.project_cost), // $19
        intOrNull(row.number_of_buildings), // $20
        strOrNull(row.power_source), // $21
        strOrNull(row.dedicated_power_plant), // $22
        intOrNull(row.number_of_generators), // $23
        strOrNull(row.cooling_source), // $24
        strOrNull(row.cooling_type), // $25
        strOrNull(row.community_pushback), // $26
        strOrNull(row.advocacy_information), // $27
        strOrNull(row.resistance_status), // $28
        strOrNull(row.nda), // $29
        strOrNull(row.community_group_website_1), // $30
        strOrNull(row.community_group_website_2), // $31
        strOrNull(row.petition_url), // $32
        strOrNull(row.other_info), // $33
        strOrNull(row.information_source), // $34
        strOrNull(row.info_source_1), // $35
        strOrNull(row.info_source_2), // $36
        strOrNull(row.info_source_3), // $37
        strOrNull(row.info_source_4), // $38
        strOrNull(row.info_source_5), // $39
        strOrNull(row.info_source_6), // $40
        strOrNull(row.info_source_7), // $41
        strOrNull(row.info_source_8), // $42
        parseDate(row.date_created), // $43
        parseDate(row.date_updated), // $44
      ];

      const query = `
        INSERT INTO us_data_centers (
          facility_name, operator_name, tenant, purpose,
          address, city, state, zip, county,
          location, location_confidence,
          status, expected_date_online,
          capacity_mw, sizerank, facility_size_sqft, property_size_acres,
          project_cost, number_of_buildings,
          power_source, dedicated_power_plant, number_of_generators,
          cooling_source, cooling_type,
          community_pushback, advocacy_information, resistance_status, nda,
          community_group_website_1, community_group_website_2, petition_url,
          other_info, information_source,
          info_source_1, info_source_2, info_source_3, info_source_4,
          info_source_5, info_source_6, info_source_7, info_source_8,
          date_created, date_updated
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8, $9,
          ST_SetSRID(ST_MakePoint($11::float, $10::float), 4326), $12,
          $13, $14,
          $15, $16, $17, $18,
          $19, $20,
          $21, $22, $23,
          $24, $25,
          $26, $27, $28, $29,
          $30, $31, $32,
          $33, $34,
          $35, $36, $37, $38,
          $39, $40, $41, $42,
          $43, $44
        )
      `;

      try {
        await client.query(query, values);
        inserted++;
      } catch (err) {
        // Calculate exact CSV line number (0-based index + 1 + 1 for header row)
        const csvLineNumber = index + 2;
        
        console.error(`\n❌ FATAL ERROR AT CSV LINE ${csvLineNumber}`);
        console.error(`Facility: ${row.facility_name || "Unknown"}`);
        console.error(`Error: ${(err as Error).message}`);
        console.error(`\nRow Data Dump:`, row);
        
        // Re-throw to escape the loop and trigger the rollback
        throw err;
      }
    }

    await client.query("COMMIT");
    console.log(`Done: ${inserted} inserted`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\nIngestion failed on a row, entire batch rolled back.");
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

ingest().catch(console.error);