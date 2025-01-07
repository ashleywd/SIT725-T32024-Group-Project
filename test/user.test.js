const mongoose = require('mongoose');
const User = require('../models/user'); 

describe('User Model Test', () => {
    beforeAll(async () => {
        await mongoose.connect('mongodb://127.0.0.1:27017/testDB');

        await User.syncIndexes();
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    it('should create a user successfully', async () => {
        const validUser = new User({
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'password123',
        });
        const savedUser = await validUser.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.username).toBe('testuser');
        expect(savedUser.email).toBe('testuser@example.com');
    });

    it('should fail when required fields are missing', async () => {
        const invalidUser = new User({});
        let err;
        try {
            await invalidUser.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.username).toBeDefined();
        expect(err.errors.email).toBeDefined();
        expect(err.errors.password).toBeDefined();
    });

    it('should enforce unique email and username', async () => {
        await User.deleteMany({}); 

        const user1 = new User({
            username: 'duplicateuser',
            email: 'duplicate@example.com',
            password: 'password123',
        });
        await user1.save();

        const user2 = new User({
            username: 'duplicateuser',
            email: 'duplicate@example.com',
            password: 'password456',
        });

        let err;
        try {
            await user2.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.code).toBe(11000); // MongoDB duplicate key error code
    });
});
