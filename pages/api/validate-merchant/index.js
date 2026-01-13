import https from "https";
const { createRouter } = require("next-connect");

const router = createRouter();

router.post(postHandler);

export default router.handler();

async function postHandler(request) {
  const { validationURL } = await request.body;

  const cert = process.env.APPLE_PAY_CERT.replace(/\\n/g, "\n");
  const key = process.env.APPLE_PAY_KEY.replace(/\\n/g, "\n");

  const payload = JSON.stringify({
    merchantIdentifier: "merchant.luby.test",
    displayName: "Teste Apple Pay",
    initiative: "web",
    initiativeContext:
      "clone-tabnews-git-apple-pay-test-allexis-projects.vercel.app",
  });

  return new Promise((resolve, reject) => {
    const r = https.request(
      validationURL,
      {
        method: "POST",
        cert,
        key,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": payload.length,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(new Response(data)));
      },
    );
    console.log(r);

    r.on("error", reject);
    r.write(payload);
    r.end();
  });
}
