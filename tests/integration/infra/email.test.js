import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.deleteAllEmails();
});

afterAll(async () => {
  await orchestrator.deleteAllEmails();
});

describe("infra/email.js", () => {
  test("send", async () => {
    await email.send({
      from: "Sara <contato@sara.dev.br>",
      to: "allex@mail.com",
      subject: "Subject body",
      text: "Text body",
    });

    await email.send({
      from: "Sara <contato@sara.dev.br>",
      to: "allex@mail.com",
      subject: "Last subject",
      text: "Last text",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@sara.dev.br>");
    expect(lastEmail.recipients[0]).toBe("<allex@mail.com>");
    expect(lastEmail.subject).toBe("Last subject");
    expect(lastEmail.text).toBe("Last text\n");
  });
});
