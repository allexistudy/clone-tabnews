import database from "infra/database";
import email from "infra/email";
import { NotFoundError } from "infra/errors";
import webserver from "infra/webserver";

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

const activation = {
  sendEmailToUser,
  create,
  findByTokenId,
};

export default activation;
