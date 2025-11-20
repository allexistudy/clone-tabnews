import setCookieParser from "set-cookie-parser";
import session from "models/session";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Authenticated user", () => {
    test("With non existent session", async () => {
      const token =
        "f44157b87bb55b44adec55c4e57c0bc3195aab757c6518d2f9b996cb0451a5990c7dc3e29475f0766fe3bda1d59a1eda";

      const headers = new Headers();
      headers.set("Cookie", `session_id=${token}`);
      headers.set("Content-Type", "application/json");

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers,
      });
      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Authentication failed",
        action: "Verify if the user is authenticated",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });
      const createdUser = await orchestrator.createUser({
        username: "user-with-expired-session",
      });
      const createdSession = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const headers = new Headers();
      headers.set("Cookie", `session_id=${createdSession.token}`);
      headers.set("Content-Type", "application/json");

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers,
      });
      expect(response.status).toBe(401);
    });

    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "user-with-valid-session",
      });
      const createdSession = await orchestrator.createSession(createdUser.id);

      const headers = new Headers();
      headers.set("Cookie", `session_id=${createdSession.token}`);
      headers.set("Content-Type", "application/json");

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers,
      });
      expect(response.status).toBe(200);

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });
      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        path: "/",
        maxAge: -1,
        httpOnly: true,
      });

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: createdSession.id,
        user_id: createdUser.id,
        token: createdSession.token,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(
        responseBody.expires_at < createdSession.expires_at.toISOString(),
      ).toBe(true);
      expect(
        responseBody.updated_at > createdSession.updated_at.toISOString(),
      ).toBe(true);

      const showUser = await fetch("http://localhost:3000/api/v1/user", {
        headers,
      });
      expect(showUser.status).toBe(401);

      const responseShowUserBody = await showUser.json();
      expect(responseShowUserBody).toEqual({
        name: "UnauthorizedError",
        message: "Authentication failed",
        action: "Verify if the user is authenticated",
        status_code: 401,
      });
    });
  });
});
