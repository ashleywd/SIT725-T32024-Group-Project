const User = require("../models/user");

const pointsController = {
  checkPoints: async (userId, pointsNeeded) => {
    try {
      const user = await User.findById(userId);
      return user.points >= pointsNeeded;
    } catch (error) {
      console.error("Error checking points:", error);
      return false;
    }
  },

  updatePoints: async (userId, pointsChange) => {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { points: pointsChange } },
        { new: true }
      );
      return user.points;
    } catch (error) {
      console.error("Error updating points:", error);
      throw error;
    }
  }
};

module.exports = pointsController;