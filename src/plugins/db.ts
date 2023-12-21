import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import type { FastifyInstance } from "fastify";

import * as schema from "../entities/schema";

export type DbClient = BetterSQLite3Database<typeof schema>;

const client: DbClient = drizzle(new Database("local.db"), {
  schema,
});

//
// Database Client Plugin
//

export default async function (app: FastifyInstance): Promise<void> {
  app.decorate("db", client);
}

//
// Data types declaration
//

declare module "fastify" {
  export interface FastifyInstance {
    db: DbClient;
  }
}
