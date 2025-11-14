import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import password from "./password";

async function create(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery({ username, email, password }) {
    const newUser = await database.query({
      text: `
      INSERT INTO
        users (username, email, password)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
    ;`,
      values: [username, email.toLowerCase(), password],
    });

    return newUser.rows[0];
  }
}

async function getByUsername(username) {
  const foundUser = await runSelectQuery(username);
  return foundUser;

  async function runSelectQuery(username) {
    const result = await database.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT
          1
      ;`,
      values: [username],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "User not found",
        action: "Try a different username",
      });
    }

    return result.rows[0];
  }
}

async function update(username, userInputValues) {
  const currentUser = await getByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userToUpdate = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userToUpdate);
  return updatedUser;

  async function runUpdateQuery(userToUpdate) {
    const updatedUser = await database.query({
      text: `
      UPDATE
        users
      SET
        username = $2,
        email = $3,
        password = $4,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [
        userToUpdate.id,
        userToUpdate.username,
        userToUpdate.email,
        userToUpdate.password,
      ],
    });

    return updatedUser.rows[0];
  }
}

async function validateUniqueUsername(username) {
  const result = await database.query({
    text: `
      SELECT
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
    ;`,
    values: [username],
  });

  if (result.rowCount > 0) {
    throw new ValidationError({
      message: "Username already exists",
      action: "Try a different username",
    });
  }
}

async function validateUniqueEmail(email) {
  const result = await database.query({
    text: `
      SELECT
        email
      FROM
        users
      WHERE
        email = LOWER($1)
    ;`,
    values: [email],
  });

  if (result.rowCount > 0) {
    throw new ValidationError({
      message: "Email already exists",
      action: "Try a different email",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

const user = {
  create,
  getByUsername,
  update,
};

export default user;
