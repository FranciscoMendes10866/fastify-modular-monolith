import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { sessions, users } from "../../../entities/schema";
import { authGuard } from "../../../helpers/authorization";

export default async function (app: FastifyInstance): Promise<void> {
  app.post("/sign-up", {
    schema: {
      body: {
        type: "object",
        properties: {
          username: { type: "string" },
          password: { type: "string" },
        },
        required: ["username", "password"],
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: { username: string; password: string } }>,
      reply,
    ) => {
      const { username, password } = request.body;

      const datum = app.db.select().from(users).where(eq(users.username, username)).get();
      if (datum) return reply.code(409).send({ message: "Username already taken." });

      const hashedPassword = await app.hashPassword(password);

      try {
        const user = app.db
          .insert(users)
          .values({ username, password: hashedPassword })
          .returning()
          .get();

        const session = app.db
          .insert(sessions)
          .values({ expiresAt: app.sessionArtisan(), userId: user.id })
          .returning()
          .get();

        return reply.code(200).send({
          session: {
            accessToken: app.accessTokenArtisan({ id: user.id }),
            sessionId: session.id,
          },
        });
      } catch {
        throw new Error("An error occurred while creating the account.");
      }
    },
  });

  app.post("/sign-in", {
    schema: {
      body: {
        type: "object",
        properties: {
          username: { type: "string" },
          password: { type: "string" },
        },
        required: ["username", "password"],
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: { username: string; password: string } }>,
      reply,
    ) => {
      const { username, password } = request.body;

      const user = app.db.select().from(users).where(eq(users.username, username)).get();
      if (!user) return reply.code(400).send({ message: "User does not exist." });

      const isValid = await app.verifyPassword(user.password, password);
      if (!isValid) return reply.code(400).send({ message: "Invalid credentials." });

      try {
        const session = app.db
          .insert(sessions)
          .values({ expiresAt: app.sessionArtisan(), userId: user.id })
          .returning()
          .get();

        return reply.code(200).send({
          session: {
            accessToken: app.accessTokenArtisan({ id: user.id }),
            sessionId: session.id,
          },
        });
      } catch {
        throw new Error("An error occurred while creating the session.");
      }
    },
  });

  app.put("/renew-session", {
    schema: {
      body: {
        type: "object",
        properties: {
          sessionId: { type: "integer" },
        },
        required: ["sessionId"],
      },
    },
    handler: async (request: FastifyRequest<{ Body: { sessionId: number } }>, reply) => {
      const sessionId = request.body.sessionId;

      const session = app.db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
      if (!session) return reply.code(401).send({ message: "Invalid session." });

      const isSessionExpired = app.verifySession(session.expiresAt);
      if (isSessionExpired) {
        try {
          app.db.delete(sessions).where(eq(sessions.id, sessionId)).run();
          return reply.code(403).send({ message: "Expired session." });
        } catch {
          throw new Error("An error occurred while removing the current session.");
        }
      }

      try {
        app.db.delete(sessions).where(eq(sessions.id, session.id)).run();
        const newSession = app.db
          .insert(sessions)
          .values({ expiresAt: app.sessionArtisan(), userId: session.userId })
          .returning()
          .get();

        return reply.code(200).send({
          accessToken: app.accessTokenArtisan({ id: newSession.userId }),
          sessionId: newSession.id,
        });
      } catch {
        throw new Error("An error occurred while renewing the session.");
      }
    },
  });

  app.delete("/sign-out", {
    schema: {
      body: {
        type: "object",
        properties: {
          sessionId: { type: "integer" },
          clearAll: { type: "boolean" },
        },
        required: ["sessionId"],
      },
    },
    preHandler: (req, _, done) => authGuard(app.verifyJwt, req, done),
    handler: async (
      request: FastifyRequest<{ Body: { sessionId: number; clearAll?: boolean } }>,
      reply,
    ) => {
      const { sessionId, clearAll = false } = request.body;
      const userId = request.user?.id as number;

      const session = app.db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
      if (!session || session.userId !== userId) {
        return reply
          .code(403)
          .send({ message: "You don't have permissions to perform the operation." });
      }

      const sql = clearAll ? eq(sessions.userId, session.userId) : eq(sessions.id, sessionId);
      app.db.delete(sessions).where(sql).run();

      return reply.code(200).send({ message: "Ok" });
    },
  });
}
