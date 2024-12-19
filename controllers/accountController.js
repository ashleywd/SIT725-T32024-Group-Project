// controllers/accountController.js

const UserModel = require('../models/user');

const getAccountDetails = async (req, res) => {
    try {
        if (!req.userId || !isValidObjectId(req.userId)) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        const user = await UserModel.findById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userDetails = {
            name: user.username,
            email: user.email,
            points: user.points,
        };

        res.status(200).json(userDetails);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateAccountDetails = async (req, res) => {
    try {
        const { userId } = req;
        const { name, email } = req.body;

        // Validate userId
        if (!userId || !isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        // Validate required fields
        if (!name && !email) {
            return res.status(400).json({ error: 'At least one field (name or email) must be provided for update' });
        }

        // Update user details
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { ...(name && { name }), ...(email && { email }) },
            { new: true, runValidators: true } // Return updated user and apply schema validation
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'Account updated successfully',
            user: updatedUser,
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const { userId } = req;

        // Validate userId
        if (!userId || !isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        // Delete user from the database
        const deletedUser = await UserModel.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getAccountPoints = async (req, res) => {
    try {
        const { userId } = req;

        // Validate userId
        if (!userId || !isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        // Find user and retrieve points
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ points: user.points });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id); // Example for MongoDB ObjectId

module.exports = { getAccountDetails,updateAccountDetails, deleteAccount, getAccountPoints };
