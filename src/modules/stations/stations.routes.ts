import { FastifyInstance } from "fastify";
import { findNearbyStations } from "./stations.service.js";
import { createStation, deleteStation } from "./stations.crud.service.js";

export async function stationsRoutes(app: FastifyInstance) {
  app.get(
    "/stations/nearby",
    {
      schema: {
        tags: ["stations"],
        summary: "Find nearby stations",
        description:
          "Returns stations within a radius (meters) ordered by distance. Uses PostGIS ST_DWithin + GiST index (no O(n)).",
        querystring: {
          type: "object",
          required: ["lat", "lon"],
          properties: {
            lat: { type: "number", description: "Latitude" },
            lon: { type: "number", description: "Longitude" },
            radius: { type: "number", default: 800, minimum: 1, maximum: 20000, description: "Radius in meters" },
            limit: { type: "number", default: 20, minimum: 1, maximum: 100 },
            onlyAvailable: { type: "boolean", default: true, description: "If true, only stations with bikes > 0" }
          }
        },
        response: {
          200: {
            type: "object",
            properties: {
              count: { type: "number" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                    status: { type: "string" },
                    location: { type: ["string", "null"] },
                    obcn: { type: ["string", "null"] },
                    available_bikes: { type: "number" },
                    available_docks: { type: "number" },
                    distance_m: { type: "number" }
                  }
                }
              }
            }
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" }
            }
          }
        }
      }
    },
    async (req, reply) => {
      const q = req.query as Partial<{
        lat: string;
        lon: string;
        radius: string;
        limit: string;
        onlyAvailable: string;
      }>;

      const lat = Number(q.lat);
      const lon = Number(q.lon);
      const radius = q.radius ? Number(q.radius) : 800;
      const limit = q.limit ? Number(q.limit) : 20;
      const onlyAvailable = (q.onlyAvailable ?? "true") === "true";

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

      return { count: rows.length, items: rows };
    }
  );
  app.post(
    "/stations",
    {
      schema: {
        tags: ["stations"],
        summary: "Create a station",
        body: {
          type: "object",
          required: ["id", "name", "lat", "lon"],
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            status: { type: "string", default: "IN_SERVICE" },
            location: { type: ["string", "null"] },
            obcn: { type: ["string", "null"] },
            lat: { type: "number" },
            lon: { type: "number" },
            available_bikes: { type: "number", default: 10, minimum: 0 },
            available_docks: { type: "number", default: 10, minimum: 0 }
          }
        },
        response: {
          201: {
            type: "object",
            properties: {
              station: { type: "object" },
              inventory: { type: "object" }
            }
          },
          400: { type: "object", properties: { error: { type: "string" } } },
          409: { type: "object", properties: { error: { type: "string" } } }
        }
      }
    },
    async (req, reply) => {
      const body = req.body as any;

      const id = Number(body.id);
      const lat = Number(body.lat);
      const lon = Number(body.lon);

      if (!Number.isFinite(id)) return reply.status(400).send({ error: "id must be a number" });
      if (!body.name) return reply.status(400).send({ error: "name is required" });
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
  );

  app.delete(
    "/stations/:id",
    {
      schema: {
        tags: ["stations"],
        summary: "Delete a station",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "number" }
          }
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              id: { type: "number" }
            }
          },
          404: { type: "object", properties: { error: { type: "string" } } },
          400: { type: "object", properties: { error: { type: "string" } } }
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      if (!Number.isFinite(id)) return reply.status(400).send({ error: "id must be a number" });

      const result = await deleteStation(id);
      if (!result.ok) return reply.status(404).send({ error: "STATION_NOT_FOUND" });

      return result;
    }
  );
}
