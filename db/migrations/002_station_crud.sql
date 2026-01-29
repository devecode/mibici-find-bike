ALTER TABLE station_inventory
  ADD CONSTRAINT station_inventory_station_fk
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_station_fk
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE;
