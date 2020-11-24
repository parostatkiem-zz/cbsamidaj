import jwt from "jsonwebtoken";

export async function validateToken(token, app) {
  if (!token) throw new Error("No JWT token provided");
  const tokenNaked = token.slice(7, token.length); // strip "Bearer " from the start
  // todo cache
  const jwksClient = app.get("jwks_client");

  function getKey(header, callback) {
    jwksClient.getSigningKey(header.kid, function (err, key) {
      var signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  }

  const verifyJWKS = new Promise(function (resolve, reject) {
    jwt.verify(tokenNaked, getKey, {}, function (err, decoded) {
      if (err) reject(err);
      console.log("Verified a new token for user", decoded.email); // not sure if we need this log

      resolve(decoded);
    });
  });

  const tokenVerified = await verifyJWKS;

  return tokenVerified.email;
}
