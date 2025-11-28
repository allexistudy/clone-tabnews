import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With non-existent token", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/activations/a38b4b86-7da7-431f-8acb-7660d916c600",
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Activation token not found",
        action: "Try a different token",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({});
      const createdActivation = await activation.create(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${createdActivation.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Activation token not found",
        action: "Try a different token",
        status_code: 404,
      });
    });

    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser({});
      const createdActivation = await activation.create(createdUser.id);
      await activation.use(createdActivation.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${createdActivation.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Activation token not found",
        action: "Try a different token",
        status_code: 404,
      });
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser({});
      const createdActivation = await activation.create(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${createdActivation.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: createdActivation.id,
        user_id: createdUser.id,
        used_at: responseBody.used_at,
        expires_at: createdActivation.expires_at.toISOString(),
        created_at: createdActivation.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDb = await user.findById(createdUser.id);
      expect(userInDb.features).toEqual(["create:session", "read:session"]);
    });

    test("With valid token but user already activated", async () => {
      const createdUser = await orchestrator.createUser({});
      const createdActivation = await activation.create(createdUser.id);
      await activation.activateUser(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${createdActivation.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You are not authorized to activate this user.",
        action: "Verify if you have the required permissions.",
        status_code: 403,
      });

      const userInDb = await user.findById(createdUser.id);
      expect(userInDb.features).toEqual(["create:session", "read:session"]);
    });
  });

  describe("Authenticated user", () => {
    test("With valid token, but logged user", async () => {
      const user1 = await orchestrator.createUser({});
      await orchestrator.activateUserByUserId(user1.id);
      const user1Session = await orchestrator.createSession(user1.id);

      const user2 = await orchestrator.createUser({});
      const user2Activation = await activation.create(user2.id);

      const headers = new Headers();
      headers.set("Cookie", `session_id=${user1Session.token}`);
      headers.set("Content-Type", "application/json");

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${user2Activation.id}`,
        {
          method: "PATCH",
          headers,
        },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You are not authorized to access this resource.",
        action: "Verify if you have the required permissions.",
        status_code: 403,
      });

      const user2InDb = await user.findById(user2.id);
      expect(user2InDb.features).toEqual(["read:activation_token"]);
    });
  });
});
