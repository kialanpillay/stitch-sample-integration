export function buildGraphQLOperation(operation, name) {
  return JSON.stringify({
    query: operation.query,
    variables: operation.variables,
    operationName: name,
  });
}
