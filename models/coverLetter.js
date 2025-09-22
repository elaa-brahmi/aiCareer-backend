const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const UserModel = require("./user");

const CoverLetterModel = sequelize.define(
  "CoverLetter",
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    tableName: "cover_letters",
    timestamps: false,
  }
);

// Define relationship
CoverLetterModel.belongsTo(UserModel, { foreignKey: "userId" });
UserModel.hasMany(CoverLetterModel, { foreignKey: "userId" });

module.exports = CoverLetterModel;
