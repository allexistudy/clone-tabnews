import controller from "infra/controller";
import activation from "models/activation";

const { createRouter } = require("next-connect");

const router = createRouter();
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const { token_id } = request.query;
  const activationToken = await activation.findByTokenId(token_id);
  const usedActivationToken = await activation.use(token_id);

  await activation.activateUser(activationToken.user_id);

  return response.status(200).json(usedActivationToken);
}
