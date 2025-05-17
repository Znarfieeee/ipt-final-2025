const { DataTypes } = require("sequelize")

module.exports = sequelize => {
    return sequelize.define("RequestItem", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        requestId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Requests',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        }
    })
}
