import { pool } from "../../db/pool.js";
import { SQL_CREATE_STATION, SQL_CREATE_INVENTORY, SQL_DELETE_STATION } from "./stations.crud.sql.js";

export type CreateStationInput = {
  id: number;
  name: string;
  status?: string;
  location?: string | null;
  obcn?: string | null;
  lat: number;
  lon: number;
  available_bikes?: number;
  available_docks?: number;
};

export async function createStation(input: CreateStationInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const status = input.status ?? "IN_SERVICE";
    const bikes = input.available_bikes ?? 10;
    const docks = input.available_docks ?? 10;

    const s = await client.query(SQL_CREATE_STATION, [
      input.id,
      input.name,
      status,
      input.location ?? null,
      input.obcn ?? null,
      input.lon,
      input.lat
    ]);

    const inv = await client.query(SQL_CREATE_INVENTORY, [input.id, bikes, docks]);

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
