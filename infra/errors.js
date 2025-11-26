export class InternalServerError extends Error {
  constructor({ cause, message, statusCode }) {
    super(message || "An internal server error occurred.", { cause });
    this.name = "InternalServerError";
    this.action = "Contact support.";
    this.status_code = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Method not allowed for this endpoint.");
    this.name = "MethodNotAllowedError";
    this.action = "Verify if HTTP method is correct for this endpoint.";
    this.status_code = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "A service error occurred.", { cause });
    this.name = "ServiceError";
    this.action = "Verify if the service is available.";
    this.status_code = 503;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

export class ValidationError extends Error {
  constructor({ message, action, status_code }) {
    super(message || "A validation error occurred.");
    this.name = "ValidationError";
    this.action = action || "Verify if the data is valid.";
    this.status_code = status_code || 400;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}
export class NotFoundError extends Error {
  constructor({ message, action, status_code }) {
    super(message || "The requested resource was not found.");
    this.name = "NotFoundError";
    this.action = action || "Verify if the resource exists.";
    this.status_code = status_code || 404;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

export class UnauthorizedError extends Error {
  constructor({ message, action, status_code }) {
    super(message || "Authentication failed.");
    this.name = "UnauthorizedError";
    this.action = action || "Verify if the email and password are correct.";
    this.status_code = status_code || 401;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

export class ForbiddenError extends Error {
  constructor({ message, action, status_code }) {
    super(message || "Forbidden.");
    this.name = "ForbiddenError";
    this.action = action || "Verify if you have the required permissions.";
    this.status_code = status_code || 403;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}
