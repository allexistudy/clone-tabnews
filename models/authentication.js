import { NotFoundError, UnauthorizedError } from "infra/errors";
import user from "./user";
import password from "./password";

async function authenticate(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);
    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Authentication failed",
        action: "Verify if the email or password are correct",
      });
    }

    throw error;
  }

  async function findUserByEmail(providedEmail) {
    try {
      return await user.getByEmail(providedEmail);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Authentication failed",
          action: "Verify if the email or password are correct",
        });
      }

      throw error;
    }
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );
    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Authentication failed",
        action: "Verify if the email or password are correct",
      });
    }
  }
}

const authentication = { authenticate };

export default authentication;
