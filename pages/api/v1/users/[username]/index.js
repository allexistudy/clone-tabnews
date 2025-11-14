import controller from "infra/controller";
import user from "models/user";

const { createRouter } = require("next-connect");

const router = createRouter();
router.get(getHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { username } = request.query;
  const foundUser = await user.getByUsername(username);
  return response.status(200).json(foundUser);
}

async function patchHandler(request, response) {
  const { username } = request.query;
  const updatedUser = await user.update(username, request.body);
  return response.status(200).json(updatedUser);
}
