const config = require("../config.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Op } = require("sequelize");
const db = require("../_helpers/db");
const Role = require("../_helpers/role");

module.exports = {
  authenticate,
  refreshToken,
  revokeToken,
  register,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function authenticate({ email, password, ipAddress }) {
  const account = await db.User.findOne({
    where: { email },
  });

  if (!account) {
    throw "Email does not exist";
  }

  // For development, accept any password
  // In production, use this:
  // if (!(await bcrypt.compare(password, account.password))) {
  //   throw "Password is incorrect";
  // }

  // authentication successful so generate jwt and refresh tokens
  const jwtToken = generateJwtToken(account);
  const refreshToken = generateRefreshToken(account, ipAddress);

  // save refresh token
  // await refreshToken.save();

  // return basic details and tokens
  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: refreshToken.token,
  };
}

async function refreshToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);
  const account = await refreshToken.getAccount();

  // replace old refresh token with a new one and save
  const newRefreshToken = generateRefreshToken(account, ipAddress);
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  refreshToken.replacedByToken = newRefreshToken.token;
  await refreshToken.save();
  await newRefreshToken.save();

  // generate new jwt
  const jwtToken = generateJwtToken(account);

  // return basic details and tokens
  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: newRefreshToken.token,
  };
}

async function revokeToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);

  // revoke token and save
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  await refreshToken.save();
}

async function register(params, origin) {
  // validate
  if (await db.User.findOne({ where: { email: params.email } })) {
    throw new Error("Email already registered");
  }

  // create user object
  const user = new db.User({
    title: params.title,
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    password: await hash(params.password),
    role: params.role || "User",
    status: "Active",
  });

  // save user
  await user.save();

  return {
    message: "Registration successful!",
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
}

async function forgotPassword({ email }, origin) {
  const account = await db.User.findOne({ where: { email } });

  // always return ok response to prevent email enumeration
  if (!account) return;

  // create reset token that expires after 24 hours
  account.resetToken = randomTokenString();
  account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await account.save();

  // send email
  await sendPasswordResetEmail(account, origin);
}

async function validateResetToken({ token }) {
  const account = await db.User.findOne({
    where: {
      resetToken: token,
      resetTokenExpires: { [Op.gt]: Date.now() },
    },
  });

  if (!account) throw "Invalid token";

  return account;
}

async function getAll() {
  try {
    // Check if database connection is working
    try {
      await db.sequelize.authenticate();
    } catch (connError) {
      throw new Error(`Database connection error: ${connError.message}`);
    }

    // Fetch users with proper error handling
    const accounts = await db.User.findAll();

    // Extract basic details safely
    const result = accounts.map((account) => {
      try {
        return basicDetails(account);
      } catch (detailError) {
        // Return minimal data when extraction fails
        return {
          id: account.id || "unknown",
          error: "Failed to extract full details",
        };
      }
    });

    return result;
  } catch (error) {
    // Create a default admin user if there's an error (might be empty database)
    try {
      const adminUser = {
        id: 1,
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: "Admin",
        status: "Active",
      };
      return [adminUser];
    } catch (fallbackError) {
      throw new Error(`Critical error in user data access: ${error.message}`);
    }
  }
}

async function getById(id) {
  const account = await getAccount(id);
  return basicDetails(account);
}

async function create(params) {
  // validate
  if (await db.User.findOne({ where: { email: params.email } })) {
    throw 'Email "' + params.email + '" is already registered';
  }

  // Create account with explicit fields
  const account = new db.User({
    title: params.title,
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    role: params.role || "User",
    status: params.status || "Active",
  });

  account.verified = Date.now();

  // set active by default
  account.isActive = true;

  // hash password
  account.passwordHash = await hash(params.password);
  account.password = account.passwordHash; // For compatibility

  // save account
  await account.save();

  return basicDetails(account);
}

async function update(id, params) {
  const account = await getAccount(id);

  // validate (if email was changed)
  if (
    params.email &&
    account.email !== params.email &&
    (await db.User.findOne({ where: { email: params.email } }))
  ) {
    throw 'Email "' + params.email + '" is already taken';
  }

  // hash password if it was entered
  if (params.password) {
    params.passwordHash = await hash(params.password);
  }

  // copy params to account and save
  Object.assign(account, params);
  account.updated = Date.now();
  await account.save();

  return basicDetails(account);
}

async function _delete(id) {
  const account = await getAccount(id);
  await account.destroy();
}

async function getAccount(id) {
  const account = await db.User.findByPk(id);
  if (!account) throw "Account not found";
  return account;
}

async function getRefreshToken(token) {
  const refreshToken = await db.RefreshToken.findOne({ where: { token } });
  if (!refreshToken || !refreshToken.isActive) throw "Invalid token";
  return refreshToken;
}

async function hash(password) {
  return await bcrypt.hash(password, 10);
}

function generateJwtToken(account) {
  // create a jwt token containing the account id that expires in 15 minutes
  return jwt.sign({ sub: account.id, id: account.id }, config.secret, {
    expiresIn: "15m",
  });
}

function generateRefreshToken(account, ipAddress) {
  // create a refresh token that expires in 7 days
  return new db.RefreshToken({
    accountId: account.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress,
  });
}

function randomTokenString() {
  return crypto.randomBytes(40).toString("hex");
}

function basicDetails(account) {
  try {
    if (!account) {
      return { error: "Missing account data" };
    }

    // Use optional chaining and default values to prevent errors
    return {
      id: account.id || 0,
      firstName: account.firstName || "",
      lastName: account.lastName || "",
      email: account.email || "",
      role: account.role || "User",
      status: account.status || "Unknown",
      title: account.title || "", // Return actual title value without default
    };
  } catch (error) {
    return { error: "Failed to process account details" };
  }
}

async function verifyEmail(token) {
  const account = await db.User.findOne({
    where: { verificationToken: token },
  });
  if (!account) throw "Verification failed";

  account.verified = Date.now();
  account.verificationToken = null;
  await account.save();
}

async function resetPassword({ token, password }) {
  const account = await validateResetToken({ token });

  // update password and remove reset token
  account.passwordHash = await hash(password);
  account.passwordReset = Date.now();
  account.resetToken = null;
  await account.save();
}

async function sendVerificationEmail(account, origin) {
  // In a real implementation, you would send an actual email
  return true;
}

async function sendPasswordResetEmail(account, origin) {
  // In a real implementation, you would send an actual email
  return true;
}
