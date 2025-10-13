test("GET to /api/v1/status should return 200", async () => {
  expect.assertions(2);
  const response = await fetch("http://localhost:3000/api/v1/status");
  const json = await response.json();
  expect(response.status).toBe(200);
  expect(json).toEqual({ status: "ok" });
});
