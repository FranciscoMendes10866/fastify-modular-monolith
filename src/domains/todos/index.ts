import { dirname, join } from "path";
import { fileURLToPath } from "url";
import autoLoad from "@fastify/autoload";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function (app: FastifyInstance, opts?: FastifyPluginOptions) {
  app.register(autoLoad, {
    dir: join(__dirname, "routes"),
    options: {
      prefix: opts?.prefix,
    },
  });
}
