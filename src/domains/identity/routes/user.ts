import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { users } from "../../../entities/schema";
import { authGuard } from "../../../helpers/authorization";

export default async function (app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", (request, _, done) => {
    return authGuard(app.verifyJwt, request, done);
  });

  app.get("/details", async (request, reply) => {
    const userId = request.user?.id as number;
    const user = app.db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, userId))
      .get();
    return reply.code(200).send(user);
  });
}
