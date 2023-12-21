import closeWithGrace from "close-with-grace";

import appFactory from "./app";

async function main() {
  const app = await appFactory();

  await app.listen({ port: 3333 });

  closeWithGrace(async ({ err }) => {
    if (err) {
      app.log.error({ err }, "Unexpected error encountered. Please check the logs for details.");
    }
    app.log.info("Shutting down gracefully.");
    await app.close();
  });
}

void main();
