const { default: orchestrator } = require("tests/orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const data = {
        username: "same-case",
        email: "same-case@example.com",
        password: "password",
      };

      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const endpointUrl = `http://localhost:3000/api/v1/users/${data.username}`;
      const response = await fetch(endpointUrl);
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: data.username,
        email: data.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("With case mismatch", async () => {
      const data = {
        username: "Different-Case",
        email: "different-case@example.com",
        password: "password",
      };

      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const endpointUrl = `http://localhost:3000/api/v1/users/${data.username.toLowerCase()}`;
      const response = await fetch(endpointUrl);
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: data.username,
        email: data.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("With non-existent username", async () => {
      const username = "non-existent";

      const endpointUrl = `http://localhost:3000/api/v1/users/${username}`;
      const response = await fetch(endpointUrl);
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "User not found",
        action: "Try a different username",
        status_code: 404,
      });
    });
  });
});
