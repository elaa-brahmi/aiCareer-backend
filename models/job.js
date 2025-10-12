const { DataTypes } = require('sequelize');
const {sequelize,testConnection} = require('../config/db');
const JobModel = sequelize.define(
    'Job',
    {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        company: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        applyUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        companyLogo: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        companyLinkedinUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        posted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
       
        source: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        tableName: 'jobs',
        timestamps: false,
    }
);

module.exports = JobModel;