CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS stations (
  id         BIGINT PRIMARY KEY,
  name       TEXT NOT NULL,
  obcn       TEXT,
  location   TEXT,
  status     TEXT NOT NULL,
  geom       GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stations_geom_gix
  ON stations
  USING GIST (geom);

CREATE TABLE IF NOT EXISTS station_inventory (
  station_id      BIGINT PRIMARY KEY REFERENCES stations(id) ON DELETE CASCADE,
  available_bikes INT NOT NULL CHECK (available_bikes >= 0),
  available_docks INT NOT NULL CHECK (available_docks >= 0),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservations (
  id           UUID PRIMARY KEY,
  station_id   BIGINT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('ACTIVE','COMPLETED','CANCELLED')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS reservations_station_status_idx
  ON reservations(station_id, status);
