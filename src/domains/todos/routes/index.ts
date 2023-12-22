import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { todos } from "../../../entities/schema";
import { authGuard } from "../../../helpers/authorization";

export default async function (app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", (request, _, done) => {
    return authGuard(app.verifyJwt, request, done);
  });

  app.get("/", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.id as number;
      const result = app.db.select().from(todos).where(eq(todos.userId, userId)).all();
      return reply.code(201).send(result);
    },
  });

  app.get("/:id", {
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
    },
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const result = app.db
        .select()
        .from(todos)
        .where(eq(todos.id, Number(request.params.id)))
        .get();
      return reply.code(200).send(result);
    },
  });

  app.post("/", {
    schema: {
      body: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
        },
        required: ["title", "content"],
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: { title: string; content: string } }>,
      reply: FastifyReply,
    ) => {
      const userId = request.user?.id as number;
      const result = app.db
        .insert(todos)
        .values({ ...request.body, userId })
        .returning()
        .get();
      return reply.code(200).send(result);
    },
  });

  app.put("/:id", {
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
        },
        required: ["title", "content"],
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: { title: string; content: string }; Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const result = app.db
        .update(todos)
        .set(request.body)
        .where(eq(todos.id, Number(request.params.id)))
        .returning()
        .get();
      return reply.code(200).send(result);
    },
  });

  app.delete("/:id", {
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
    },
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const result = app.db
        .delete(todos)
        .where(eq(todos.id, Number(request.params.id)))
        .run();
      if (result.changes < 1) throw new Error("An error occurred during the operation.");
      return reply.code(200).send(result);
    },
  });
}
