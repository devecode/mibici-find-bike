import { pool } from "../../db/pool.js";
import { v4 as uuidv4 } from "uuid";
import {
  SQL_DECREMENT_BIKE,
  SQL_INCREMENT_BIKE,
  SQL_INSERT_RESERVATION,
  SQL_COMPLETE_RESERVATION
} from "./reservations.sql.js";

export async function reserveBike(stationId: number, userId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const inv = await client.query(SQL_DECREMENT_BIKE, [stationId]);
    if (inv.rowCount === 0) {
      await client.query("ROLLBACK");
      return { ok: false as const, reason: "NO_BIKES_AVAILABLE" as const };
    }

    const reservationId = uuidv4();
    const r = await client.query(SQL_INSERT_RESERVATION, [reservationId, stationId, userId]);

    await client.query("COMMIT");

    return {
      ok: true as const,
      reservation: r.rows[0],
      inventory: inv.rows[0]
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function returnBike(stationId: number, userId: string, reservationId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const completed = await client.query(SQL_COMPLETE_RESERVATION, [reservationId, stationId, userId]);
    if (completed.rowCount === 0) {
      await client.query("ROLLBACK");
      return { ok: false as const, reason: "RESERVATION_NOT_ACTIVE_OR_NOT_FOUND" as const };
    }

    const inv = await client.query(SQL_INCREMENT_BIKE, [stationId]);

    await client.query("COMMIT");

    return {
      ok: true as const,
      reservation: completed.rows[0],
      inventory: inv.rows[0]
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
