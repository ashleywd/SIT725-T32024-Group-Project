// controllers/accountController.js

const UserModel = require('../models/user');

const getAccountDetails = async (req, res) => {
    try {
        console.log('req.userId:', req.userId);
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

module.exports = { getAccountDetails };
