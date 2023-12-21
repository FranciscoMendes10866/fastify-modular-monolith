import { hash, verify } from "argon2";
import type { FastifyInstance } from "fastify";

//
// Password Plugin
//

export default async function (app: FastifyInstance): Promise<void> {
  app.decorate("hashPassword", async (password) => {
    return await hash(password);
  });

  app.decorate("verifyPassword", async (hash, password) => {
    return await verify(hash, password);
  });
}

//
// Data types declaration
//

declare module "fastify" {
  export interface FastifyInstance {
    hashPassword: (password: string) => Promise<string>;
    verifyPassword: (hash: string, password: string) => Promise<boolean>;
  }
}
