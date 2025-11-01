import database from "infra/database";
import { join } from "node:path";
import migrationRunner from "node-pg-migrate";

const migrationRunnerOptions = {
  dryRun: true,
  dir: join("infra", "migrations"),
  direction: "up",
  verbose: true,
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
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
