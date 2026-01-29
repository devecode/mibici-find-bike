import Fastify from "fastify";
import { pool } from "./db/pool.js";
import { stationsRoutes } from "./modules/stations/stations.routes.js";
import { reservationsRoutes } from "./modules/reservations/reservations.routes.js";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

export async function buildApp() {
  const app = Fastify({
    logger: { transport: { target: "pino-pretty" } }
  });

  // Swagger primero
  await app.register(swagger, {
    openapi: {
      info: {
        title: "MiBici Find Bike API",
        version: "1.0.0",
        description: "Spatial search + realtime inventory + reservations"
      }
    }
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs"
    // por default expone /docs/json
  });

  // Routes después
  app.get("/health", async () => ({ ok: true }));

  app.get("/db-health", async () => {
    const r = await pool.query("SELECT 1 as ok");
    return { ok: r.rows[0].ok === 1 };
  });

  app.register(stationsRoutes);
  app.register(reservationsRoutes);

  app.addHook("onClose", async () => {
    await pool.end();
  });

  return app;
}
