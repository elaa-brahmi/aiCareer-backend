const { DataTypes } = require('sequelize');
const {sequelize,testConnection} = require('../config/db');
const notificationModel = sequelize.define(
    'notification',
    {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        seen: {
            type: DataTypes.BOOLEAN,
            defaultValue:false
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,


        }
    },
    {
        tableName: 'notifications',
        timestamps: false,
    }
);

module.exports = notificationModel;