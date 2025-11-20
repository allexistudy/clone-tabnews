import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";

const { createRouter } = require("next-connect");

const router = createRouter();

router.post(postHandler);
router.delete(deleteHandler);

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

async function deleteHandler(request, response) {
  const { session_id } = request.cookies;
  const foundSession = await session.findByValidToken(session_id);
  const expiredSession = await session.expireById(foundSession.id);

  controller.clearSessionCookie(response);
  return response.status(200).json(expiredSession);
}

export default router.handler(controller.errorHandlers);
