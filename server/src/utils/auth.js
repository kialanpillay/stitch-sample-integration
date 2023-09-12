import crypto from "crypto";

async function sha256(verifier) {
  const msgBuffer = new TextEncoder("utf-8").encode(verifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

  return new Uint8Array(hashBuffer);
}

export async function generateVerifierChallengePair() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64UrlEncode(randomBytes);
  const challenge = await sha256(verifier).then(base64UrlEncode);

  return [verifier, challenge];
}

function base64UrlEncode(byteArray) {
  const charCodes = String.fromCharCode(...byteArray);
  return Buffer.from(charCodes, "binary")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generateRandomStateOrNonce() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return base64UrlEncode(randomBytes);
}

export function buildAuthorizationUrl(
  clientId,
  challenge,
  redirectUri,
  state,
  nonce,
  scopes
) {
  const search = {
    client_id: clientId,
    code_challenge: challenge,
    code_challenge_method: "S256",
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
    response_type: "code",
    nonce: nonce,
    state: state,
  };
  const searchString = Object.entries(search)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `https://secure.stitch.money/connect/authorize?${searchString}`;
}
