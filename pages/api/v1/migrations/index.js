import controller from "infra/controller";
import migrator from "models/migrator";
import { createRouter } from "next-connect";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(_, response) {
  const pendingMigrations = await migrator.listPendingMigrations();
  return response.status(200).json(pendingMigrations);
}

async function postHandler(_, response) {
  const migrationsApplied = await migrator.runPendingMigrations();
  return response
    .status(migrationsApplied.length > 0 ? 201 : 200)
    .json(migrationsApplied);
}
