import database from "infra/database";
import email from "infra/email";
import { ForbiddenError, NotFoundError } from "infra/errors";
import webserver from "infra/webserver";
import user from "./user";
import authorization from "./authorization";

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Sara <contato@sara.dev.br>",
    to: user.email,
    subject: "Activate your account!",
    text: `Hello ${user.username},

Click here to activate your account:

${webserver.origin()}/register/activate/${activationToken.id}

Best regards,
Sara Team`,
  });
}

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes
async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const token = await runInsertQuery(userId, expiresAt);
  return token;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `
      INSERT INTO
        user_activation_tokens (user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
      ;`,
      values: [userId, expiresAt],
    });
    return result.rows[0];
  }
}

async function findByTokenId(tokenId) {
  const activationToken = await runSelectQuery(tokenId);
  return activationToken;

  async function runSelectQuery(tokenId) {
    const result = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1
        AND expires_at > NOW()
        AND used_at IS NULL
      LIMIT
        1
      ;`,
      values: [tokenId],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "Activation token not found",
        action: "Try a different token",
      });
    }

    return result.rows[0];
  }
}

async function use(tokenId) {
  const usedActivationToken = await runUpdateQuery(tokenId);
  return usedActivationToken;

  async function runUpdateQuery(tokenId) {
    const result = await database.query({
      text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [tokenId],
    });
    return result.rows[0];
  }
}

async function activateUser(userId) {
  const userToActivate = await user.findById(userId);
  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "You are not authorized to activate this user.",
      action: "Verify if you have the required permissions.",
    });
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

const activation = {
  sendEmailToUser,
  create,
  findByTokenId,
  use,
  activateUser,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
