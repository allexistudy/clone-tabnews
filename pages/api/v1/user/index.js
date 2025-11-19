import controller from "infra/controller";
import session from "models/session";
import user from "models/user";

const { createRouter } = require("next-connect");

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { session_id } = request.cookies;

  const foundSession = await session.findByValidToken(session_id);
  const renewedSession = await session.renew(foundSession.id);
  controller.setSessionCookie(renewedSession.token, response);

  const foundUser = await user.findById(foundSession.user_id);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(foundUser);
}
