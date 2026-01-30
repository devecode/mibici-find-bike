import { FastifyReply, FastifyRequest } from "fastify";
import { reserveBike, returnBike } from "./reservations.service.js";

export async function reserveBikeHandler(req: FastifyRequest, reply: FastifyReply) {
  const stationId = Number((req.params as any).id);
  const body = req.body as { userId?: string };

  if (!Number.isFinite(stationId)) return reply.status(400).send({ error: "Invalid station id" });
  if (!body?.userId) return reply.status(400).send({ error: "userId is required" });

  const result = await reserveBike({ stationId, userId: body.userId });

  if (!result.ok) return reply.status(409).send({ error: result.reason });
  return reply.status(200).send(result);
}

export async function returnBikeHandler(req: FastifyRequest, reply: FastifyReply) {
  const stationId = Number((req.params as any).id);
  const body = req.body as { userId?: string; reservationId?: string };

  if (!Number.isFinite(stationId)) return reply.status(400).send({ error: "Invalid station id" });
  if (!body?.userId) return reply.status(400).send({ error: "userId is required" });
  if (!body?.reservationId) return reply.status(400).send({ error: "reservationId is required" });

  const result = await returnBike({
    stationId,
    userId: body.userId,
    reservationId: body.reservationId
  });

  if (!result.ok) return reply.status(409).send({ error: result.reason });
  return reply.status(200).send(result);
}
