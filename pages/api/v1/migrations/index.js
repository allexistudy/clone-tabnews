import controller from "infra/controller";
import database from "infra/database";
import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { join } from "node:path";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

const migrationRunnerOptions = {
  dryRun: true,
  dir: join("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(_, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const pendingMigrations = await migrationRunner({
      ...migrationRunnerOptions,
      dbClient,
    });

    return response.status(200).json(pendingMigrations);
  } finally {
    await dbClient?.end();
  }
}

async function postHandler(_, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migrationsApplied = await migrationRunner({
      ...migrationRunnerOptions,
      dbClient,
      dryRun: false,
    });

    return response
      .status(migrationsApplied.length > 0 ? 201 : 200)
      .json(migrationsApplied);
  } finally {
    await dbClient?.end();
  }
}
