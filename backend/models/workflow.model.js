const { DataTypes } = require("sequelize")

module.exports = sequelize => {
    return sequelize.define("Workflow", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        details: {
            type: DataTypes.JSON,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "Pending",
        },
    })
}
