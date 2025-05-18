const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validateRequest = require("../_middleware/validate-request");
const validateSchema = require("../_middleware/validate-schema");
const authorize = require("../_middleware/authorize");
const Role = require("../_helpers/role");
const accountService = require("./index.service");
const Joi = require("joi");

// Validation schemas
const loginValidation = [
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const registerValidation = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn([Role.Admin, Role.User])
    .withMessage("Invalid role"),
];

const updateValidation = [
  body("firstName")
    .optional()
    .notEmpty()
    .withMessage("First name cannot be empty"),
  body("lastName")
    .optional()
    .notEmpty()
    .withMessage("Last name cannot be empty"),
  body("email").optional().isEmail().withMessage("Enter a valid email"),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn([Role.Admin, Role.User])
    .withMessage("Invalid role"),
];

// Joi schema definitions
const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
});

const revokeTokenSchema = Joi.object({
  token: Joi.string().empty(""),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const validateResetTokenSchema = Joi.object({
  token: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
});

// Routes
router.post("/authenticate", validateRequest(loginValidation), authenticate);
router.post("/register", validateRequest(registerValidation), register);
router.post("/verify-email", validateSchema(verifyEmailSchema), verifyEmail);
router.post(
  "/resend-verification",
  validateSchema(resendVerificationSchema),
  resendVerification
);
router.post("/refresh-token", refreshToken);
router.post(
  "/revoke-token",
  authorize(),
  validateSchema(revokeTokenSchema),
  revokeToken
);

// Profile management routes
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
});

router.post(
  "/change-password",
  authorize(),
  validateSchema(changePasswordSchema),
  changePassword
);

router.get("/sessions", authorize(), getSessions);
router.delete("/sessions/:id", authorize(), revokeSession);
router.post("/sessions/revoke-all", authorize(), revokeAllSessions);

// Original routes
router.get("/", authorize(Role.Admin), getAll);
router.get("/:id", authorize(), getById);
router.put("/:id", authorize(), updateValidation, update);
router.put("/:id/toggle-status", authorize(Role.Admin), toggleActiveStatus);
router.delete("/:id", authorize(), _delete);

// Additional routes for backward compatibility
router.post("/login", validateRequest(loginValidation), authenticate);
router.post(
  "/",
  authorize(Role.Admin),
  validateRequest(registerValidation),
  create
);

// Additional users routes to match frontend expectations - keeping for compatibility
router.get("/users", authorize(Role.Admin), getAll);
router.get("/users/:id", authorize(), getById);
router.post(
  "/users",
  authorize(Role.Admin),
  validateRequest(registerValidation),
  create
);
router.put("/users/:id", authorize(), updateValidation, update);
router.delete("/users/:id", authorize(), _delete);

// Adding account routes for compatibility - No authentication for testing
router.get("/accounts", authorize(), async (req, res) => {
  try {
    const accounts = await accountService.getAll();
    return res.status(200).json(accounts);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching accounts",
      error: error.message || "Unknown error",
    });
  }
});

// Add root auth endpoint for compatibility
router.get("/", authorize(), async (req, res) => {
  try {
    const accounts = await accountService.getAll();
    return res.status(200).json(accounts);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching accounts",
      error: error.message || "Unknown error",
    });
  }
});

// Special test endpoint that doesn't use authorization
router.get("/test-users", (req, res) => {
  try {
    accountService
      .getAll()
      .then((accounts) => {
        return res.status(200).json(accounts);
      })
      .catch((error) => {
        return res.status(500).json({
          message: "Error fetching users",
          error: error.toString(),
        });
      });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err.toString(),
    });
  }
});

// Forgot/reset password routes
router.post(
  "/forgot-password",
  validateSchema(forgotPasswordSchema),
  forgotPassword
);
router.post(
  "/validate-reset-token",
  validateSchema(validateResetTokenSchema),
  validateResetToken
);
router.post(
  "/reset-password",
  validateSchema(resetPasswordSchema),
  resetPassword
);

module.exports = router;

function authenticateSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
  const { email, password } = req.body;
  const ipAddress = req.ip;
  accountService
    .authenticate({ email, password, ipAddress })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken);
      // Make sure we send both jwtToken and token (for backward compatibility)
      return res.json({
        ...account,
        token: account.jwtToken, // Add token field to match frontend expectations
        user: {
          id: account.id,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
          status: account.status,
          title: account.title,
        },
      });
    })
    .catch(next);
}

function refreshToken(req, res, next) {
  // Get token from request body or cookie
  const token = req.body.token || req.cookies.refreshToken;
  const ipAddress = req.ip;

  if (!token) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  accountService
    .refreshToken({ token, ipAddress })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken);
      // Make sure we send both jwtToken and token (for backward compatibility)
      return res.json({
        ...account,
        token: account.jwtToken, // Add token field to match frontend expectations
        user: {
          id: account.id,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
          status: account.status,
          title: account.title,
        },
      });
    })
    .catch(next);
}

