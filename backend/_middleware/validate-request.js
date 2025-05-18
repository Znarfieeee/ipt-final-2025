const { validationResult } = require("express-validator");

function validateRequest(validations) {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      errors: errors.array(),
    });
  };
}

module.exports = validateRequest;
