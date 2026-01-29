export const SQL_NEARBY = `
  SELECT
    s.id::int as id,
    s.name,
    s.status,
    s.location,
    s.obcn,
    i.available_bikes,
    i.available_docks,
    ST_Distance(
      s.geom,
      ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
    ) AS distance_m
  FROM stations s
  JOIN station_inventory i ON i.station_id = s.id
  WHERE ST_DWithin(
    s.geom,
    ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
    $3
  )
  AND ($4::boolean = false OR i.available_bikes > 0)
  ORDER BY distance_m
  LIMIT $5;
`;
