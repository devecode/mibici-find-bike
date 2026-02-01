import { FastifyReply, FastifyRequest } from "fastify";
import * as service from "./reservations.service.js";
import { isAppError } from "../../common/errors.js";

export async function reserveBikeHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await service.reserveBike({
      stationId: (req.params as any).id,
      userId: (req.body as any)?.userId
    });

    return reply.status(200).send(result);
  } catch (e) {
    if (isAppError(e)) return reply.status(e.status).send({ error: e.code });
    throw e;
  }
}

export async function returnBikeHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await service.returnBike({
      stationId: (req.params as any).id,
      userId: (req.body as any)?.userId,
      reservationId: (req.body as any)?.reservationId
    });

    return reply.status(200).send(result);
  } catch (e) {
    if (isAppError(e)) return reply.status(e.status).send({ error: e.code });
    throw e;
  }
}
