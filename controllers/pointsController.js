const User = require("../models/user");

const pointsController = {
  checkPoints: async (userId, pointsNeeded) => {
    try {
      const user = await User.findById(userId);
      console.log("Points Check:", {
        userPoints: user.points,
        pointsNeeded: pointsNeeded,
        hasEnough: user.points >= pointsNeeded,
      });
      return user.points >= pointsNeeded;
    } catch (error) {
      console.error("Error checking points:", error);
      return false;
    }
  },

  updatePoints: async (userId, pointsChange) => {
    try {
      console.log("Points Update:", {
        userId,
        pointsChange,
        operation: pointsChange > 0 ? "add" : "subtract",
      });
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { points: pointsChange } },
        { new: true }
      );
      console.log("New points balance:", user.points);
      return user.points;
    } catch (error) {
      console.error("Error updating points:", error);
      throw error;
    }
  },
};

module.exports = pointsController;
