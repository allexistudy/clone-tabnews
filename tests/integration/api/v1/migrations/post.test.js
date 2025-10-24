import database from "infra/database";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await database.query("drop schema public cascade; create schema public;");
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("for the first time", async () => {
        const endpointUrl = "http://localhost:3000/api/v1/migrations";
        const fetchOptions = { method: "POST" };

        const response1 = await fetch(endpointUrl, fetchOptions);
        expect(response1.status).toBe(201);

        const response1Body = await response1.json();
        expect(Array.isArray(response1Body)).toBe(true);
        expect(response1Body.length).toBeGreaterThan(0);
      });

      test("for the second time", async () => {
        const endpointUrl = "http://localhost:3000/api/v1/migrations";
        const fetchOptions = { method: "POST" };

        const response2 = await fetch(endpointUrl, fetchOptions);
        expect(response2.status).toBe(200);

        const response2Body = await response2.json();
        expect(Array.isArray(response2Body)).toBe(true);
        expect(response2Body.length).toBe(0);
      });
    });
  });
});
