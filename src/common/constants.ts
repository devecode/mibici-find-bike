export const STATION_STATUS = {
  IN_SERVICE: "IN_SERVICE"
} as const;

export const LIMITS = {
  RADIUS_DEFAULT_M: 800,
  RADIUS_MAX_M: 20000,
  LIMIT_DEFAULT: 20,
  LIMIT_MAX: 100,
  DEFAULT_BIKES: 10,
  DEFAULT_DOCKS: 10
} as const;

export const DOMAIN_ERRORS = {
  STATION_ALREADY_EXISTS: "STATION_ALREADY_EXISTS",
  STATION_NOT_FOUND: "STATION_NOT_FOUND"
} as const;

export const VALIDATION_ERRORS = {
  INVALID_STATION_ID: "Invalid station id",
  USER_ID_REQUIRED: "userId is required",
  RESERVATION_ID_REQUIRED: "reservationId is required",
  LAT_LON_REQUIRED: "lat and lon are required numbers",
  RADIUS_RANGE: `radius must be between 1 and ${LIMITS.RADIUS_MAX_M} meters`,
  LIMIT_RANGE: `limit must be between 1 and ${LIMITS.LIMIT_MAX}`,
  ID_MUST_BE_NUMBER: "id must be a number",
  NAME_REQUIRED: "name is required",
  LAT_LON_NUMBERS: "lat and lon must be numbers"
} as const;
