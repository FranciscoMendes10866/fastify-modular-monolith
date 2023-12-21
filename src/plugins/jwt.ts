import dayjs from "dayjs";
import type { FastifyInstance } from "fastify";
import { sign, verify } from "jsonwebtoken";

interface JwtPayload {
  id: number;
}

const SECRET = "secret";

//
// JWT Plugin
//

export default async function (app: FastifyInstance): Promise<void> {
  app.decorateRequest("user", null);

  app.decorate("accessTokenArtisan", (payload) => {
    return sign(payload, SECRET, { expiresIn: 15 * 60 }); // 15 min
  });

  app.decorate("verifyJwt", (token) => {
    return verify(token, SECRET) as JwtPayload;
  });

  app.decorate("sessionArtisan", () => {
    return dayjs().add(7, "days").unix();
  });

  app.decorate("verifySession", (expiresAt: number) => {
    return dayjs().isAfter(dayjs.unix(expiresAt));
  });
}

//
// Data types declaration
//

declare module "fastify" {
  export interface FastifyRequest {
    user: JwtPayload | null;
  }

  export interface FastifyInstance {
    accessTokenArtisan: (payload: JwtPayload) => string;
    verifyJwt: (token: string) => JwtPayload;
    sessionArtisan: () => number;
    verifySession: (expiresAt: number) => boolean;
  }
}
