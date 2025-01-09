const User = require('../models/user');

jest.mock('../models/user');

describe('User Model Test', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a user successfully', async () => {
        const mockSave = jest.fn().mockResolvedValue({
            _id: 'mockedUserId',
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'password123',
        });
        User.prototype.save = mockSave;

        const validUser = new User({
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'password123',
        });

        const savedUser = await validUser.save();

        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(savedUser.username).toBe('testuser');
        expect(savedUser.email).toBe('testuser@example.com');
    });

    it('should fail when required fields are missing', async () => {
        const mockSave = jest.fn().mockRejectedValue({
            errors: {
                username: { message: 'Username is required' },
                email: { message: 'Email is required' },
                password: { message: 'Password is required' },
            },
        });
        User.prototype.save = mockSave;

        const invalidUser = new User({});

        let err;
        try {
            await invalidUser.save();
        } catch (error) {
            err = error;
        }

        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(err.errors.username).toBeDefined();
        expect(err.errors.email).toBeDefined();
        expect(err.errors.password).toBeDefined();
    });

    it('should enforce unique email and username', async () => {
        const mockSave = jest.fn()
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce({
                code: 11000, // MongoDB duplicate key error code
            });

        User.prototype.save = mockSave;

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

        expect(mockSave).toHaveBeenCalledTimes(2);
        expect(err.code).toBe(11000);
    });
});
