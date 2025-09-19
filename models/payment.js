const { DataTypes } = require('sequelize');
const {sequelize,testConnection} = require('../config/db');

const PaymentModel = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    amount: {
        type: DataTypes.FLOAT,

    },
    status: {
        type: DataTypes.STRING(255)

    },
    stripe_payment_id: {
        type: DataTypes.STRING(255)

    },
    price_id: {
        type: DataTypes.STRING(255)

    },
    stripe_subscription_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    user_email: {
        type: DataTypes.STRING(255)

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
        tableName: 'payments',
        timestamps: false,
        hooks: {
          beforeUpdate: (payment) => {
            payment.updated_at = new Date();
          },
        },
      }
    );
module.exports = PaymentModel;
