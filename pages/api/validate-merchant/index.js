import https from "https";
const { createRouter } = require("next-connect");

const router = createRouter();

router.post(postHandler);

export default router.handler();

async function postHandler(request, response) {
  const { validationURL } = await request.body;
  if (!validationURL) {
    return response.status(400).json({ error: "validationURL is required" });
  }

  const cert = process.env.APPLE_PAY_CERT.replace(/\\n/g, "\n");
  const key = process.env.APPLE_PAY_KEY.replace(/\\n/g, "\n");

  const payload = JSON.stringify({
    merchantIdentifier: "merchant.luby.test",
    displayName: "Teste Apple Pay",
    initiative: "web",
    initiativeContext:
      "clone-tabnews-git-apple-pay-test-allexis-projects.vercel.app",
  });

  try {
    const agent = new https.Agent({ cert, key });

    const appleResponse = await fetch(validationURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      agent,
    });

    if (!appleResponse.ok) {
      const text = await appleResponse.text();
      console.error("Apple error:", text);
      return response.status(500).json({ error: "Apple validation failed" });
    }

    const merchantSession = await appleResponse.json();
    console.log("merchantSession", merchantSession);
    return response.status(200).json(merchantSession);
  } catch (err) {
    console.error("Validate merchant error:", err);
    return response.status(500).json({ error: "Internal error" });
  }
}
