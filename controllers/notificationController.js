const { getIO } = require("../config/socket");
const {getConnectedSocketByUserId} = require('../socket/socket')
const notificationModel = require('../models/notification')
const sendNotification = async (userId, message) => {
    const io = getIO();
    console.log('user id from send notifs',userId)
    const notification = await notificationModel.create({
        userId: userId,
        message,
      });
      
  
    const connectedSocket = getConnectedSocketByUserId(userId);
    console.log('connected socket',connectedSocket)
  
    console.log("Sending notification to user:", userId);
  
    if (connectedSocket) {
      io.to(connectedSocket.socketId).emit("new-notification", notification);
      console.log("User is connected and notification sent");
    } else console.log("User is not connected");
  };
  const sendTestNotification = async (req, res) => {
    try {
      const { userId } = req.params;
  
      const message = "This is a test notification";
      await sendNotification(userId, message);
      return res.status(200).json({ message: "Notification sent" });
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  };
  const markAsRead = async (req, res) => {
    try {
      const { notificationId } = req.params;
      const notification = await notificationModel.findByPk(notificationId);
      if (!notification)
        return res.status(404).json({ message: "Notification not found" });
  
      if (notification.userId !== req.user.id)
        return res.status(403).json({ message: "Unauthorized" });
  
      notification.seen = true;
      await notification.save();
      return res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
  const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await notificationModel.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        });
        return res.status(200).json({ notifications });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
  };
  module.exports={getNotifications,markAsRead,sendTestNotification,sendNotification}