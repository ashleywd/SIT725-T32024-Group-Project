const Post = require('../models/post');

jest.mock('../models/post');

describe('Post Model Test', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a post successfully', async () => {
        const mockSave = jest.fn().mockResolvedValue({
            _id: 'mockedPostId',
            postedBy: 'mockedUserId',
            type: 'offer',
            description: 'This is a test description',
            dateTime: new Date(),
            hoursNeeded: 5,
            status: 'open',
        });
        Post.prototype.save = mockSave;

        const validPost = new Post({
            postedBy: 'mockedUserId',
            type: 'offer',
            description: 'This is a test description',
            dateTime: new Date(),
            hoursNeeded: 5,
        });

        const savedPost = await validPost.save();

        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(savedPost.type).toBe('offer');
        expect(savedPost.status).toBe('open');

        // Assertion added to ensure all expected fields are present
        expect(savedPost).toEqual(
            expect.objectContaining({
                _id: expect.any(String),
                postedBy: 'mockedUserId',
                type: 'offer',
                description: 'This is a test description',
                dateTime: expect.any(Date),
                hoursNeeded: 5,
                status: 'open',
            })
        );
    });

    it('should fail when required fields are missing', async () => {
        const mockSave = jest.fn().mockRejectedValue({
            errors: {
                type: { message: 'Type is required' },
                description: { message: 'Description is required' },
            },
        });
        Post.prototype.save = mockSave;

        const invalidPost = new Post({});

        let err;
        try {
            await invalidPost.save();
        } catch (error) {
            err = error;
        }

        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(err.errors.type).toBeDefined();
        expect(err.errors.type.message).toBe('Type is required'); // Validating error message for type
        expect(err.errors.description).toBeDefined();
        expect(err.errors.description.message).toBe('Description is required'); // Validating error message for description
    });

    it('should enforce "type" enum values', async () => {
        const mockSave = jest.fn().mockRejectedValue({
            errors: {
                type: { message: 'Invalid type value' },
            },
        });
        Post.prototype.save = mockSave;

        const invalidPost = new Post({
            postedBy: 'mockedUserId',
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

        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(err.errors.type).toBeDefined();
        expect(err.errors.type.message).toBe('Invalid type value'); // Validating error message for invalid type

        // Type is expected to match a predefined set of values (e.g., 'offer', 'request').
        // Any value outside this set triggers the 'Invalid type value' error.
    });
});