function revokeToken(req, res, next) {
  // accept token from request body or cookie
  const token = req.body.token || req.cookies.refreshToken;
  const ipAddress = req.ip;

  if (!token) return res.status(400).json({ message: "Token is required" });

  // users can revoke their own tokens and admins can revoke any tokens
  if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  accountService
    .revokeToken({ token, ipAddress })
    .then(() => res.json({ message: "Token revoked" }))
    .catch(next);
}

function registerSchema(req, res, next) {
  const schema = Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    acceptTerms: Joi.boolean().valid(true).required(),
  });
  validateRequest(req, next, schema);
}

function register(req, res, next) {
  accountService
    .register(req.body, req.get("origin"))
    .then((result) => res.json(result))
    .catch(next);
}

function verifyEmail(req, res, next) {
  accountService
    .verifyEmail(req.body.token)
    .then((result) => res.json(result))
    .catch(next);
}

function resendVerification(req, res, next) {
  accountService
    .resendVerificationEmail(req.body.email, req.get("origin"))
    .then((result) => res.json(result))
    .catch(next);
}

function forgotPassword(req, res, next) {
  accountService
    .forgotPassword(req.body, req.get("origin"))
    .then(() =>
      res.json({
        message: "Please check your email for password reset instructions",
      })
    )
    .catch(next);
}

function validateResetToken(req, res, next) {
  accountService
    .validateResetToken(req.body)
    .then(() => res.json({ message: "Token is valid" }))
    .catch(next);
}

function resetPassword(req, res, next) {
  accountService
    .resetPassword(req.body)
    .then(() =>
      res.json({ message: "Password reset successful, you can now login" })
    )
    .catch(next);
}

function getAll(req, res, next) {
  try {
    accountService
      .getAll()
      .then((accounts) => {
        if (!accounts || !Array.isArray(accounts)) {
          return res.status(500).json({
            message: "User data is not in expected format",
          });
        }

        // Return as-is if response is good
        if (
          accounts.length > 0 &&
          accounts.every((user) => typeof user === "object" && user !== null)
        ) {
          return res.json(accounts);
        } else {
          // Fallback to a standard response if we get weird data
          const standardizedAccounts = accounts.map((account) => {
            if (typeof account !== "object" || account === null) {
              return {
                id: 0,
                error: "Invalid user data",
              };
            }
            return account;
          });
          return res.json(standardizedAccounts);
        }
      })
      .catch((error) => {
        return res.status(500).json({
          message: "Error fetching users",
          error: error.toString(),
        });
      });
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  accountService
    .getById(req.params.id)
    .then((account) => res.json(account))
    .catch(next);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    role: Joi.string().valid(Role.Admin, Role.User).required(),
    isActive: Joi.boolean().default(true),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  accountService
    .create(req.body)
    .then((account) => res.json(account))
    .catch(next);
}

function updateSchema(req, res, next) {
  const schemaRules = {
    title: Joi.string().empty(""),
    firstName: Joi.string().empty(""),
    lastName: Joi.string().empty(""),
    email: Joi.string().email().empty(""),
    password: Joi.string().min(6).empty(""),
    confirmPassword: Joi.string().valid(Joi.ref("password")).empty(""),
  };

  // only admins can update role
  if (req.user.role === Role.Admin) {
    schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty("");
  }

  const schema = Joi.object(schemaRules).with("password", "confirmPassword");
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  // users can update their own account and admins can update any account
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  accountService
    .update(req.params.id, req.body)
    .then((account) => res.json(account))
    .catch(next);
}

function toggleActiveStatus(req, res, next) {
  accountService
    .update(req.params.id, { status: req.body.status })
    .then((account) => res.json(account))
    .catch(next);
}

function _delete(req, res, next) {
  // users can delete their own account and admins can delete any account
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  accountService
    .delete(req.params.id)
    .then(() => res.json({ message: "Account deleted successfully" }))
    .catch(next);
}

function setTokenCookie(res, token) {
  // create cookie with refresh token that expires in 7 days
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  };
  res.cookie("refreshToken", token, cookieOptions);
}

function changePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  accountService
    .changePassword(req.user.id, currentPassword, newPassword)
    .then(() => res.json({ message: "Password changed successfully" }))
    .catch(next);
}

function getSessions(req, res, next) {
  accountService
    .getRefreshTokens(req.user.id)
    .then((tokens) => res.json(tokens))
    .catch(next);
}

function revokeSession(req, res, next) {
  accountService
    .revokeRefreshToken(req.params.id, req.ip)
    .then(() => res.json({ message: "Session revoked successfully" }))
    .catch(next);
}

function revokeAllSessions(req, res, next) {
  accountService
    .revokeAllRefreshTokens(req.user.id, req.ip)
    .then(() => res.json({ message: "All sessions revoked successfully" }))
    .catch(next);
}
