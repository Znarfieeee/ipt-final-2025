const { DataTypes } = require("sequelize")

module.exports = sequelize => {
    return sequelize.define("Request", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "Pending",
        },
    })
}
