const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const UserModel = require("./user");

const ResumeModel = sequelize.define(
  "Resume",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING(500),
      allowNull: false,

    },
    generatedUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "resumes",
    timestamps: false,
  }
);

// Define relationship
ResumeModel.belongsTo(UserModel, { foreignKey: "userId" });
UserModel.hasMany(ResumeModel, { foreignKey: "userId" });

module.exports = ResumeModel;
