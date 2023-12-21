import { type FastifyInstance, errorCodes } from "fastify";

//
// Error Handler Plugin
//

export default async function (app: FastifyInstance): Promise<void> {
  app.setErrorHandler((err, _, reply) => {
    if (err instanceof errorCodes.FST_ERR_BAD_STATUS_CODE) {
      app.log.error(err);
      reply.status(500).send({ ok: false });
    } else {
      reply.send(err);
    }
  });
}
