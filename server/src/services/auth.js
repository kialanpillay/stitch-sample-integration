import { AuthError } from "../utils/error.js";

export async function retrieveTokenUsingClientSecret(clientId, clientSecret, scopes) {
  const body = {
    grant_type: "client_credentials",
    client_id: clientId,
    scope: scopes.join(" "),
    audience: "https://secure.stitch.money/connect/token",
    client_secret: clientSecret,
  };

  const bodyString = Object.entries(body)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const response = await fetch("https://secure.stitch.money/connect/token", {
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyString,
  });

  const responseBody = await response.json();
  console.log("Tokens: ", responseBody);
  if ("errors" in responseBody) {
    throw new AuthError(
      responseBody.errors[0].message,
      responseBody.errors[0].extensions.status
    );
  }
  
  return responseBody;
}

export async function retrieveTokenUsingAuthorizationCode(
  clientId,
  redirectUri,
  verifier,
  code,
  clientSecret
) {
  const body = {
    grant_type: "authorization_code",
    client_id: clientId,
    code: code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
    client_secret: clientSecret,
  };
  const bodyString = Object.entries(body)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const response = await fetch("https://secure.stitch.money/connect/token", {
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyString,
  });

  const responseBody = await response.json();
  console.log("Tokens: ", responseBody);
  if ("errors" in responseBody) {
    throw new AuthError(
      responseBody.errors[0].message,
      responseBody.errors[0].extensions.status
    );
  }

  return responseBody;
}

export async function retrieveTokenUsingRefreshToken(
  clientId,
  refreshToken,
  clientSecret
) {
  const body = {
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
    client_secret: clientSecret,
  };
  const bodyString = Object.entries(body)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const response = await fetch("https://secure.stitch.money/connect/token", {
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyString,
  });

  const responseBody = await response.json();
  console.log("Token Response: ", responseBody);
  if ("errors" in responseBody) {
    throw new AuthError(
      responseBody.errors[0].message,
      responseBody.errors[0].extensions.status
    );
  }
  
  return responseBody;
}
