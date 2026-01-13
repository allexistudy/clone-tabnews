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
    const merchantSession = await new Promise((resolve, reject) => {
      const appleReq = https.request(
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
        (appleRes) => {
          let data = "";

          appleRes.on("data", (chunk) => {
            data += chunk;
          });

          appleRes.on("end", () => {
            try {
              console.log("data", data);
              resolve(JSON.parse(data));
            } catch (err) {
              console.log("err", err);
              reject(new Error("Invalid JSON from Apple"));
            }
          });
        },
      );

      appleReq.on("timeout", () => {
        appleReq.destroy();
        reject(new Error("Apple validation timeout"));
      });

      appleReq.on("error", reject);

      appleReq.write(payload);
      appleReq.end();
    });

    return response.status(200).json(merchantSession);
  } catch (err) {
    console.error("Validate merchant error:", err);
    return response.status(500).json({ error: err.message });
  }
}
