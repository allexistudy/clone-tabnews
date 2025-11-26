import * as cookie from "cookie";
import authorization from "models/authorization";
import session from "models/session";
import user from "models/user";
const {
  MethodNotAllowedError,
  InternalServerError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} = require("./errors");

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  return response.status(publicErrorObject.status_code).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.status_code).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    return response.status(error.status_code).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });
  console.error(publicErrorObject);
  return response.status(publicErrorObject.status_code).json(publicErrorObject);
}

function setSessionCookie(sessionToken, response) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(request, response, next) {
  const sessionId = request.cookies?.session_id;
  if (sessionId) {
    await injectAuthenticatedUser(request);
  } else {
    injectAnonymousUser(request);
  }
  return next();

  async function injectAuthenticatedUser(request) {
    const sessionToken = request.cookies?.session_id;
    const sessionObject = await session.findByValidToken(sessionToken);
    const userObject = await user.findById(sessionObject.user_id);

    request.context = {
      ...request.context,
      user: userObject,
    };
  }

  function injectAnonymousUser(request) {
    const anonymousUserObject = {
      features: ["read:activation_token", "create:session", "create:user"],
    };

    request.context = {
      ...request.context,
      user: anonymousUserObject,
    };
  }
}

function canRequest(feature) {
  return (request, response, next) => {
    const userTryingToAccess = request.context.user;

    if (authorization.can(userTryingToAccess, feature)) {
      return next();
    }

    throw new ForbiddenError({
      message: "You are not authorized to access this resource.",
      action: "Verify if you have the required permissions.",
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
