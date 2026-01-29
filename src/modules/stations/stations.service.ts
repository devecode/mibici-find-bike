import { pool } from "../../db/pool.js";
import { SQL_NEARBY } from "./stations.sql.js";

export type NearbyParams = {
  lat: number;
  lon: number;
  radius: number;
  limit: number;
  onlyAvailable: boolean;
};

export async function findNearbyStations(p: NearbyParams) {
  const res = await pool.query(SQL_NEARBY, [
    p.lon,
    p.lat,
    p.radius,
    p.onlyAvailable,
    p.limit
  ]);

  return res.rows;
}
