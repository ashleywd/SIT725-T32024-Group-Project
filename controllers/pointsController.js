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
  },
  handleRequestPoints: async (userId, pointsNeeded) => {
    const hasEnoughPoints = await pointsController.checkPoints(
      userId,
      pointsNeeded
    );
    if (!hasEnoughPoints) {
      throw new Error("You do not have enough points to create this request.");
    }
    // Single point deduction
    await pointsController.updatePoints(userId, -pointsNeeded);
    return true;
  },

  handleOfferPoints: async (userId, pointsNeeded) => {
    const hasEnoughPoints = await pointsController.checkPoints(
      userId,
      pointsNeeded
    );
    if (!hasEnoughPoints) {
      throw new Error("Not enough points to accept offer");
    }
    await pointsController.updatePoints(userId, -pointsNeeded);
    return true;
  },
};

module.exports = pointsController;
