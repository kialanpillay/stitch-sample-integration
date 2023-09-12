export function ApiError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

ApiError.prototype = Object.create(Error.prototype);

export function AuthError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

AuthError.prototype = Object.create(Error.prototype);
