import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.PGHOST ?? 'localhost',
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.PGDATABASE ?? 'moria_db',
    user: process.env.PGUSER ?? 'dev_user',
    password: process.env.PGPASSWORD ?? 'dev_password',
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 10_000,
});

export { pool };
