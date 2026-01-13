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
  let dataResponse = null;

  const req = https.request(
    validationURL,
    {
      method: "POST",
      cert,
      key,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: 5000,
    },
    (response) => {
      let data = "";
      console.log("initial data", data);

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        console.log("data", data);
        dataResponse = data;
        response.status(200).json(JSON.parse(data));
      });
    },
  );

  req.on("finish", () => {
    console.log("finish");
    response.status(200).json(JSON.parse(dataResponse));
  });

  req.on("timeout", () => {
    req.destroy();
    response.status(504).json({ error: "Apple validation timeout" });
  });

  req.on("error", (err) => {
    console.error("Apple Pay validation error:", err);
    response.status(500).json({ error: "Merchant validation failed" });
  });

  req.write(payload);
  req.end();

  if (dataResponse) {
    return response.status(200).json(JSON.parse(dataResponse));
  }
}
