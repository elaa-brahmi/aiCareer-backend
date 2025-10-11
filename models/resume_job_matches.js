const { DataTypes } = require('sequelize');
const {sequelize,testConnection} = require('../config/db');
const JobModel = require('./job')
const UserModel = require('./user')
const ResumeModel = require('./resume')
const MatchesJobs = sequelize.define(
    'jobMatches',
    {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,

        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        jobId: {
            type: DataTypes.BIGINT,
            allowNull: false,

        },
        resumeId:{
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title:{
            type: DataTypes.STRING(255),
            allowNull: true,

        },
        description:{
            type: DataTypes.TEXT,
            allowNull: true,

        },
        url:{
            type: DataTypes.STRING(255),
            allowNull: true,

        },
        company:{
            type: DataTypes.STRING(255),
            allowNull: true,

        },
        location:{
            type: DataTypes.STRING(255),
            allowNull: true,

        },
        companyLogo:{
            type: DataTypes.STRING(255),
            allowNull: true,

        },
        postedAt:{
            type: DataTypes.DATE,
            allowNull: true,
        },
        score:{
            type: DataTypes.FLOAT,
        }

    },
    {
        tableName: 'jobMatches',
        timestamps: false,
    }
);
ResumeModel.belongsTo(UserModel, { foreignKey: "userId" });
UserModel.hasMany(ResumeModel, { foreignKey: "userId" });
MatchesJobs.belongsTo(JobModel, { foreignKey: 'jobId' });
JobModel.hasMany(MatchesJobs, { foreignKey: 'jobId' });
MatchesJobs.belongsTo(UserModel, { foreignKey: 'userId' });
UserModel.hasMany(MatchesJobs, { foreignKey: 'userId' });
module.exports= MatchesJobs