const { DataTypes } = require('sequelize');
const {sequelize,testConnection} = require('../config/db');

const UserModel = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    lastName: {
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
    last_reset_weekly_covers: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Date.now()

  },
  last_reset_monthly_resume_upload: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Date.now()


  },
    accessToken: {type: DataTypes.STRING(255), default:""},
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true, // Nullable for OAuth users
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    stripe_subscription_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
      type: DataTypes.STRING(500),
      defaultValue: 'free',
    },
      price_id: {
        type: DataTypes.STRING(255)

    },
    plan_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status:{
      type: DataTypes.STRING(500),
      defaultValue: 'inactive',

    },
    stripe_customer_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
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
