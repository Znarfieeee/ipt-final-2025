const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "User",
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "Inactive",
      },
      verificationToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      verified: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      resetTokenExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      // Other model options
      tableName: "Users",
      timestamps: true, // Adds createdAt and updatedAt
    }
  );

  // Add method to check if user is verified
  User.prototype.isVerified = function () {
    return !!this.verified;
  };

  return User;
};
