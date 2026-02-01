import * as repo from "./reservations.repository.js";
import { AppError } from "../../common/errors.js";
import { VALIDATION_ERRORS } from "../../common/constants.js";

export async function reserveBike(input: { stationId: unknown; userId?: unknown }) {
  const stationId = Number(input.stationId);
  if (!Number.isFinite(stationId)) {
    throw new AppError("INVALID_STATION_ID", 400, VALIDATION_ERRORS.INVALID_STATION_ID);
  }

  const userId = typeof input.userId === "string" ? input.userId.trim() : "";
  if (!userId) {
    throw new AppError("USER_ID_REQUIRED", 400, VALIDATION_ERRORS.USER_ID_REQUIRED);
  }

  const result = await repo.reserveBikeTx(stationId, userId);

  if (!result.ok) {
    throw new AppError(result.reason, 409, result.reason);
  }

  return result;
}

export async function returnBike(input: { stationId: unknown; userId?: unknown; reservationId?: unknown }) {
  const stationId = Number(input.stationId);
  if (!Number.isFinite(stationId)) {
    throw new AppError("INVALID_STATION_ID", 400, VALIDATION_ERRORS.INVALID_STATION_ID);
  }

  const userId = typeof input.userId === "string" ? input.userId.trim() : "";
  if (!userId) {
    throw new AppError("USER_ID_REQUIRED", 400, VALIDATION_ERRORS.USER_ID_REQUIRED);
  }

  const reservationId = typeof input.reservationId === "string" ? input.reservationId.trim() : "";
  if (!reservationId) {
    throw new AppError("RESERVATION_ID_REQUIRED", 400, VALIDATION_ERRORS.RESERVATION_ID_REQUIRED);
  }

  const result = await repo.returnBikeTx(stationId, userId, reservationId);

  if (!result.ok) {
    throw new AppError(result.reason, 409, result.reason);
  }

  return result;
}
