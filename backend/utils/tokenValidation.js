import jwt from "jsonwebtoken";

export function validateToken(token, app) {
  if (!token) throw new Error("No JWT token provided");
  const tokenNaked = token.slice(7, token.length); // strip "Bearer " from the start

  const jwksClient = app.get("jwks_client");

  function getKey(header, callback) {
    jwksClient.getSigningKey(header.kid, function (err, key) {
      var signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  }

  jwt.verify(tokenNaked, getKey, {}, function (err, decoded) {
    if (err) throw err;
    console.log("Verified a new token for user", decoded.email); // not sure if we need this log
  });
}
