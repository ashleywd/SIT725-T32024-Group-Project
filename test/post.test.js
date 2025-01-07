const mongoose = require('mongoose');
const Post = require('../models/post');

describe('Post Model Test', () => {
    beforeAll(async () => {
        await mongoose.connect('mongodb://127.0.0.1:27017/testDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    it('should create a post successfully', async () => {
        const validPost = new Post({
            postedBy: new mongoose.Types.ObjectId(),
            type: 'offer',
            description: 'This is a test description',
            dateTime: new Date(),
            hoursNeeded: 5,
        });
        const savedPost = await validPost.save();

        expect(savedPost._id).toBeDefined();
        expect(savedPost.type).toBe('offer');
        expect(savedPost.status).toBe('open');
    });

    it('should fail when required fields are missing', async () => {
        const invalidPost = new Post({});
        let err;
        try {
            await invalidPost.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.type).toBeDefined();
        expect(err.errors.description).toBeDefined();
    });

    it('should enforce "type" enum values', async () => {
        const invalidPost = new Post({
            postedBy: new mongoose.Types.ObjectId(),
            type: 'invalidType',
            description: 'Invalid type test',
            dateTime: new Date(),
            hoursNeeded: 2,
        });
        let err;
        try {
            await invalidPost.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.type).toBeDefined();
    });
});
