import "dotenv/config";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { pool } from "./pool.js";

const CSV_PATH = process.env.SEED_CSV_PATH ?? "nomenclatura_2025_12.csv";

type CsvRow = {
  id: string;
  name: string;
  obcn?: string;
  location?: string;
  latitude: string;
  longitude: string;
  status: string;
};

function toIntSafe(v: string) {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) throw new Error(`Invalid int: "${v}"`);
  return n;
}

function toFloatSafe(v: string) {
  const n = Number.parseFloat(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid float: "${v}"`);
  return n;
}

async function run() {
  const csvAbs = path.resolve(CSV_PATH);
  if (!fs.existsSync(csvAbs)) {
    throw new Error(`CSV not found: ${csvAbs}. Set SEED_CSV_PATH or move the file to project root.`);
  }


  const raw = fs.readFileSync(csvAbs, { encoding: "latin1" });

  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as CsvRow[];

  console.log(`Loaded ${records.length} rows from CSV`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");


    await client.query("DELETE FROM station_inventory");
    await client.query("DELETE FROM reservations");
    await client.query("DELETE FROM stations");

    const insertStationSql = `
      INSERT INTO stations (id, name, obcn, location, status, geom)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography)
    `;

    const insertInvSql = `
      INSERT INTO station_inventory (station_id, available_bikes, available_docks)
      VALUES ($1, $2, $3)
    `;

    for (const r of records) {
      const id = toIntSafe(r.id);
      const lat = toFloatSafe(r.latitude);
      const lon = toFloatSafe(r.longitude);

      await client.query(insertStationSql, [
        id,
        r.name,
        r.obcn ?? null,
        r.location ?? null,
        r.status,
        lon,
        lat
      ]);

      const bikes = 10;
      const docks = 10;

      await client.query(insertInvSql, [id, bikes, docks]);
    }

    await client.query("COMMIT");
    console.log("Seed complete ✅");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
