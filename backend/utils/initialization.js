var jwksClient = require("jwks-rsa");
import https from "https";
import fs from "fs";

export async function initializeApp(app, kubeconfig) {
  app.set("token_cache", []);
  try {
    const clusterUrl = kubeconfig.getCurrentCluster().server;
    const url = process.env.jwksUri || `https://dex.${clusterUrl.slice(12, clusterUrl.length)}/keys`;

    const client = jwksClient({
      jwksUri: url,
    });
    await client.getKeysAsync(); // check if uri is correct
    app.set("jwks_client", client);
    console.log("✔️  Setting up jwksClient ended with success", url);
  } catch (e) {
    console.error("❌ Setting up jwksClient ended with error ", e);
  }

  try {
    const caPath = kubeconfig.getCurrentCluster().caFile;
    if (!caPath) throw new Error("No certificate provided");

    const cert = fs.readFileSync(caPath, "utf8");
    const sslConfiguredAgent = new https.Agent({
      ca: cert,
    });

    app.set("https_agent", sslConfiguredAgent);
    console.log("✔️  Setting up https HTTPS agent");
  } catch (e) {
    console.error("❌ Setting up https HTTPS agent ended with error; an insecure connection will be used.");
  }
}
