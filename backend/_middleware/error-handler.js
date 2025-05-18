module.exports = errorHandler;

function errorHandler(err, req, res, next) {
  // Log the error for debugging
  console.error("Global error handler:", err);

  // Format the error message
  let message;
  let status = 500; // Default to internal server error

  if (typeof err === "string") {
    // Custom error message as a string
    message = err;
    status = 400; // Bad request
  } else if (err.name === "ValidationError") {
    // Validation errors
    message = err.message;
    status = 400;
  } else if (err.name === "UnauthorizedError") {
    // JWT authentication error
    message = "Unauthorized";
    status = 401;
  } else if (err.message.includes("not verified")) {
    // Email verification errors
    message = err.message;
    status = 401;
  } else if (
    err.message.includes("inactive") ||
    err.message.includes("suspended")
  ) {
    // Account status errors
    message = err.message;
    status = 403;
  } else if (err.message) {
    // Any other error with a message
    message = err.message;
    status = err.status || 400;
  } else {
    // Fallback for unknown errors
    message = "An unexpected error occurred";
  }

  // Return error response
  return res.status(status).json({
    success: false,
    message: message,
  });
}
