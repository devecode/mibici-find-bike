import { FastifyInstance } from "fastify";
import { reserveBike, returnBike } from "./reservations.service.js";

export async function reservationsRoutes(app: FastifyInstance) {
  app.post(
    "/stations/:id/reserve",
    {
      schema: {
        tags: ["reservations"],
        summary: "Reserve a bike",
        description:
          "Atomically decrements available_bikes if > 0 and creates a reservation (ACTIVE). Concurrency-safe.",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "number", description: "Station ID" }
          }
        },
        body: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" }
          }
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              reservation: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  station_id: { type: "number" },
                  user_id: { type: "string" },
                  status: { type: "string" },
                  created_at: { type: "string" }
                }
              },
              inventory: {
                type: "object",
                properties: {
                  station_id: { type: "number" },
                  available_bikes: { type: "number" },
                  available_docks: { type: "number" }
                }
              }
            }
          },
          400: {
            type: "object",
            properties: { error: { type: "string" } }
          },
          409: {
            type: "object",
            properties: { error: { type: "string" } }
          }
        }
      }
    },
    async (req, reply) => {
      const stationId = Number((req.params as any).id);
      const body = req.body as { userId?: string };

      if (!Number.isFinite(stationId)) return reply.status(400).send({ error: "Invalid station id" });
      if (!body?.userId) return reply.status(400).send({ error: "userId is required" });

      const result = await reserveBike(stationId, body.userId);

      if (!result.ok) return reply.status(409).send({ error: result.reason });

      return result;
    }
  );

  app.post(
    "/stations/:id/return",
    {
      schema: {
        tags: ["reservations"],
        summary: "Return a bike",
        description:
          "Completes an ACTIVE reservation and increments available_bikes. Concurrency-safe via transaction.",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "number", description: "Station ID" }
          }
        },
        body: {
          type: "object",
          required: ["userId", "reservationId"],
          properties: {
            userId: { type: "string" },
            reservationId: { type: "string", description: "Reservation UUID" }
          }
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              reservation: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  station_id: { type: "number" },
                  user_id: { type: "string" },
                  status: { type: "string" },
                  created_at: { type: "string" },
                  completed_at: { type: ["string", "null"] }
                }
              },
              inventory: {
                type: "object",
                properties: {
                  station_id: { type: "number" },
                  available_bikes: { type: "number" },
                  available_docks: { type: "number" }
                }
              }
            }
          },
          400: { type: "object", properties: { error: { type: "string" } } },
          409: { type: "object", properties: { error: { type: "string" } } }
        }
      }
    },
    async (req, reply) => {
      const stationId = Number((req.params as any).id);
      const body = req.body as { userId?: string; reservationId?: string };

      if (!Number.isFinite(stationId)) return reply.status(400).send({ error: "Invalid station id" });
      if (!body?.userId) return reply.status(400).send({ error: "userId is required" });
      if (!body?.reservationId) return reply.status(400).send({ error: "reservationId is required" });

      const result = await returnBike(stationId, body.userId, body.reservationId);

      if (!result.ok) return reply.status(409).send({ error: result.reason });

      return result;
    }
  );
}
