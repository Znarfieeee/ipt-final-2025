module.exports = validateSchema;

function validateSchema(schema) {
  return (req, res, next) => {
    const options = {
      abortEarly: false, // Include all errors
      allowUnknown: true, // ignore unknown props
      stripUnknown: true, // remove unknown props
    };

    const { error, value } = schema.validate(req.body, options);

    if (error) {
      const errorMessage = `Validation error: ${error.details
        .map((x) => x.message)
        .join(", ")}`;
      return res.status(400).json({ message: errorMessage });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
}
