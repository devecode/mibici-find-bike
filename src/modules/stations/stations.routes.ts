import { FastifyInstance } from "fastify";
import {
  findNearbyStationsHandler,
  createStationHandler,
  deleteStationHandler
} from "./stations.controller.js";

const StationSchema = {
  type: "object",
  required: ["id", "name", "status", "location", "obcn"],
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    status: { type: "string" },
    location: { type: ["string", "null"] },
    obcn: { type: ["string", "null"] }
  }
} as const;

const InventorySchema = {
  type: "object",
  required: ["station_id", "available_bikes", "available_docks"],
  properties: {
    station_id: { type: "number" },
    available_bikes: { type: "number" },
    available_docks: { type: "number" }
  }
} as const;

const NearbyStationItemSchema = {
  type: "object",
  required: [
    "id",
    "name",
    "status",
    "location",
    "obcn",
    "available_bikes",
    "available_docks",
    "distance_m"
  ],
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
} as const;

const CreateStationResponseSchema = {
  type: "object",
  required: ["station", "inventory"],
  properties: {
    station: StationSchema,
    inventory: InventorySchema
  }
} as const;

const DeleteStationResponseSchema = {
  type: "object",
  required: ["ok", "id"],
  properties: {
    ok: { type: "boolean" },
    id: { type: "number" }
  }
} as const;

const ErrorSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: { type: "string" }
  }
} as const;

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
            required: ["count", "items"],
            properties: {
              count: { type: "number" },
              items: {
                type: "array",
                items: NearbyStationItemSchema
              }
            }
          },
          400: ErrorSchema
        }
      }
    },
    findNearbyStationsHandler
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
          201: CreateStationResponseSchema,
          400: ErrorSchema,
          409: ErrorSchema
        }
      }
    },
    createStationHandler
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
          properties: { id: { type: "number" } }
        },
        response: {
          200: DeleteStationResponseSchema,
          404: ErrorSchema,
          400: ErrorSchema
        }
      }
    },
    deleteStationHandler
  );
}
