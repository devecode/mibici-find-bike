export const SQL_CREATE_STATION = `
  INSERT INTO stations (id, name, status, location, obcn, geom)
  VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    ST_SetSRID(ST_MakePoint($6,$7),4326)::geography
  )
  RETURNING id::int as id, name, status, location, obcn;
`;

export const SQL_CREATE_INVENTORY = `
  INSERT INTO station_inventory (station_id, available_bikes, available_docks)
  VALUES ($1, $2, $3)
  RETURNING station_id::int as station_id, available_bikes, available_docks;
`;

export const SQL_DELETE_STATION = `
  DELETE FROM stations
  WHERE id = $1
  RETURNING id::int as id;
`;
