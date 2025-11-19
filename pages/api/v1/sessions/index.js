import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";

const { createRouter } = require("next-connect");

const router = createRouter();

router.post(postHandler);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.authenticate(
    userInputValues.email,
    userInputValues.password,
  );

  const userSession = await session.create(authenticatedUser.id);
  controller.setSessionCookie(userSession.token, response);

  return response.status(201).json(userSession);
}

export default router.handler(controller.errorHandlers);
