import jwt from "jsonwebtoken";

const CACHE_KEY = "token_cache";

const hasCachedTokenExpired = ({ expires }) => new Date(expires * 1000) <= new Date();

async function addTokenToCache(tokenData, app) {
  const filteredCache = app.get(CACHE_KEY).filter((t) => !hasCachedTokenExpired(t)); // filter out all expired tokens from cache to save memory
  app.set(CACHE_KEY, [...filteredCache, tokenData]);
}

export async function validateToken(token, app) {
  if (!token) throw new Error("No JWT token provided");
  const tokenNaked = token.startsWith("Bearer ") ? token.slice(7, token.length) : token; // strip "Bearer " from the start
  const tokenFromCache = app.get(CACHE_KEY).find((t) => t.token === tokenNaked);
  if (tokenFromCache && !hasCachedTokenExpired(tokenFromCache)) {
    // verified from cache
    console.log("token verified from cache"); // Even more not sure if we need this log...
    return tokenFromCache.email;
  }

  const jwksClient = app.get("jwks_client");

  function getKey(header, callback) {
    jwksClient.getSigningKey(header.kid, function (err, key) {
      if (err) {
        callback(err, null);
        return;
      }
      var signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  }

  const verifyJWKS = new Promise(function (resolve, reject) {
    jwt.verify(tokenNaked, getKey, {}, function (err, decoded) {
      if (err) {
        console.error(err);
        reject("Token verification failed"); // todo: throw a 401 in this case
      }
      console.log("Verified and cached a new token for user", decoded.email); // not sure if we need this log
      addTokenToCache({ token: tokenNaked, email: decoded.email, expires: decoded.exp }, app);
      resolve(decoded);
    });
  });

  const tokenVerified = await verifyJWKS;

  return tokenVerified.email;
}
