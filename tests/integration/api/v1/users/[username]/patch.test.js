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
      const endpointUrl = "http://localhost:3000/api/v1/users";
      await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email: "different-username@example.com",
          password: "password",
        }),
      });

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
      const endpointUrl = "http://localhost:3000/api/v1/users";
      await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email: "duplicated-username@example.com",
          password: "password",
        }),
      });

      const endpointUrl2 = `http://localhost:3000/api/v1/users/${username}`;
      const response = await fetch(endpointUrl2, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
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

    test('With duplicated "email"', async () => {
      const email = "duplicated-email@example.com";
      const endpointUrl = "http://localhost:3000/api/v1/users";
      await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicated-email",
          email,
          password: "password",
        }),
      });

      const endpointUrl2 = `http://localhost:3000/api/v1/users/duplicated-email`;
      const response = await fetch(endpointUrl2, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
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
      const endpointUrl = "http://localhost:3000/api/v1/users";
      await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email: "unique-username@example.com",
          password: "password",
        }),
      });

      const endpointUrl2 = `http://localhost:3000/api/v1/users/${username}`;
      const response = await fetch(endpointUrl2, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: `${username}-different`,
        }),
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: `${username}-different`,
        email: "unique-username@example.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test('With unique "email"', async () => {
      const endpointUrl = "http://localhost:3000/api/v1/users";
      await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "unique-email",
          email: "unique-email@example.com",
          password: "password",
        }),
      });

      const endpointUrl2 = `http://localhost:3000/api/v1/users/unique-email`;
      const response = await fetch(endpointUrl2, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `unique-email-different@example.com`,
        }),
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "unique-email",
        email: `unique-email-different@example.com`,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test('With new "password"', async () => {
      const endpointUrl = "http://localhost:3000/api/v1/users";
      await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "new-password",
          email: "new-password@example.com",
          password: "new-password",
        }),
      });

      const endpointUrl2 = `http://localhost:3000/api/v1/users/new-password`;
      const response = await fetch(endpointUrl2, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: `new-password-different`,
        }),
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "new-password",
        email: "new-password@example.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      const userInDb = await user.getByUsername("new-password");
      const correctPasswordMatch = await password.compare(
        `new-password-different`,
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
