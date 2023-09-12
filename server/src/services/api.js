import fetch from "node-fetch";
import { ApiError } from "../utils/error.js";

export async function queryStitchApi(accessToken, graphql) {
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", `Bearer ${accessToken}`);

  const requestOptions = {
    credentials: "include",
    method: "POST",
    headers: myHeaders,
    body: graphql,
    mode: "cors",
  };

  const response = await fetch(
    "https://api.stitch.money/graphql",
    requestOptions
  );

  const responseBody = await response.json();
  console.log(responseBody);
  if ("errors" in responseBody) {
    responseBody.errors.forEach((e) => console.log(e));
    throw new ApiError(
      responseBody.errors[0].message,
      responseBody.errors[0].extensions.status
    );
  }

  return responseBody;
}

export function clientWebhookAdd(url, filterTypes) {
  const query = `
    mutation clientWebhookAdd($url: URL!, $filterTypes: [String!]!) {
        clientWebhookAdd(input: {
          url: $url,
          filterTypes: $filterTypes
        }) {
          url
          filterTypes
          secret
          id
        }
      }
    `;

  const variables = {
    url: url,
    filterTypes: filterTypes,
  };

  return {
    query: query,
    variables: variables,
  };
}

export function listWebhookEndpoints(filter) {
  const query = `
    query ListWebhookEndpoints($filter: [String!]!) {
        client {
          webhookEndpoints(filter: $filter) {
            filterTypes
            id
            url
          }
        }
      }
      `;

  const variables = {
    filter: filter,
  };

  return {
    query: query,
    variables: variables,
  };
}

export function createPaymentRequest(
  amount,
  payerReference = null,
  beneficiaryReference = null,
  externalReference,
  beneficiaryName = null,
  beneficiaryBankId = null,
  beneficiaryAccountNumber = null,
  merchant,
  card = true
) {
  if (card) {
    const query = `
    mutation CreatePaymentRequest(
        $amount: MoneyInput!,
        $externalReference: String,
        $merchant: String,
        $card: Boolean
        ) {
      clientPaymentInitiationRequestCreate(input: {
          amount: $amount,
          externalReference: $externalReference,
          merchant: $merchant,
          paymentMethods: {
            card: { enabled: $card }
          }
        }) {
        paymentInitiationRequest {
          id
          url
        }
      }
    }
        `;
  } else {
    const query = `
    mutation CreatePaymentRequest(
        $amount: MoneyInput!,
        $payerReference: String!,
        $beneficiaryReference: String!,
        $externalReference: String,
        $beneficiaryName: String!,
        $beneficiaryBankId: BankBeneficiaryBankId!,
        $beneficiaryAccountNumber: String!,
        $merchant: String,
        $card: Boolean
        ) {
      clientPaymentInitiationRequestCreate(input: {
          amount: $amount,
          payerReference: $payerReference,
          beneficiaryReference: $beneficiaryReference,
          externalReference: $externalReference,
          beneficiary: {
              bankAccount: {
                  name: $beneficiaryName,
                  bankId: $beneficiaryBankId,
                  accountNumber: $beneficiaryAccountNumber
              }
          },
          merchant: $merchant,
          paymentMethods: {
            card: { enabled: $card }
          }
        }) {
        paymentInitiationRequest {
          id
          url
        }
      }
    }
        `;
  }

  const variables = {
    amount: amount,
    payerReference: payerReference,
    beneficiaryReference: beneficiaryReference,
    externalReference: externalReference,
    beneficiaryName: beneficiaryName,
    beneficiaryBankId: beneficiaryBankId,
    beneficiaryAccountNumber: beneficiaryAccountNumber,
    merchant: merchant,
    card: card,
  };

  return {
    query: query,
    variables: variables,
  };
}

export function createRefund(
  amount,
  reason,
  nonce,
  beneficiaryReference,
  paymentRequestId
) {
  const query = `
    mutation createRefund(
        $amount: MoneyInput!,
        $reason: RefundReason!,
        $nonce: String!,
        $beneficiaryReference: String!,
        $paymentRequestId: ID!
    ) {
      clientRefundInitiate(input: {
          amount: $amount,
          reason: $reason,
          nonce: $nonce,
          beneficiaryReference: $beneficiaryReference,
          paymentRequestId: $paymentRequestId
        }) {
        refund {
          id
          paymentInitiationRequest {
            id
          }
        }
      }
    } `;

  const variables = {
    amount: amount,
    reason: reason,
    nonce: nonce,
    beneficiaryReference: beneficiaryReference,
    paymentRequestId: paymentRequestId,
  };

  return {
    query: query,
    variables: variables,
  };
}
