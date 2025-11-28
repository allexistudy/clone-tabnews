import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    function requestOptions(body) {
      return {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      };
    }
    const endpointUrl = "http://localhost:3000/api/v1/users";

    test("With unique and valid data", async () => {
      const request1Options = requestOptions({
        username: "allex",
        email: "allex@example.com",
        password: "password",
      });

      const response = await fetch(endpointUrl, request1Options);
      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "allex",
        email: "allex@example.com",
        password: responseBody.password,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDb = await user.getByUsername("allex");
      const correctPasswordMatch = await password.compare(
        "password",
        userInDb.password,
      );
      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "incorrect-password",
        userInDb.password,
      );
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("With duplicated 'email'", async () => {
      const request1Options = requestOptions({
        username: "duplicated-email",
        email: "duplicated-email@example.com",
        password: "password",
      });

      const response1 = await fetch(endpointUrl, request1Options);
      expect(response1.status).toBe(201);

      const request2Options = requestOptions({
        username: "duplicated-email2",
        email: "Duplicated-email@example.com",
        password: "password",
      });

      const response2 = await fetch(endpointUrl, request2Options);
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "Email already exists",
        action: "Try a different email",
        status_code: 400,
      });
    });

    test("With duplicated 'username'", async () => {
      const request1Options = requestOptions({
        username: "duplicated-username",
        email: "duplicated-username@example.com",
        password: "password",
      });

      const response1 = await fetch(endpointUrl, request1Options);
      expect(response1.status).toBe(201);

      const request2Options = requestOptions({
        username: "Duplicated-username",
        email: "duplicated-username2@example.com",
        password: "password",
      });

      const response2 = await fetch(endpointUrl, request2Options);
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "Username already exists",
        action: "Try a different username",
        status_code: 400,
      });
    });
  });

  describe("Authenticated user", () => {
    test("With unique and valid data", async () => {
      const createdUser = await orchestrator.createUser({});
      await orchestrator.activateUserByUserId(createdUser.id);
      const userSession = await orchestrator.createSession(createdUser.id);

      const headers = new Headers();
      headers.set("Cookie", `session_id=${userSession.token}`);
      headers.set("Content-Type", "application/json");

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: "authenticated-user",
          email: "authenticated-user@example.com",
          password: "password",
        }),
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You are not authorized to access this resource.",
        action: "Verify if you have the required permissions.",
        status_code: 403,
      });
    });
  });
});
