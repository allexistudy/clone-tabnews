import database from "infra/database";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";

export default async function migrations(request, response) {
  const { method } = request;

  if (method !== "GET" && method !== "POST") {
    return response.status(405).json({ error: `Method ${method} not allowed` });
  }

  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migrationsRunnerOptions = {
      dbClient,
      dryRun: true,
      dir: resolve("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    if (method === "GET") {
      const pendingMigrations = await migrationRunner(migrationsRunnerOptions);
      return response.status(200).json(pendingMigrations);
    }

    if (method === "POST") {
      const migrationsApplied = await migrationRunner({
        ...migrationsRunnerOptions,
        dryRun: false,
      });

      return response
        .status(migrationsApplied.length > 0 ? 201 : 200)
        .json(migrationsApplied);
    }
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}
