import { AppError } from "../../common/errors.js";
import { DOMAIN_ERRORS, LIMITS, STATION_STATUS, VALIDATION_ERRORS } from "../../common/constants.js";
import * as repo from "./stations.repository.js";

export type NearbyParams = {
  lat: number;
  lon: number;
  radius: number;
  limit: number;
  onlyAvailable: boolean;
};

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

export async function findNearbyStations(input: {
  lat: unknown;
  lon: unknown;
  radius?: unknown;
  limit?: unknown;
  onlyAvailable?: unknown;
}) {
  const lat = Number(input.lat);
  const lon = Number(input.lon);

  const radius =
    input.radius !== undefined ? Number(input.radius) : LIMITS.RADIUS_DEFAULT_M;

  const limit =
    input.limit !== undefined ? Number(input.limit) : LIMITS.LIMIT_DEFAULT;

  const onlyAvailable =
    typeof input.onlyAvailable === "boolean"
      ? input.onlyAvailable
      : (input.onlyAvailable ?? "true") === "true";

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new AppError("BAD_QUERY", 400, VALIDATION_ERRORS.LAT_LON_REQUIRED);
  }
  if (!Number.isFinite(radius) || radius <= 0 || radius > LIMITS.RADIUS_MAX_M) {
    throw new AppError("BAD_QUERY", 400, VALIDATION_ERRORS.RADIUS_RANGE);
  }
  if (!Number.isFinite(limit) || limit <= 0 || limit > LIMITS.LIMIT_MAX) {
    throw new AppError("BAD_QUERY", 400, VALIDATION_ERRORS.LIMIT_RANGE);
  }

  const rows = await repo.findNearbyStations({
    lat,
    lon,
    radius,
    limit,
    onlyAvailable
  });

  return { count: rows.length, items: rows };
}

export async function createStation(input: any) {
  const id = Number(input?.id);
  const lat = Number(input?.lat);
  const lon = Number(input?.lon);

  if (!Number.isFinite(id)) {
    throw new AppError("BAD_BODY", 400, VALIDATION_ERRORS.ID_MUST_BE_NUMBER);
  }
  if (!input?.name) {
    throw new AppError("BAD_BODY", 400, VALIDATION_ERRORS.NAME_REQUIRED);
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new AppError("BAD_BODY", 400, VALIDATION_ERRORS.LAT_LON_NUMBERS);
  }

  const status = String(input.status ?? STATION_STATUS.IN_SERVICE);
  const available_bikes =
    input.available_bikes !== undefined ? Number(input.available_bikes) : LIMITS.DEFAULT_BIKES;

  const available_docks =
    input.available_docks !== undefined ? Number(input.available_docks) : LIMITS.DEFAULT_DOCKS;

  if (!Number.isFinite(available_bikes) || available_bikes < 0) {
    throw new AppError("BAD_BODY", 400, "available_bikes must be a number >= 0");
  }
  if (!Number.isFinite(available_docks) || available_docks < 0) {
    throw new AppError("BAD_BODY", 400, "available_docks must be a number >= 0");
  }

  try {
    return await repo.createStationTx({
      id,
      name: String(input.name),
      status,
      location: input.location ?? null,
      obcn: input.obcn ?? null,
      lat,
      lon,
      available_bikes,
      available_docks
    });
  } catch (e: any) {
    if (e?.code === "23505") {
      throw new AppError(DOMAIN_ERRORS.STATION_ALREADY_EXISTS, 409);
    }
    throw e;
  }
}

export async function deleteStation(stationIdRaw: unknown) {
  const id = Number(stationIdRaw);
  if (!Number.isFinite(id)) {
    throw new AppError("BAD_PARAM", 400, VALIDATION_ERRORS.ID_MUST_BE_NUMBER);
  }

  const result = await repo.deleteStation(id);

  if (!result.ok) {
    throw new AppError(DOMAIN_ERRORS.STATION_NOT_FOUND, 404);
  }

  return result;
}
