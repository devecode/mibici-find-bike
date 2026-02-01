import { FastifyReply, FastifyRequest } from "fastify";
import * as service from "./stations.service.js";
import { isAppError } from "../../common/errors.js";

export async function findNearbyStationsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await service.findNearbyStations(req.query as any);
    return reply.status(200).send(result);
  } catch (e) {
    if (isAppError(e)) return reply.status(e.status).send({ error: e.message });
    throw e;
  }
}

export async function createStationHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await service.createStation(req.body as any);
    return reply.status(201).send(result);
  } catch (e) {
    if (isAppError(e)) return reply.status(e.status).send({ error: e.code });
    throw e;
  }
}

export async function deleteStationHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await service.deleteStation((req.params as any).id);
    return reply.status(200).send(result);
  } catch (e) {
    if (isAppError(e)) return reply.status(e.status).send({ error: e.code });
    throw e;
  }
}
