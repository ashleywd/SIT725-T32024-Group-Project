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

        res.status(200).json({
            name: user.name,
            email: user.email,
            points: user.points,
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id); // Example for MongoDB ObjectId

module.exports = { getAccountDetails };
