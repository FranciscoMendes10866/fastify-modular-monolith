import type { FastifyInstance, FastifyRequest, HookHandlerDoneFunction } from "fastify";

export function authGuard(
  verifyJwt: FastifyInstance["verifyJwt"],
  request: FastifyRequest,
  done: HookHandlerDoneFunction,
) {
  try {
    const authorization = request.headers.authorization;
    const accessToken = authorization?.replace("Bearer ", "");
    if (!accessToken) throw new Error("Not authorized.");

    const payload = verifyJwt(accessToken);
    if (!payload.id) throw new Error("Not authorized.");

    request.user = payload;
    done();
  } catch (cause) {
    done(cause as Error);
  }
}
