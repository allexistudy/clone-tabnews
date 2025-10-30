export class InternalServerError extends Error {
  constructor({ cause }) {
    super("An internal server error occurred.", { cause });
    this.name = "InternalServerError";
    this.action = "Contact support.";
    this.status_code = 500;
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
