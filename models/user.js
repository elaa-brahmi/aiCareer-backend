const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserModel = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true, // Nullable for OAuth users
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    github_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    plan: {
      type: DataTypes.ENUM('free', 'premium'),
      defaultValue: 'free',
    },
    plan_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    uploads_this_month: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    cover_letters_this_week: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    chat_messages_this_week: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'users',
    timestamps: false,
    hooks: {
      beforeUpdate: (user) => {
        user.updated_at = new Date();
      },
    },
  }
);

module.exports = UserModel;
