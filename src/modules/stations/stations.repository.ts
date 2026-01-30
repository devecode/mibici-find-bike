import { pool } from "../../db/pool.js";
import { SQL_NEARBY } from "./stations.sql.js";
import { SQL_CREATE_STATION, SQL_CREATE_INVENTORY, SQL_DELETE_STATION } from "./stations.crud.sql.js";
import type { NearbyParams, CreateStationInput } from "./stations.service.js";

export async function findNearbyStations(p: NearbyParams) {
  const res = await pool.query(SQL_NEARBY, [p.lon, p.lat, p.radius, p.onlyAvailable, p.limit]);
  return res.rows;
}

export async function createStationTx(input: CreateStationInput & { status: string; available_bikes: number; available_docks: number }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const s = await client.query(SQL_CREATE_STATION, [
      input.id,
      input.name,
      input.status,
      input.location ?? null,
      input.obcn ?? null,
      input.lon,
      input.lat
    ]);

    const inv = await client.query(SQL_CREATE_INVENTORY, [
      input.id,
      input.available_bikes,
      input.available_docks
    ]);

    await client.query("COMMIT");

    return { station: s.rows[0], inventory: inv.rows[0] };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteStation(stationId: number) {
  const r = await pool.query(SQL_DELETE_STATION, [stationId]);
  return r.rowCount === 1 ? { ok: true as const, id: r.rows[0].id } : { ok: false as const };
}
