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

export async function findNearbyStations(p: NearbyParams) {
  return repo.findNearbyStations(p);
}

export async function createStation(input: CreateStationInput) {
  const status = input.status ?? "IN_SERVICE";
  const bikes = input.available_bikes ?? 10;
  const docks = input.available_docks ?? 10;

  return repo.createStationTx({
    ...input,
    status,
    available_bikes: bikes,
    available_docks: docks
  });
}

export async function deleteStation(stationId: number) {
  return repo.deleteStation(stationId);
}
