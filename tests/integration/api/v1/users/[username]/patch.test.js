import password from "models/password";
import user from "models/user";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With non-existent username", async () => {
      const username = "non-existent";
      const endpointUrl = `http://localhost:3000/api/v1/users/${username}`;
      const response = await fetch(endpointUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "User not found",
        action: "Try a different username",
        status_code: 404,
      });
    });

    test("With username case mismatch", async () => {
      const username = "different-username";
      await orchestrator.createUser({ username });

      const endpointUrl2 = `http://localhost:3000/api/v1/users/${username}`;
      const response = await fetch(endpointUrl2, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.toUpperCase(),
        }),
      });

      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Username already exists",
        action: "Try a different username",
        status_code: 400,
      });
    });

    test('With duplicated "username"', async () => {
      const username = "duplicated-username";
      await orchestrator.createUser({ username });

      const endpointUrl2 = `http://localhost:3000/api/v1/users/${username}`;
      const response = await fetch(endpointUrl2, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Username already exists",
        action: "Try a different username",
        status_code: 400,
      });
    });

    test('With duplicated "email"', async () => {
      const email = "duplicated-email@example.com";
      const createdUser = await orchestrator.createUser({ email });

      const endpointUrl2 = `http://localhost:3000/api/v1/users/${createdUser.username}`;
      const response = await fetch(endpointUrl2, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Email already exists",
        action: "Try a different email",
        status_code: 400,
      });
    });

    test('With unique "username"', async () => {
      const username = "unique-username";
      const createdUser = await orchestrator.createUser({ username });

      const endpointUrl2 = `http://localhost:3000/api/v1/users/${username}`;
      const response = await fetch(endpointUrl2, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: `${username}-different` }),
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: `${username}-different`,
        email: createdUser.email,
        password: responseBody.password,
        features: [],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test('With unique "email"', async () => {
      const createdUser = await orchestrator.createUser({
        email: "unique-email@example.com",
      });

      const endpointUrl2 = `http://localhost:3000/api/v1/users/${createdUser.username}`;
      const response = await fetch(endpointUrl2, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "unique-email-different@example.com" }),
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: `unique-email-different@example.com`,
        password: responseBody.password,
        features: [],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test('With new "password"', async () => {
      const createdUser = await orchestrator.createUser({
        password: "new-password",
      });

      const endpointUrl2 = `http://localhost:3000/api/v1/users/${createdUser.username}`;
      const response = await fetch(endpointUrl2, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: "new-password-different" }),
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: createdUser.email,
        password: responseBody.password,
        features: [],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      const userInDb = await user.getByUsername(createdUser.username);
      const correctPasswordMatch = await password.compare(
        "new-password-different",
        userInDb.password,
      );
      const incorrectPasswordMatch = await password.compare(
        "new-password",
        userInDb.password,
      );
      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
