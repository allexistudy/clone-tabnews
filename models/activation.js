import database from "infra/database";
import email from "infra/email";
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

async function findByUserId(userId) {
  const activationToken = await runSelectQuery(userId);
  return activationToken;

  async function runSelectQuery(userId) {
    const result = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        user_id = $1
      LIMIT
        1
      ;`,
      values: [userId],
    });
    return result.rows[0];
  }
}

const activation = {
  sendEmailToUser,
  create,
  findByUserId,
};

export default activation;
