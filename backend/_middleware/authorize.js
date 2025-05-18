const jwt = require("jsonwebtoken");
const db = require("../_helpers/db");
const config = require("../config.js");

module.exports = authorize;

function authorize(roles = []) {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return [
    // authenticate JWT token and attach user to request object (req.user)
    async (req, res, next) => {
      try {
        // Check for development mode skip auth
        if (config.development?.skipAuth === true) {
          // Use a dummy admin user
          req.user = {
            id: 1,
            role: "Admin",
          };
          return next();
        }

        // Check for token in Authorization header or cookies
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.token;

        // Get token from either source
        let token;
        if (authHeader?.startsWith("Bearer ")) {
          token = authHeader.split(" ")[1];
        } else if (cookieToken) {
          token = cookieToken;
        }

        // No token found
        if (!token) {
          return res
            .status(401)
            .json({ message: "No authentication token provided" });
        }

        // Verify token
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET || config.secret || "sample-key"
        );

        // get user with their role
        const user = await db.User.findByPk(payload.id);

        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        // check if user's role is in the authorized roles
        if (roles.length && !roles.includes(user.role)) {
          return res.status(403).json({ message: "Insufficient privileges" });
        }

        req.user = user;
        next();
      } catch (err) {
        // Check for development mode skip auth after error
        if (config.development?.skipAuth === true) {
          // Use a dummy admin user
          req.user = {
            id: 1,
            role: "Admin",
          };
          return next();
        }

        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Token expired" });
        } else if (err.name === "JsonWebTokenError") {
          return res.status(401).json({ message: "Invalid token" });
        }

        return res.status(500).json({
          message: "Authentication error",
          details: err.message,
        });
      }
    },
  ];
}
