export const SQL_DECREMENT_BIKE = `
  UPDATE station_inventory
  SET available_bikes = available_bikes - 1,
      available_docks = available_docks + 1,
      updated_at = now()
  WHERE station_id = $1
    AND available_bikes > 0
  RETURNING station_id, available_bikes, available_docks;
`;

export const SQL_INCREMENT_BIKE = `
  UPDATE station_inventory
  SET available_bikes = available_bikes + 1,
      available_docks = GREATEST(available_docks - 1, 0),
      updated_at = now()
  WHERE station_id = $1
  RETURNING station_id, available_bikes, available_docks;
`;

export const SQL_INSERT_RESERVATION = `
  INSERT INTO reservations (id, station_id, user_id, status)
  VALUES ($1, $2, $3, 'ACTIVE')
  RETURNING id, station_id, user_id, status, created_at;
`;

export const SQL_COMPLETE_RESERVATION = `
  UPDATE reservations
  SET status = 'COMPLETED',
      completed_at = now()
  WHERE id = $1
    AND station_id = $2
    AND user_id = $3
    AND status = 'ACTIVE'
  RETURNING id, station_id, user_id, status, created_at, completed_at;
`;
