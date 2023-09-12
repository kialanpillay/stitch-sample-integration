import Router from "koa-router";
import * as fs from "fs";
import {
  clientWebhookAdd,
  createRefund,
  createPaymentRequest,
  listWebhookEndpoints,
  queryStitchApi,
} from "./services/api.js";
import {
  retrieveTokenUsingClientSecret,
  retrieveTokenUsingAuthorizationCode,
  retrieveTokenUsingRefreshToken,
} from "./services/auth.js";
import { buildGraphQLOperation } from "./utils/api.js";
import {
  buildAuthorizationUrl,
  generateVerifierChallengePair,
  generateRandomStateOrNonce,
} from "./utils/auth.js";

const config = JSON.parse(
  fs.readFileSync("./secrets/client.json").toString("utf-8")
);

const REDIRECT_URI = "http://localhost:3000/return";
const SCOPES = ["client_paymentrequest"];
const WEBHOOK_URL = "https://webhook.site/5bcf2a6c-7c39-4555-bdbb-229ebc88f4ae";
const FILTER_TYPES = ["payment"];

const router = new Router();

let cache = {};

router.get("/client-token", async (ctx) => {
  try {
    let response = await retrieveTokenUsingClientSecret(
      config.client.id,
      config.secret.value,
      SCOPES
    );

    ctx.status = 200;
    ctx.body = {
      message: "Success",
      accessToken: response["access_token"],
    };
  } catch (e) {
    ctx.status = e.status || 500;
    ctx.body = `Could not request token. ${e.message}`;
  }
});

router.get("/refresh-token", async (ctx) => {
  try {
    let response = await retrieveTokenUsingRefreshToken(
      config.client.id,
      ctx.query["refresh_token"],
      config.secret.value
    );

    ctx.status = 200;
    ctx.body = {
      message: "Success",
      userToken: response["access_token"],
      refreshToken: response["refresh_token"],
    };
  } catch (e) {
    ctx.status = e.status || 500;
    ctx.body = `Could not request token. ${e.message}`;
  }
});

router.get("/user-token", async (ctx) => {
  try {
    const verifier = cache[ctx.query["state"]];
    let response = await retrieveTokenUsingAuthorizationCode(
      config.client.id,
      REDIRECT_URI,
      verifier,
      ctx.query["code"],
      config.secret.value
    );

    ctx.status = 200;
    ctx.body = {
      message: "Success",
      userToken: response["access_token"],
    };
  } catch (e) {
    ctx.status = e.status || 500;
    ctx.body = `Could not request token. ${e.message}`;
  }
});

router.get("/auth", async (ctx) => {
  let [verifier, challenge] = await generateVerifierChallengePair();
  let state = generateRandomStateOrNonce();
  let nonce = generateRandomStateOrNonce();
  cache[state] = verifier;

  ctx.status = 200;
  ctx.body = {
    url: buildAuthorizationUrl(
      config.client.id,
      challenge,
      REDIRECT_URI,
      state,
      nonce,
      SCOPES
    ),
  };
});

router.post("/subscribe-payment-request", async (ctx) => {
  try {
    ctx.body = ctx.request.body;
    const graphql = buildGraphQLOperation(
      clientWebhookAdd(WEBHOOK_URL, FILTER_TYPES),
      "clientWebhookAdd"
    );
    let response = await queryStitchApi(ctx.body["access_token"], graphql);

    ctx.status = 200;
    ctx.body = {
      message: "Success",
      id: response.id,
    };
  } catch (e) {
    ctx.status = e.status || 500;
    ctx.body = `Could not query API. ${e.message}`;
  }
});

router.post("/subscribe-refund", async (ctx) => {
  try {
    ctx.body = ctx.request.body;
    const graphql = buildGraphQLOperation(
      clientWebhookAdd(WEBHOOK_URL, ["refund"]),
      "clientWebhookAdd"
    );
    let response = await queryStitchApi(ctx.body["access_token"], graphql);

    ctx.status = 200;
    ctx.body = {
      message: "Success",
      id: response.id,
    };
  } catch (e) {
    ctx.status = e.status || 500;
    ctx.body = `${e.message}`;
  }
});

router.get("/list-webhook-endpoints", async (ctx) => {
  try {
    const graphql = buildGraphQLOperation(
      listWebhookEndpoints(FILTER_TYPES),
      "ListWebhookEndpoints"
    );
    let response = await queryStitchApi(ctx.query["access_token"], graphql);

    ctx.status = 200;
    ctx.body = {
      message: "Success",
      webhookEndpoints: response.data.client.webhookEndpoints,
    };
  } catch (e) {
    ctx.status = e.status || 500;
    ctx.body = `Could not query API. ${e.message}`;
  }
});

router.post("/create-payment-request", async (ctx) => {
  try {
    ctx.body = ctx.request.body;
    let graphql = buildGraphQLOperation(
      createPaymentRequest(
        ctx.body["amount"],
        ctx.body["payerReference"],
        ctx.body["beneficiaryReference"],
        ctx.body["externalReference"],
        ctx.body["beneficiaryName"],
        ctx.body["bankId"],
        ctx.body["beneficiaryAccountNumber"],
        ctx.body["merchant"],
        ctx.body["card"]
      ),
      "CreatePaymentRequest"
    );
    let response = await queryStitchApi(ctx.body["access_token"], graphql);

    ctx.status = 200;
    ctx.body = {
      message: "Success",
      id: response.data.clientPaymentInitiationRequestCreate
        .paymentInitiationRequest.id,
      url: response.data.clientPaymentInitiationRequestCreate
        .paymentInitiationRequest.url,
    };
  } catch (e) {
    ctx.status = e.status || 500;
    ctx.body = `Could not query API. ${e.message}`;
  }
});

router.post("/create-payment-request-bank", async (ctx) => {
  try {
    ctx.body = ctx.request.body;
    let graphql = buildGraphQLOperation(
      createPaymentRequest(
        {
          quantity: 1,
          currency: "ZAR",
        },
        "KombuchaFizz",
        "Joe-Fizz-01",
        "example",
        "FizzBuzz",
        "fnb",
        "123456789",
        "Acme Inc",
        false
      ),
      "CreatePaymentRequest"
    );
    let response = await queryStitchApi(ctx.body["access_token"], graphql);

    ctx.status = 200;
    ctx.body = {
      message: "Success",
      id: response.data.clientPaymentInitiationRequestCreate
        .paymentInitiationRequest.id,
      url: response.data.clientPaymentInitiationRequestCreate
        .paymentInitiationRequest.url,
    };
  } catch (e) {
    ctx.status = e.status || 500;
    ctx.body = `Could not query API. ${e.message}`;
  }
});

router.post("/create-refund", async (ctx) => {
  try {
    ctx.body = ctx.request.body;
    const graphql = buildGraphQLOperation(
      createRefund(
        ctx.body["amount"],
        ctx.body["refund"],
        generateRandomStateOrNonce(),
        ctx.body["reference"],
        ctx.body["id"]
      ),
      "createRefund"
    );
    let response = await queryStitchApi(ctx.body["access_token"], graphql);

    ctx.status = 200;
    ctx.body = {
      message: "Success",
      id: response.data.refund.id,
      paymentId: response.data.refund.paymentInitiationRequest.id,
    };
  } catch (e) {
    ctx.status = e.status || 500;
    ctx.body = `Could not query API. ${e.message}`;
  }
});

export default router;
