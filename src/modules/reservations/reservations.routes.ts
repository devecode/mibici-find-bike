import { FastifyInstance } from "fastify";
import { reserveBikeHandler, returnBikeHandler } from "./reservations.controller.js";

const ReservationResponseSchema = {
  type: "object",
  required: ["ok", "reservation", "inventory"],
  properties: {
    ok: { type: "boolean" },
    reservation: {
      type: "object",
      required: ["id", "station_id", "user_id", "status", "created_at"],
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
      required: ["station_id", "available_bikes", "available_docks"],
      properties: {
        station_id: { type: "number" },
        available_bikes: { type: "number" },
        available_docks: { type: "number" }
      }
    }
  }
};

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
          properties: { id: { type: "number", description: "Station ID" } }
        },
        body: {
          type: "object",
          required: ["userId"],
          properties: { userId: { type: "string" } }
        },
        response: {
          200: ReservationResponseSchema,
          400: { type: "object", properties: { error: { type: "string" } } },
          409: { type: "object", properties: { error: { type: "string" } } }
        }
      }
    },
    reserveBikeHandler
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
          properties: { id: { type: "number", description: "Station ID" } }
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
          200: ReservationResponseSchema,
          400: { type: "object", properties: { error: { type: "string" } } },
          409: { type: "object", properties: { error: { type: "string" } } }
        }
      }
    },
    returnBikeHandler
  );
}
