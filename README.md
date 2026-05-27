# Moria

Moria is a geospatial data workbench for analyzing data center demand against grid capacity and water availability in the United States.

## Project Scope

- **Data Centers**: 1,513+ facilities (Operating, Proposed, Under Construction) with capacity (MW) and cooling type data.
- **Power Plants**: EIA-860 electricity generator data with nameplate capacity and fuel types.
- **Water Basins**: WRI Aqueduct 4.0 water stress indicators.
- **Counties**: US Census TIGER/Line 2025 boundaries for regional analysis.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4.
- **Mapping**: MapLibre GL JS, PMTiles (cloud-optimized vector tiles).
- **Database**: PostgreSQL 16 + PostGIS 3.4.

## Setup Requirements

### 1. Database
The project requires a PostGIS-enabled PostgreSQL database. A `docker-compose.yml` is provided for easy setup.

```bash
docker-compose up -d
```

### 2. Schema
Initialize the database schema using the provided SQL file:

```bash
psql -h localhost -U dev_user -d moria_db -f db/schema.sql
```

### 3. Environment Variables
Create a `.env.local` file with the following:

```env
NEXT_PUBLIC_MAPTILER_KEY=your_maptiler_key
PGHOST=localhost
PGPORT=5432
PGDATABASE=moria_db
PGUSER=dev_user
PGPASSWORD=dev_password
```

### 4. Development
Install dependencies and run the development server:

```bash
pnpm install
pnpm dev
```

## Data Sources
- **Data Centers**: FracTracker Alliance.
- **Power Plants**: U.S. Energy Information Administration (EIA).
- **Water Basins**: World Resources Institute (WRI) Aqueduct.
- **Counties**: U.S. Census Bureau.
