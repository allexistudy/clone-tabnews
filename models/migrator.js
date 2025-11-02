import database from "infra/database";
import { join } from "node:path";
import migrationRunner from "node-pg-migrate";
import { ServiceError } from "infra/errors";

const migrationRunnerOptions = {
  dryRun: true,
  dir: join("infra", "migrations"),
  direction: "up",
  log: () => {},
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const pendingMigrations = await migrationRunner({
      ...migrationRunnerOptions,
      dbClient,
    });

    return pendingMigrations;
  } catch (error) {
    throw new ServiceError({
      cause: error,
      message: "Failed to list pending migrations.",
    });
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migrationsApplied = await migrationRunner({
      ...migrationRunnerOptions,
      dbClient,
      dryRun: false,
    });

    return migrationsApplied;
  } catch (error) {
    throw new ServiceError({
      cause: error,
      message: "Failed to run pending migrations.",
    });
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
