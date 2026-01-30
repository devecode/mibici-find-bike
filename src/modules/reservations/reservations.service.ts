import * as repo from "./reservations.repository.js";

export async function reserveBike(input: { stationId: number; userId: string }) {
  return repo.reserveBikeTx(input.stationId, input.userId);
}

export async function returnBike(input: { stationId: number; userId: string; reservationId: string }) {
  return repo.returnBikeTx(input.stationId, input.userId, input.reservationId);
}
