const User = require("../models/user");

const pointsController = {
  getPoints: async (req, res) => {
    try {
      const { userId } = req;
      const user = await User.findById(userId);
      return res.status(200).json({ points: user.points });
    } catch (error) {
      console.error("Error getting points:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  updatePoints: async (req, res) => {
    try {
      const { userId } = req;
      const { points, reason, createNotification = true } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { points: points } },
        { new: true }
      );

      // Only create notification if flag is true
      if (createNotification) {
        await fetch(`${req.protocol}://${req.get("host")}/api/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.header("Authorization"),
          },
          body: JSON.stringify({
            userId,
            message:
              points > 0
                ? `${points} points have been credited for ${reason}.`
                : `${Math.abs(
                    points
                  )} points have been deducted for ${reason}.`,
          }),
        });
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
