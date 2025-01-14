const Notification = require("../models/notifications");

const notificationController = {
  createNotification: async (req, res) => {
    try {
      const { userId, description, dateTime } = req.body;
      const newNotification = new Notification({
        userId,
        description,
        dateTime,
      });
      const savedNotification = await newNotification.save();
      res.status(201).json(savedNotification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res
        .status(500)
        .json({ message: "Error creating notification", error: error.message });
    }
  },

  getNotifications: async (req, res) => {
    try {
      const userId = req.userId;
      const notifications = await Notification.find({ userId });
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        message: "Error fetching notifications",
        error: error.message,
      });
    }
  },

  updateNotificationStatus: async (req, res) => {
    try {
      const { notificationId, status } = req.body;
      const updatedNotification = await Notification.findByIdAndUpdate(
        notificationId,
        { status },
        { new: true },
      );
      res.status(200).json(updatedNotification);
    } catch (error) {
      console.error("Error updating notification status:", error);
      res.status(500).json({
        message: "Error updating notification status",
        error: error.message,
      });
    }
  },

  deleteNotification: async (req, res) => {
    try {
      const { notificationId } = req.body;
      await Notification.findByIdAndDelete(notificationId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting notification:", error);
      res
        .status(500)
        .json({ message: "Error deleting notification", error: error.message });
    }
  },
};

module.exports = notificationController;
