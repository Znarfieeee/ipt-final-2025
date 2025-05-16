const { DataTypes } = require("sequelize")

module.exports = sequelize => {
    return sequelize.define("Employee", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        employeeId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        position: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        DepartmentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        hireDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "Active",
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    })
}
