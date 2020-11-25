var jwksClient = require("jwks-rsa");

export async function initializeApp(app, kubeconfig) {
  app.set("token_cache", []);
  try {
    const clusterUrl = kubeconfig.getCurrentCluster().server;
    const url = `https://dex.${clusterUrl.slice(12, clusterUrl.length)}/keys`;

    const client = jwksClient({
      jwksUri: url,
    });

    app.set("jwks_client", client);
    console.log("✔️  Setting up jwksClient ended with success");
  } catch (e) {
    console.error("❌ Setting up jwksClient ended with error ", e);
  }
}
