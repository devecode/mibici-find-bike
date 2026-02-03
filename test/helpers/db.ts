import { pool } from "../../src/db/pool.js";

async function ensureStation(stationId: number) {
  await pool.query(
    `
    INSERT INTO stations (id, name, status, geom)
    VALUES ($1, $2, 'IN_SERVICE', ST_SetSRID(ST_MakePoint(-103.3496, 20.6597), 4326)::geography)
    ON CONFLICT (id) DO NOTHING;
    `,
    [stationId, `Test Station ${stationId}`]
  );
}

export async function setInventory(stationId: number, bikes: number, docks: number) {
  await ensureStation(stationId);
  await pool.query(
    `
    INSERT INTO station_inventory (station_id, available_bikes, available_docks, updated_at)
    VALUES ($1, $2, $3, now())
    ON CONFLICT (station_id)
    DO UPDATE SET available_bikes = EXCLUDED.available_bikes,
                  available_docks = EXCLUDED.available_docks,
                  updated_at = now();
    `,
    [stationId, bikes, docks]
  );
}

export async function getInventory(stationId: number) {
  const r = await pool.query(
    `
    SELECT station_id::int as station_id, available_bikes, available_docks
    FROM station_inventory
    WHERE station_id=$1
    `,
    [stationId]
  );

  if (r.rowCount === 0) {
    throw new Error(`Inventory not found for station_id=${stationId}`);
  }

  return r.rows[0];
}
