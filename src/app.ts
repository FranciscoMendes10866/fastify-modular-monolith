import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fastify, { type FastifyServerOptions } from "fastify";
import autoLoad from "@fastify/autoload";
import cors from '@fastify/cors'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function appFactory(opts?: FastifyServerOptions) {
  const app = fastify(opts);
  await app.register(cors)

  await app.register(autoLoad, {
    dir: join(__dirname, "plugins"),
    encapsulate: false,
  });
  await app.register(autoLoad, {
    dir: join(__dirname, "domains"),
    encapsulate: false,
    maxDepth: 1,
  });

  return app;
}
