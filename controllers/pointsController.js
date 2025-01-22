const User = require("../models/user");

const pointsController = {
  getPoints: async (req, res) => {
    try {
      const { userId } = req;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({ points: user.points });
    } catch (error) {
      console.error("Error getting points:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  updatePoints: async (req, res) => {
    try {
      const { points, recipientId } = req.body;
      const targetUserId = recipientId || req.userId;

      const user = await User.findByIdAndUpdate(
        targetUserId,
        { $inc: { points: points } },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({
        points: user.points,
        message: "Points updated successfully",
      });
    } catch (error) {
      console.error("Error updating points:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = pointsController;
