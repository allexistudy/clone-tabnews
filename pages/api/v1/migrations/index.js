import database from "infra/database";
import migrationRunner from "node-pg-migrate";
import { join } from "node:path";

export default async function migrations(request, response) {
  const { method } = request;

  if (method !== "GET" && method !== "POST") {
    return response.status(405).end();
  }

  const dbClient = await database.getNewClient();

  const migrationsRunnerOptions = {
    dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  if (method === "GET") {
    const pendingMigrations = await migrationRunner(migrationsRunnerOptions);
    await dbClient.end();
    return response.status(200).json(pendingMigrations);
  }

  if (method === "POST") {
    const migrationsApplied = await migrationRunner({
      ...migrationsRunnerOptions,
      dryRun: false,
    });
    await dbClient.end();
    return response
      .status(migrationsApplied.length > 0 ? 201 : 200)
      .json(migrationsApplied);
  }
}
