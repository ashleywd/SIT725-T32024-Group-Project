const Notification = require("../models/notification");

const notificationController = {
  createNotification: async (req, res) => {
    try {
      const { userId, message } = req.body;
      const newNotification = new Notification({
        userId,
        message,
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
      const notifications = await Notification.find({
        $or: [{ userId }, { isGlobal: true }],
      });

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
      const userId = req.userId;
      await Notification.updateMany(
        { userId },
        { status: "seen" },
        { new: true }
      );

      res.status(200).json({ message: "Notifications marked as seen" });
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
      const { notificationId } = req.params;
      await Notification.findByIdAndDelete(notificationId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting notification:", error);
      res
        .status(500)
        .json({ message: "Error deleting notification", error: error.message });
    }
  },
  notifyPointsChange: async (userId, points, reason) => {
    const isDeduction = points < 0;
    const message = isDeduction
      ? `${Math.abs(points)} points have been deducted for ${reason}.`
      : `${points} points have been credited for ${reason}.`;

    await notificationController.createNotification(
      {
        body: {
          userId,
          message,
        },
      },
      { status: () => ({ json: () => {} }) }
    );
  },

  notifyStatusChange: async (userId, post, status) => {
    let message;
    const dateString = new Date(post.dateTime).toLocaleString();

    if (status === "accepted") {
      if (post.type === "offer") {
        message =
          userId === post.postedBy
            ? `Your babysitting offer for ${dateString} has been accepted.`
            : `You have accepted a babysitting offer for ${dateString}.`;
      } else {
        message =
          userId === post.postedBy
            ? `Your request for a babysitter on ${dateString} has been accepted.`
            : `You have accepted to provide babysitting on ${dateString}.`;
      }
    } else if (status === "completed") {
      if (post.type === "offer") {
        message =
          userId === post.postedBy
            ? `Your babysitting offer for ${dateString} has been marked as completed.`
            : `The babysitting offer you accepted for ${dateString} has been completed.`;
      } else {
        message =
          userId === post.postedBy
            ? `Your babysitting request for ${dateString} has been completed.`
            : `The babysitting session you provided on ${dateString} has been marked as completed.`;
      }
    } else if (status === "cancelled") {
      if (post.type === "offer") {
        message =
          userId === post.postedBy
            ? `Your babysitting offer for ${dateString} has been cancelled.`
            : `The babysitting offer you accepted for ${dateString} has been cancelled.`;
      } else {
        message =
          userId === post.postedBy
            ? `Your babysitting request for ${dateString} has been cancelled.`
            : `The babysitting request you accepted for ${dateString} has been cancelled.`; // Missing this message
      }
    }

    await notificationController.createNotification(
      {
        body: {
          userId,
          message,
        },
      },
      { status: () => ({ json: () => {} }) }
    );
  },
};

module.exports = notificationController;
