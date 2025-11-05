import controller from "infra/controller";
import user from "models/user";

const { createRouter } = require("next-connect");

const router = createRouter();
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { username } = request.query;
  const foundUser = await user.getByUsername(username);
  return response.status(200).json(foundUser);
}
