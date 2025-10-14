const auth = require('../middleware/auth');
const express = require('express');
const {getNotifications,markAsRead,sendTestNotification,sendNotification}  = require('../controllers/notificationController');

const NotificationRouter = express.Router();
NotificationRouter.post('/mark-as-read/{notificationId}', auth,  markAsRead)
NotificationRouter.get('/all', auth, getNotifications)

module.exports = NotificationRouter