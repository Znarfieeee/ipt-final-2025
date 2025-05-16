const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const RefreshToken = sequelize.define(
    "RefreshToken",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      expires: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdByIp: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      revoked: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      revokedByIp: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      replacedByToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "RefreshTokens",
      timestamps: true,
    }
  );

  // Define virtual property isExpired
  RefreshToken.prototype.isExpired = function () {
    return Date.now() >= this.expires;
  };

  // Define virtual property isActive
  RefreshToken.prototype.isActive = function () {
    return !this.revoked && !this.isExpired;
  };

  console.log("RefreshToken model initialized");
  return RefreshToken;
};
