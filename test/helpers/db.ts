import { pool } from "../../src/db/pool.js";

export async function setInventory(stationId: number, bikes: number, docks: number) {
  await pool.query(
    "UPDATE station_inventory SET available_bikes=$2, available_docks=$3, updated_at=now() WHERE station_id=$1",
    [stationId, bikes, docks]
  );
}

export async function getInventory(stationId: number) {
  const r = await pool.query(
    "SELECT station_id::int as station_id, available_bikes, available_docks FROM station_inventory WHERE station_id=$1",
    [stationId]
  );
  return r.rows[0];
}
