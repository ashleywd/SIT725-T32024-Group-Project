const UserModel = require("../models/user");

const getAccountDetails = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      userId: user._id,
      name: user.username,
      email: user.email,
      points: user.points,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAccountDetailsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      userId: user._id,
      name: user.username,
      email: user.email,
      points: user.points,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateAccountDetails = async (req, res) => {
  try {
    const { userId } = req;
    const { username, email } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // Validate required fields
    if (!username && !email) {
      return res
        .status(400)
        .json({
          error:
            "At least one field (name or email) must be provided for update",
        });
    }

    const updateFields = {
        username,
        email,
    };

    // Update user details
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }, // Return updated user and apply schema validation
    );

    res.status(200).json({
      message: "Account updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating account:", err); // Log the error
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // Delete user from the database
    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAccountPoints = async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // Find user and retrieve points
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ points: user.points });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAccountDetails,
  updateAccountDetails,
  deleteAccount,
  getAccountPoints,
  getAccountDetailsByUserId,
};
