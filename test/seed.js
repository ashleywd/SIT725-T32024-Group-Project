const User = require('../models/User');
const Post = require('../models/Post');

const createTestData = async () => {
    try {
        // Only create test data if database is empty
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            const testUser = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword',
                points: 10
            });
            await testUser.save();
            console.log('Test user created successfully');

            const testPost = new Post({
                userId: testUser._id,
                type: 'offer',
                description: 'Test babysitting offer',
                dateTime: new Date(),
                status: 'open'
            });
            await testPost.save();
            console.log('Test post created successfully');
        }
    } catch (error) {
        console.error('Error creating test data:', error);
    }
};

module.exports = { createTestData };