const {
  MethodNotAllowedError,
  InternalServerError,
  ValidationError,
  NotFoundError,
} = require("./errors");

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  return response.status(publicErrorObject.status_code).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  if (error instanceof ValidationError || error instanceof NotFoundError) {
    return response.status(error.status_code).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
    statusCode: error.status_code,
  });
  console.error(publicErrorObject);
  return response.status(publicErrorObject.status_code).json(publicErrorObject);
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
