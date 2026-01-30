import { FastifyReply, FastifyRequest } from "fastify";
import { findNearbyStations, createStation, deleteStation } from "./stations.service.js";

export async function findNearbyStationsHandler(req: FastifyRequest, reply: FastifyReply) {
  const q = req.query as Partial<{
    lat: string | number;
    lon: string | number;
    radius: string | number;
    limit: string | number;
    onlyAvailable: string | boolean;
  }>;

  const lat = Number(q.lat);
  const lon = Number(q.lon);
  const radius = q.radius !== undefined ? Number(q.radius) : 800;
  const limit = q.limit !== undefined ? Number(q.limit) : 20;

  const onlyAvailable =
    typeof q.onlyAvailable === "boolean"
      ? q.onlyAvailable
      : (q.onlyAvailable ?? "true") === "true";

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return reply.status(400).send({ error: "lat and lon are required numbers" });
  }
  if (!Number.isFinite(radius) || radius <= 0 || radius > 20000) {
    return reply.status(400).send({ error: "radius must be between 1 and 20000 meters" });
  }
  if (!Number.isFinite(limit) || limit <= 0 || limit > 100) {
    return reply.status(400).send({ error: "limit must be between 1 and 100" });
  }

  const rows = await findNearbyStations({ lat, lon, radius, limit, onlyAvailable });
  return reply.status(200).send({ count: rows.length, items: rows });
}

export async function createStationHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as any;

  const id = Number(body?.id);
  const lat = Number(body?.lat);
  const lon = Number(body?.lon);

  if (!Number.isFinite(id)) return reply.status(400).send({ error: "id must be a number" });
  if (!body?.name) return reply.status(400).send({ error: "name is required" });
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return reply.status(400).send({ error: "lat and lon must be numbers" });
  }

  try {
    const created = await createStation({
      id,
      name: String(body.name),
      status: body.status,
      location: body.location ?? null,
      obcn: body.obcn ?? null,
      lat,
      lon,
      available_bikes: body.available_bikes,
      available_docks: body.available_docks
    });

    return reply.status(201).send(created);
  } catch (e: any) {
    if (e?.code === "23505") return reply.status(409).send({ error: "STATION_ALREADY_EXISTS" });
    throw e;
  }
}

export async function deleteStationHandler(req: FastifyRequest, reply: FastifyReply) {
  const id = Number((req.params as any).id);
  if (!Number.isFinite(id)) return reply.status(400).send({ error: "id must be a number" });

  const result = await deleteStation(id);
  if (!result.ok) return reply.status(404).send({ error: "STATION_NOT_FOUND" });

  return reply.status(200).send(result);
}
